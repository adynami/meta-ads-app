import type Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient, SYSTEM_PROMPT } from '@/lib/anthropic';
import { ALL_TOOLS, executeTool } from '@/lib/tool-executor';
import { mcpToAnthropicCached } from '@/lib/tools-schema';
import { db } from '@/lib/db';
import { users, conversations, usage } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import type { TenantContext } from 'meta-mcp-server/tenant-context';
import type { AttachmentStore } from '@/lib/attachments';
import { isImageType } from '@/lib/attachments';
import { estimateCostCents } from '@/lib/pricing';

// ── Constants ──────────────────────────────────────────────────────────

const CONTEXT_REGEX = /<context>\s*([\s\S]*?)\s*<\/context>/i;
const MAX_TOOL_ROUNDS = 10;
const MAX_MESSAGES = 100;
const VALID_ROLES = new Set(['user', 'assistant']);
const MAX_STORED_MESSAGES = 200;

let _anthropicTools: Anthropic.Tool[] | null = null;
function getAnthropicTools() {
  if (!_anthropicTools) _anthropicTools = mcpToAnthropicCached(ALL_TOOLS);
  return _anthropicTools;
}

// ── Types ──────────────────────────────────────────────────────────────

export interface PersistenceContext {
  userId: string;
  adAccountId: string | null;
  conversationId?: string;
  useBonusCall?: boolean;
  existingContext?: string | null;
}

export interface AccountLabel {
  id: string;
  name: string;
}

// ── Exported functions ─────────────────────────────────────────────────

export function validateMessages(messages: unknown): string | null {
  if (!Array.isArray(messages)) return 'messages must be an array';
  if (messages.length === 0) return 'messages is required';
  if (messages.length > MAX_MESSAGES) return `messages exceeds maximum of ${MAX_MESSAGES}`;
  for (const msg of messages) {
    if (!msg || typeof msg !== 'object') return 'each message must be an object';
    if (!VALID_ROLES.has(msg.role)) return `invalid message role: ${msg.role}`;
    if (msg.content == null) return 'each message must have content';
  }
  return null;
}

/**
 * Transform the last user message to include vision blocks for image attachments
 * and a text note listing all attachment IDs for tool use.
 */
export function injectAttachmentBlocks(
  messages: Anthropic.MessageParam[],
  store: AttachmentStore,
): Anthropic.MessageParam[] {
  if (store.size === 0) return messages;

  const result = [...messages];
  const lastIdx = result.length - 1;
  const lastMsg = result[lastIdx];
  if (!lastMsg || lastMsg.role !== 'user') return result;

  const originalText =
    typeof lastMsg.content === 'string'
      ? lastMsg.content
      : Array.isArray(lastMsg.content)
        ? lastMsg.content
            .filter((b: any) => b.type === 'text')
            .map((b: any) => b.text)
            .join(' ')
        : '';

  const contentBlocks: Anthropic.ContentBlockParam[] = [];

  // Add image blocks for vision (skip videos — Claude can't process them)
  for (const [, att] of store) {
    if (isImageType(att.media_type)) {
      contentBlocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: att.media_type as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: att.base64,
        },
      });
    }
  }

  // Add text block with original message
  if (originalText) {
    contentBlocks.push({ type: 'text', text: originalText });
  }

  // Add note listing attachment IDs so Claude can reference them in tool calls
  const attachmentNotes = Array.from(store.values()).map((a) => {
    const kind = isImageType(a.media_type) ? 'image' : 'video';
    return `- ${a.name} (${kind}, id: ${a.id})`;
  });
  contentBlocks.push({
    type: 'text',
    text: `[Attached files available for upload tools:\n${attachmentNotes.join('\n')}]`,
  });

  result[lastIdx] = { role: 'user', content: contentBlocks };
  return result;
}

