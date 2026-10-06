import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Anthropic from '@anthropic-ai/sdk';

// ── Fake Claude: replays scripted assistant messages, one per round ──────

const script: Partial<Anthropic.Beta.BetaMessage>[] = [];
const streamCalls: any[] = [];

function fakeStream(message: Partial<Anthropic.Beta.BetaMessage>) {
  const handlers: Record<string, ((x: any) => void)[]> = {};
  const s = {
    on(event: string, fn: (x: any) => void) {
      (handlers[event] ??= []).push(fn);
      return s;
    },
    async finalMessage() {
      for (const block of message.content ?? []) {
        if (block.type === 'text') handlers.text?.forEach((h) => h(block.text));
        handlers.contentBlock?.forEach((h) => h(block));
      }
      return {
        model: 'claude-opus-5-5',
        stop_reason: 'end_turn',
        usage: {
          input_tokens: 1000,
          output_tokens: 100,
          cache_read_input_tokens: 0,
          cache_creation_input_tokens: 0,
        },
        ...message,
      };
    },
  };
  return s;
}

vi.mock('@/lib/anthropic', () => ({
  getAnthropicClient: () => ({
    beta: {
      messages: {
        stream: (params: any) => {
          streamCalls.push(structuredClone(params));
          const next = script.shift();
          if (!next) throw new Error('script exhausted');
          return fakeStream(next);
        },
      },
    },
  }),
}));

const executeTool = vi.fn(async (ctx: any, name: string) =>
  JSON.stringify({ tool: name, account: ctx.adAccountId }),
);
vi.mock('@/lib/tool-executor', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/lib/tool-executor')>()),
  executeTool: (...args: any[]) => (executeTool as any)(...args),
}));

const proposeAction = vi.fn(async (opts: any) => ({
  id: 'act-1',
  userId: opts.userId,
  conversationId: opts.conversationId,
  adAccountId: opts.tenant.id,
  metaAdAccountId: opts.tenant.metaAdAccountId,
  toolName: opts.toolName,
  toolUseId: opts.toolUseId,
  input: opts.input,
  summary: 'summary',
  status: 'pending',
  before: null,
  result: null,
  error: null,
  createdAt: new Date(),
  decidedAt: null,
  rolledBackAt: null,
}));
vi.mock('./actions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('./actions')>()),
  proposeAction: (opts: any) => proposeAction(opts),
}));
vi.mock('@/lib/db', () => ({ db: {} }));

import { runAgentTurn, type TurnInput } from './engine';

const tenant = (n: number) => ({
  id: `t${n}`,
  metaAdAccountId: `act_${n}`,
  name: `Account ${n}`,
  ctx: { accessToken: 'tok', adAccountId: `act_${n}`, apiVersion: 'v25.0', dryRun: false },
});

function turn(overrides: Partial<TurnInput> = {}): TurnInput & { events: any[] } {
  const events: any[] = [];
  return {
    userId: 'u1',
    conversationId: 'c1',
    tenants: [tenant(1)],
    multiAccount: false,
    history: [],
    legacyContext: null,
    userContent: [{ type: 'text', text: 'hi' }],
    attachmentStore: new Map(),
    emit: (e) => events.push(e),
    events,
    ...overrides,
  };
}

const toolUse = (id: string, name: string, input: Record<string, unknown>) =>
  ({ type: 'tool_use', id, name, input }) as Anthropic.Beta.BetaToolUseBlock;
const text = (t: string) =>
  ({ type: 'text', text: t, citations: null }) as Anthropic.Beta.BetaTextBlock;

beforeEach(() => {
  script.length = 0;
  streamCalls.length = 0;
  vi.clearAllMocks();
});

