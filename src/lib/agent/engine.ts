/**
 * The agent loop — one implementation for streaming and JSON responses.
 *
 * Contract:
 *  - `history` is the conversation's stored API transcript; this function
 *    only ever APPENDS to it (returned as `newEntries`). Never edit earlier
 *    entries: thinking blocks are bound to the exact prefix they were made in.
 *  - Read tools run immediately (fanned out across accounts in multi-account
 *    mode). Write tools are turned into pending proposals for the user to
 *    approve — they never run inside this loop (upload tools excepted).
 *  - Spend is capped per turn (MAX_TURN_COST_CENTS, MAX_TOOL_ROUNDS).
 */
import type Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient } from '@/lib/anthropic';
import { executeTool } from '@/lib/tool-executor';
import { isWriteTool, TARGET_ACCOUNT_PARAM } from '@/lib/tool-policy';
import { costCents } from '@/lib/pricing';
import type { Tenant } from '@/lib/tenants';
import type { StreamEvent, ToolCall } from '@/types/chat';
import {
  AGENT_BETAS,
  AGENT_MODEL,
  DEFAULT_EFFORT,
  MAX_OUTPUT_TOKENS,
  MAX_TOOL_ROUNDS,
  MAX_TURN_COST_CENTS,
  TURN_TASK_BUDGET_TOKENS,
} from './config';
import { buildSystem } from './prompt';
import { buildAgentTools } from './tools';
import { compactResult } from './compact-result';
import { APPROVAL_EXEMPT, proposeAction, toView, type ActionView } from './actions';

type MessageParam = Anthropic.Beta.BetaMessageParam;
type ToolResult = Anthropic.Beta.BetaToolResultBlockParam;

export interface TurnInput {
  userId: string | null;
  conversationId: string | null;
  tenants: Tenant[];
  multiAccount: boolean;
  history: MessageParam[];
  legacyContext: string | null;
  userContent: Anthropic.Beta.BetaContentBlockParam[];
  attachmentStore: Map<string, any>;
  signal?: AbortSignal;
  emit: (event: StreamEvent) => void;
}

export interface TurnOutput {
  /** Entries to append to the stored transcript (starts with the user message). */
  newEntries: MessageParam[];
  /** User-visible assistant text for the display history. */
  text: string;
  toolCalls: ToolCall[];
  actions: ActionView[];
  usage: { inputTokens: number; outputTokens: number; costCents: number };
  /** True if the model produced at least one response (credit was "used"). */
  producedOutput: boolean;
}

export async function runAgentTurn(input: TurnInput): Promise<TurnOutput> {
  const client = getAnthropicClient();
  const system = buildSystem(input.tenants, input.multiAccount, input.legacyContext);
  const tools = buildAgentTools(input.multiAccount);

  const userMessage: MessageParam = { role: 'user', content: input.userContent };
  const newEntries: MessageParam[] = [userMessage];
  const textParts: string[] = [];
  const toolCalls: ToolCall[] = [];
  const actions: ActionView[] = [];
  const usage = { inputTokens: 0, outputTokens: 0, costCents: 0 };
  let producedOutput = false;

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    if (input.signal?.aborted) break;

    const stream = client.beta.messages.stream(
      {
        model: AGENT_MODEL,
        max_tokens: MAX_OUTPUT_TOKENS,
        betas: AGENT_BETAS,
        system,
        tools,
        messages: [...input.history, ...newEntries],
        thinking: { type: 'adaptive' },
        output_config: {
          effort: DEFAULT_EFFORT,
          task_budget: { type: 'tokens', total: TURN_TASK_BUDGET_TOKENS },
        },
        context_management: { edits: [{ type: 'compact_20260112' }] },
        fallbacks: 'default',
        // Cache the growing conversation prefix (tools+system are cached via the system block).
        cache_control: { type: 'ephemeral' },
      },
      { signal: input.signal },
    );

    stream.on('text', (text) => input.emit({ type: 'text-delta', text }));
    stream.on('contentBlock', (block) => {
      if (block.type === 'tool_use') {
        input.emit({
          type: 'tool-start',
          id: block.id,
          name: block.name,
          input: block.input as Record<string, unknown>,
        });
      }
    });

    let message: Anthropic.Beta.BetaMessage;
    try {
      message = await stream.finalMessage();
    } catch (err) {
      if (input.signal?.aborted) break;
      throw err;
    }
    producedOutput = true;
    addUsage(usage, message);
    console.log(
      `[agent] round=${round} stop=${message.stop_reason} in=${message.usage.input_tokens} ` +
        `cache_read=${message.usage.cache_read_input_tokens ?? 0} out=${message.usage.output_tokens} ` +
        `turn_cost=${usage.costCents.toFixed(2)}c`,
    );

    newEntries.push({ role: 'assistant', content: message.content });
    const roundText = message.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');
    if (roundText) textParts.push(roundText);

    if (message.stop_reason === 'refusal') {
      const msg = "I can't help with that request.";
      if (!roundText) textParts.push(msg);
      input.emit({ type: 'notice', message: msg });
      break;
    }

    const toolUses = message.content.filter(
      (b): b is Anthropic.Beta.BetaToolUseBlock => b.type === 'tool_use',
    );

    if (toolUses.length === 0) {
      // Server-side work (tool search, compaction) paused mid-turn: resume.
      if (message.stop_reason === 'pause_turn' || message.stop_reason === 'compaction') continue;
      break;
    }

    // Every tool_use MUST get a tool_result, even when we're about to stop.
    const truncated = message.stop_reason === 'max_tokens';
    const results = await Promise.all(
      toolUses.map((block) =>
        truncated
          ? Promise.resolve(errorResult(block.id, 'Output was cut off; call the tool again.'))
          : handleToolUse(block, input, toolCalls, actions),
      ),
    );
    newEntries.push({ role: 'user', content: results });

    if (usage.costCents >= MAX_TURN_COST_CENTS) {
      const msg =
        '\n\n_Stopped here: this request hit the per-message work limit. Reply "continue" to keep going._';
      textParts.push(msg);
      input.emit({ type: 'text-delta', text: msg });
      break;
    }
    if (round === MAX_TOOL_ROUNDS - 1) {
      const msg =
        '\n\n_Stopped after the maximum number of steps. Reply "continue" to keep going._';
      textParts.push(msg);
      input.emit({ type: 'text-delta', text: msg });
    }
  }

  return {
    newEntries,
    text: textParts.join('\n\n').trim(),
    toolCalls,
    actions,
    usage,
    producedOutput,
  };
}