export async function runChat(
  ctx: TenantContext | TenantContext[],
  messages: Anthropic.MessageParam[],
  persist?: PersistenceContext,
  accountNames?: AccountLabel[],
  attachmentStore?: AttachmentStore,
  signal?: AbortSignal,
): Promise<Response> {
  const client = getAnthropicClient();
  const isMultiAccount = Array.isArray(ctx);

  const systemBlocks: Anthropic.TextBlockParam[] = [
    { type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
    ...(isMultiAccount && accountNames
      ? [
          {
            type: 'text' as const,
            text: `\n\nYou are in MULTI-ACCOUNT mode. The user has ${accountNames.length} connected ad accounts:\n${accountNames.map((a) => `- ${a.name} (${a.id})`).join('\n')}\n\nWhen tool calls return results, they will be aggregated across all accounts. Always label results by account name so the user knows which data belongs to which account.`,
          },
        ]
      : []),
    ...(persist?.existingContext
      ? [
          {
            type: 'text' as const,
            text: `\nPrevious conversation context (update this in your <context> block):\n${persist.existingContext}`,
          },
        ]
      : []),
  ];

  let currentMessages: Anthropic.MessageParam[] = truncateOldToolResults([...messages]);
  let finalText = '';
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalCacheCreationTokens = 0;
  let totalCacheReadTokens = 0;
  const toolCalls: { id: string; name: string; input: any; result: string }[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    if (signal?.aborted) break;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 16384,
      system: systemBlocks,
      tools: getAnthropicTools(),
      messages: currentMessages,
    });

    const cacheRead = (response.usage as any).cache_read_input_tokens ?? 0;
    const cacheCreate = (response.usage as any).cache_creation_input_tokens ?? 0;
    console.log(
      `[chat] round=${round} stop=${response.stop_reason} cache_read=${cacheRead} cache_create=${cacheCreate} input=${response.usage.input_tokens}`,
    );

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;
    totalCacheCreationTokens += cacheCreate;
    totalCacheReadTokens += cacheRead;

    const textParts: string[] = [];
    const toolUseBlocks: Anthropic.ContentBlockParam[] = [];

    for (const block of response.content) {
      if (block.type === 'text') {
        textParts.push(block.text);
      } else if (block.type === 'tool_use') {
        toolUseBlocks.push(block);
      }
    }

    if (textParts.length > 0) {
      finalText = textParts.join('\n');
    }

    if (toolUseBlocks.length === 0) {
      break;
    }

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        if (block.type !== 'tool_use') return null;

        let result: string;

        if (isMultiAccount && accountNames) {
          // Execute against all accounts and aggregate
          const perAccount = await Promise.all(
            (ctx as TenantContext[]).map(async (tenantCtx, i) => {
              const r = await executeTool(
                tenantCtx,
                block.name,
                block.input as Record<string, any>,
                attachmentStore,
              );
              return { account: accountNames[i].name, result: r };
            }),
          );
          result = JSON.stringify(perAccount);
        } else {
          result = await executeTool(
            ctx as TenantContext,
            block.name,
            block.input as Record<string, any>,
            attachmentStore,
          );
        }

        toolCalls.push({
          id: block.id,
          name: block.name,
          input: block.input,
          result,
        });
        return {
          type: 'tool_result' as const,
          tool_use_id: block.id,
          content: result,
        };
      }),
    );

    currentMessages = [
      ...currentMessages,
      { role: 'assistant', content: response.content },
      {
        role: 'user',
        content: toolResults.filter(Boolean) as Anthropic.ToolResultBlockParam[],
      },
    ];
  }

  // Extract context block from response before persisting/returning
  const { cleanText, context: extractedContext } = extractAndStripContext(finalText);

  // Persist conversation and usage to DB — await to get conversationId
  let returnedConversationId: string | undefined;
  if (persist) {
    try {
      returnedConversationId = await persistChatData(
        persist,
        messages,
        cleanText,
        totalInputTokens,
        totalOutputTokens,
        totalCacheCreationTokens,
        totalCacheReadTokens,
        extractedContext,
      );

      // Decrement bonus calls if this call consumed a bonus credit
      if (persist.useBonusCall) {
        await db
          .update(users)
          .set({ bonusCalls: sql`bonus_calls - 1` })
          .where(eq(users.id, persist.userId));
      }
    } catch (err) {
      console.error('[chat/route] Persistence error:', err);
    }
  }

  return Response.json({
    text: cleanText,
    toolCalls,
    conversationId: returnedConversationId ?? persist?.conversationId,
  });
}