describe('runAgentTurn', () => {
  it('runs reads, then answers; transcript is user → assistant → results → assistant', async () => {
    script.push(
      { content: [toolUse('t1', 'meta_list_campaigns', {})], stop_reason: 'tool_use' },
      { content: [text('You have 3 campaigns.')] },
    );
    const input = turn();
    const out = await runAgentTurn(input);

    expect(executeTool).toHaveBeenCalledTimes(1);
    expect(out.text).toBe('You have 3 campaigns.');
    expect(out.newEntries.map((m) => m.role)).toEqual(['user', 'assistant', 'user', 'assistant']);
    expect((out.newEntries[2].content as any[])[0]).toMatchObject({
      type: 'tool_result',
      tool_use_id: 't1',
    });
    expect(input.events.some((e) => e.type === 'text-delta')).toBe(true);
  });

  it('never executes a write: it becomes a pending proposal', async () => {
    script.push(
      {
        content: [toolUse('w1', 'meta_update_campaign', { campaign_id: '9', daily_budget: 50 })],
        stop_reason: 'tool_use',
      },
      { content: [text('Queued for your approval.')] },
    );
    const input = turn();
    const out = await runAgentTurn(input);

    expect(executeTool).not.toHaveBeenCalled();
    expect(proposeAction).toHaveBeenCalledWith(
      expect.objectContaining({
        toolName: 'meta_update_campaign',
        input: { campaign_id: '9', daily_budget: 50 },
      }),
    );
    expect(out.actions).toHaveLength(1);
    expect(input.events.find((e) => e.type === 'action-proposed')).toBeDefined();
    const result = JSON.parse((out.newEntries[2].content as any[])[0].content);
    expect(result.status).toBe('pending_approval');
  });

  it('multi-account: fans reads out to every account', async () => {
    script.push(
      { content: [toolUse('t1', 'meta_get_insights', {})], stop_reason: 'tool_use' },
      { content: [text('done')] },
    );
    await runAgentTurn(turn({ tenants: [tenant(1), tenant(2)], multiAccount: true }));
    expect(executeTool.mock.calls.map((c: any[]) => c[0].adAccountId).sort()).toEqual([
      'act_1',
      'act_2',
    ]);
  });

  it('multi-account: rejects a write with no target account', async () => {
    script.push(
      {
        content: [
          toolUse('w1', 'meta_update_campaign_status', { campaign_id: '9', status: 'PAUSED' }),
        ],
        stop_reason: 'tool_use',
      },
      { content: [text('ok')] },
    );
    const out = await runAgentTurn(turn({ tenants: [tenant(1), tenant(2)], multiAccount: true }));
    expect(proposeAction).not.toHaveBeenCalled();
    const result = JSON.parse((out.newEntries[2].content as any[])[0].content);
    expect(result.error).toMatch(/target_account_id/);
  });

  it('multi-account: a targeted write goes to that one account, param stripped', async () => {
    script.push(
      {
        content: [
          toolUse('w1', 'meta_update_campaign_status', {
            campaign_id: '9',
            status: 'PAUSED',
            target_account_id: 'act_2',
          }),
        ],
        stop_reason: 'tool_use',
      },
      { content: [text('ok')] },
    );
    await runAgentTurn(turn({ tenants: [tenant(1), tenant(2)], multiAccount: true }));
    expect(proposeAction).toHaveBeenCalledTimes(1);
    const call = proposeAction.mock.calls[0][0] as any;
    expect(call.tenant.metaAdAccountId).toBe('act_2');
    expect(call.input).toEqual({ campaign_id: '9', status: 'PAUSED' });
  });

  it('uploads run immediately (no approval needed)', async () => {
    script.push(
      {
        content: [toolUse('u1', 'meta_upload_image', { attachment_id: 'a' })],
        stop_reason: 'tool_use',
      },
      { content: [text('uploaded')] },
    );
    await runAgentTurn(turn());
    expect(executeTool).toHaveBeenCalledWith(
      expect.anything(),
      'meta_upload_image',
      { attachment_id: 'a' },
      expect.any(Map),
    );
    expect(proposeAction).not.toHaveBeenCalled();
  });

  it('stops when the per-turn cost cap is hit, after answering every tool_use', async () => {
    const huge = {
      input_tokens: 200_000,
      output_tokens: 20_000,
      cache_read_input_tokens: 0,
      cache_creation_input_tokens: 0,
    };
    script.push({
      content: [toolUse('t1', 'meta_list_ads', {})],
      stop_reason: 'tool_use',
      usage: huge as any,
    });
    const out = await runAgentTurn(turn());
    expect(script).toHaveLength(0);
    expect(out.newEntries.at(-1)?.role).toBe('user'); // tool_result recorded
    expect(out.text).toMatch(/work limit/);
  });

  it('sends a stable request prefix: same tools and system every round', async () => {
    script.push(
      { content: [toolUse('t1', 'meta_list_campaigns', {})], stop_reason: 'tool_use' },
      { content: [text('done')] },
    );
    await runAgentTurn(turn());
    expect(streamCalls[0].tools).toEqual(streamCalls[1].tools);
    expect(streamCalls[0].system).toEqual(streamCalls[1].system);
    // history only grows: round 2's messages start with round 1's
    expect(streamCalls[1].messages.slice(0, streamCalls[0].messages.length)).toEqual(
      streamCalls[0].messages,
    );
  });

  it('defers all but the core tools behind tool search', async () => {
    script.push({ content: [text('hi')] });
    await runAgentTurn(turn());
    const tools = streamCalls[0].tools as any[];
    expect(tools[0].type).toBe('tool_search_tool_bm25_20251119');
    const loaded = tools.filter((t) => t.name?.startsWith('meta_') && !t.defer_loading);
    expect(loaded.length).toBeLessThanOrEqual(6);
  });
});