// ── Tool handling ─────────────────────────────────────────────────────────

async function handleToolUse(
  block: Anthropic.Beta.BetaToolUseBlock,
  input: TurnInput,
  toolCalls: ToolCall[],
  actions: ActionView[],
): Promise<ToolResult> {
  const args = { ...(block.input as Record<string, any>) };
  let result: string;

  if (!isWriteTool(block.name)) {
    result = await runRead(block.name, args, input);
  } else {
    result = await runWrite(block, args, input, actions);
  }

  toolCalls.push({ id: block.id, name: block.name, input: block.input, result });
  input.emit({ type: 'tool-result', id: block.id, name: block.name, result });
  return { type: 'tool_result', tool_use_id: block.id, content: result };
}

async function runRead(name: string, args: Record<string, any>, input: TurnInput): Promise<string> {
  if (!input.multiAccount) {
    return executeTool(input.tenants[0].ctx, name, args, input.attachmentStore);
  }
  const perAccount = await Promise.all(
    input.tenants.map(async (t) => ({
      account: `${t.name} (${t.metaAdAccountId})`,
      result: JSON.parse(await executeTool(t.ctx, name, args, input.attachmentStore)),
    })),
  );
  // Re-compact: N accounts × a full-size result each would blow the budget.
  return compactResult(perAccount);
}

async function runWrite(
  block: Anthropic.Beta.BetaToolUseBlock,
  args: Record<string, any>,
  input: TurnInput,
  actions: ActionView[],
): Promise<string> {
  // Resolve exactly one target account.
  let tenant = input.tenants[0];
  if (input.multiAccount) {
    const target = args[TARGET_ACCOUNT_PARAM];
    delete args[TARGET_ACCOUNT_PARAM];
    const match = input.tenants.find((t) => t.metaAdAccountId === target);
    if (!match) {
      return JSON.stringify({
        error: `In multi-account mode, write tools need "${TARGET_ACCOUNT_PARAM}" set to one of: ${input.tenants
          .map((t) => t.metaAdAccountId)
          .join(', ')}. Nothing was changed.`,
      });
    }
    tenant = match;
  }

  if (APPROVAL_EXEMPT.has(block.name)) {
    return executeTool(tenant.ctx, block.name, args, input.attachmentStore);
  }

  if (!input.userId) {
    return JSON.stringify({ error: 'Sign in to make changes to the ad account.' });
  }

  const row = await proposeAction({
    userId: input.userId,
    conversationId: input.conversationId,
    tenant,
    toolName: block.name,
    toolUseId: block.id,
    input: args,
  });
  const view = toView(row);
  actions.push(view);
  input.emit({ type: 'action-proposed', action: view });
  return JSON.stringify({
    status: 'pending_approval',
    action_id: row.id,
    account: tenant.metaAdAccountId,
    message:
      'Not executed yet. The user will approve or reject this change in the UI. Tell them what will change; do not call it again.',
  });
}

function errorResult(toolUseId: string, message: string): ToolResult {
  return { type: 'tool_result', tool_use_id: toolUseId, content: message, is_error: true };
}

// ── Usage accounting ──────────────────────────────────────────────────────

function addUsage(
  acc: { inputTokens: number; outputTokens: number; costCents: number },
  message: Anthropic.Beta.BetaMessage,
): void {
  const u = message.usage;
  // With compaction/fallbacks, the top-level counts cover only the final
  // iteration; sum every iteration so we bill what was actually spent.
  const iterations = u.iterations?.length ? u.iterations : [u];
  for (const it of iterations) {
    const model = 'model' in it && typeof it.model === 'string' ? it.model : message.model;
    acc.inputTokens +=
      it.input_tokens + (it.cache_read_input_tokens ?? 0) + (it.cache_creation_input_tokens ?? 0);
    acc.outputTokens += it.output_tokens;
    acc.costCents += costCents(
      it.input_tokens,
      it.output_tokens,
      it.cache_creation_input_tokens ?? 0,
      it.cache_read_input_tokens ?? 0,
      model,
    );
  }
}