// ── Internal functions ─────────────────────────────────────────────────

function extractAndStripContext(text: string): { cleanText: string; context: string | null } {
  const match = text.match(CONTEXT_REGEX);
  if (!match) return { cleanText: text, context: null };
  let context = match[1].trim();
  if (context.length > 2000) context = context.slice(0, 2000);
  return { cleanText: text.replace(CONTEXT_REGEX, '').trimEnd(), context };
}

/**
 * Replace tool_result content blocks in older messages with a placeholder.
 * Keeps the last `recentToKeep` messages fully intact; older tool results
 * are replaced entirely since conversation context carries the key data.
 */
function truncateOldToolResults(
  messages: Anthropic.MessageParam[],
  recentToKeep = 6,
): Anthropic.MessageParam[] {
  const cutoff = Math.max(0, messages.length - recentToKeep);
  return messages.map((msg, i) => {
    if (i >= cutoff || msg.role !== 'user' || !Array.isArray(msg.content)) return msg;
    return {
      ...msg,
      content: (msg.content as any[]).map((block) => {
        if (block.type !== 'tool_result' || typeof block.content !== 'string') return block;
        return { ...block, content: '[Result available in conversation context]' };
      }),
    };
  });
}

async function persistChatData(
  persist: PersistenceContext,
  messages: Anthropic.MessageParam[],
  assistantText: string,
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens = 0,
  cacheReadTokens = 0,
  context?: string | null,
): Promise<string> {
  const now = new Date();

  // 1. Upsert conversation
  const userMessage = messages[messages.length - 1];
  const userText =
    typeof userMessage?.content === 'string'
      ? userMessage.content
      : Array.isArray(userMessage?.content)
        ? userMessage.content
            .filter((b: any) => b.type === 'text')
            .map((b: any) => b.text)
            .join(' ')
        : '';

  const newMessages = [
    { role: 'user', content: userText, timestamp: now.toISOString() },
    { role: 'assistant', content: assistantText, timestamp: now.toISOString() },
  ];

  let conversationId = persist.conversationId;

  if (conversationId) {
    // Append to existing conversation, trimming oldest if over threshold
    await db
      .update(conversations)
      .set({
        messages: sql`(
          CASE WHEN jsonb_array_length(${conversations.messages}) + ${newMessages.length} > ${MAX_STORED_MESSAGES}
          THEN (SELECT jsonb_agg(elem) FROM (
            SELECT elem FROM jsonb_array_elements(${conversations.messages} || ${JSON.stringify(newMessages)}::jsonb) AS elem
            ORDER BY elem->>'timestamp' DESC
            LIMIT ${MAX_STORED_MESSAGES}
          ) sub)
          ELSE ${conversations.messages} || ${JSON.stringify(newMessages)}::jsonb
          END
        )`,
        updatedAt: now,
        ...(context != null ? { context } : {}),
      })
      .where(and(eq(conversations.id, conversationId), eq(conversations.userId, persist.userId)));
  } else {
    // Create new conversation
    const title = userText.slice(0, 100) || 'New conversation';
    const [inserted] = await db
      .insert(conversations)
      .values({
        userId: persist.userId,
        adAccountId: persist.adAccountId,
        title,
        messages: newMessages,
        context: context ?? undefined,
      })
      .returning({ id: conversations.id });
    conversationId = inserted.id;
  }

  // 2. Upsert usage for this month
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  await db
    .insert(usage)
    .values({
      userId: persist.userId,
      month,
      apiCalls: 1,
      inputTokens,
      outputTokens,
      estimatedCostCents: estimateCostCents(
        inputTokens,
        outputTokens,
        cacheCreationTokens,
        cacheReadTokens,
      ),
    })
    .onConflictDoUpdate({
      target: [usage.userId, usage.month],
      set: {
        apiCalls: sql`${usage.apiCalls} + 1`,
        inputTokens: sql`${usage.inputTokens} + ${inputTokens}`,
        outputTokens: sql`${usage.outputTokens} + ${outputTokens}`,
        estimatedCostCents: sql`${usage.estimatedCostCents} + ${estimateCostCents(inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens)}`,
      },
    });

  return conversationId!;
}
