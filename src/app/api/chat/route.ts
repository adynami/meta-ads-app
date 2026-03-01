import { NextRequest } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient, SYSTEM_PROMPT } from '@/lib/anthropic';
import { ALL_TOOLS, executeTool } from '@/lib/tool-executor';
import { mcpToAnthropicCached } from '@/lib/tools-schema';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, adAccounts, conversations, usage } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { decrypt } from '@/lib/crypto';
import { isTrialExpired, PLAN_LIMITS, type Plan } from '@/lib/plans';
import type { TenantContext } from 'meta-mcp-server/tenant-context';
import type { Attachment, AttachmentStore } from '@/lib/attachments';
import { isImageType, isVideoType } from '@/lib/attachments';
import { META_API_VERSION } from '@/lib/meta-auth';
import { estimateCostCents } from '@/lib/pricing';

// Increase body size limit for base64-encoded image/video attachments
export const config = {
  api: { bodyParser: { sizeLimit: '50mb' } },
};

const CONTEXT_REGEX = /<context>\s*([\s\S]*?)\s*<\/context>/i;

function extractAndStripContext(text: string): { cleanText: string; context: string | null } {
  const match = text.match(CONTEXT_REGEX);
  if (!match) return { cleanText: text, context: null };
  let context = match[1].trim();
  if (context.length > 2000) context = context.slice(0, 2000);
  return { cleanText: text.replace(CONTEXT_REGEX, '').trimEnd(), context };
}

const anthropicTools = mcpToAnthropicCached(ALL_TOOLS);
const MAX_TOOL_ROUNDS = 10;
const MAX_MESSAGES = 100;
const VALID_ROLES = new Set(['user', 'assistant']);

function validateMessages(messages: unknown): string | null {
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

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    // Build TenantContext — either from user's DB credentials or env vars (dev fallback)
    let ctx: TenantContext;

    if (session?.user?.email) {
      // Authenticated user — load credentials from DB
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1);

      if (!user) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      // Check trial/subscription status
      if (isTrialExpired(user.plan, user.trialEndsAt)) {
        return Response.json({
          error: 'Your trial has expired. Please subscribe to continue.',
          code: 'TRIAL_EXPIRED',
        }, { status: 403 });
      }

      // Check monthly API call limit
      const now = new Date();
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
      const planLimits = PLAN_LIMITS[user.plan as Plan] ?? PLAN_LIMITS.trial;

      const [monthUsage] = await db
        .select({ apiCalls: usage.apiCalls })
        .from(usage)
        .where(and(eq(usage.userId, user.id), eq(usage.month, month)))
        .limit(1);

      const planCallsLeft = planLimits.monthlyApiCalls - (monthUsage?.apiCalls ?? 0);
      if (planCallsLeft <= 0 && (user.bonusCalls ?? 0) <= 0) {
        return Response.json({
          error: `You've reached your monthly limit of ${planLimits.monthlyApiCalls} API calls on the ${user.plan} plan. Upgrade or buy more calls.`,
          code: 'RATE_LIMITED',
          canTopUp: true,
          usage: { current: monthUsage?.apiCalls ?? 0, limit: planLimits.monthlyApiCalls },
        }, { status: 429 });
      }

      // Get the user's active ad account (use account_id from request or first active)
      const body = await req.json();
      const { messages, accountId, attachments: rawAttachments } = body as {
        messages: Anthropic.MessageParam[];
        accountId?: string;
        attachments?: Attachment[];
      };

      // Build attachment store from request body
      const attachmentStore: AttachmentStore = new Map();
      if (rawAttachments?.length) {
        for (const a of rawAttachments) attachmentStore.set(a.id, a);
      }

      const msgError = validateMessages(messages);
      if (msgError) {
        return Response.json({ error: msgError }, { status: 400 });
      }

      // Load existing conversation context for continuity
      let existingContext: string | null = null;
      if (body.conversationId) {
        const [conv] = await db
          .select({ context: conversations.context })
          .from(conversations)
          .where(and(eq(conversations.id, body.conversationId), eq(conversations.userId, user.id)))
          .limit(1);
        existingContext = conv?.context ?? null;
      }

      // Multi-account mode
      if (accountId === 'all') {
        const allAccounts = await db
          .select()
          .from(adAccounts)
          .where(and(eq(adAccounts.userId, user.id), eq(adAccounts.isActive, true)));

        if (allAccounts.length === 0) {
          return Response.json({
            error: 'No connected ad accounts found. Go to Settings to connect your Meta ad account.',
          }, { status: 400 });
        }

        const contexts: TenantContext[] = [];
        const failedAccounts: string[] = [];
        for (const a of allAccounts) {
          try {
            contexts.push({
              accessToken: decrypt(a.accessTokenEnc),
              adAccountId: a.metaAdAccountId,
              apiVersion: META_API_VERSION,
              dryRun: false,
            });
          } catch {
            failedAccounts.push(a.metaAccountName || a.metaAdAccountId);
          }
        }
        if (contexts.length === 0) {
          return Response.json({
            error: 'Failed to decrypt tokens for all accounts. Please reconnect in Settings.',
            code: 'TOKEN_DECRYPT_FAILED',
          }, { status: 400 });
        }

        const accountNames = allAccounts.map((a) => ({
          id: a.metaAdAccountId,
          name: a.metaAccountName || a.metaAdAccountId,
        }));

        // Inject attachment vision blocks into the last user message
        const messagesWithAttachments = injectAttachmentBlocks(messages, attachmentStore);

        return await runChat(contexts, messagesWithAttachments, {
          userId: user.id,
          adAccountId: null,
          conversationId: body.conversationId,
          useBonusCall: planCallsLeft <= 0,
          existingContext,
        }, accountNames, attachmentStore, req.signal);
      }

      const accountFilter = accountId
        ? and(eq(adAccounts.userId, user.id), eq(adAccounts.id, accountId), eq(adAccounts.isActive, true))
        : and(eq(adAccounts.userId, user.id), eq(adAccounts.isActive, true));

      const [account] = await db
        .select()
        .from(adAccounts)
        .where(accountFilter)
        .limit(1);

      if (!account) {
        return Response.json({
          error: 'No connected ad account found. Go to Settings to connect your Meta ad account.',
        }, { status: 400 });
      }

      try {
        ctx = {
          accessToken: decrypt(account.accessTokenEnc),
          adAccountId: account.metaAdAccountId,
          apiVersion: META_API_VERSION,
          dryRun: false,
        };
      } catch {
        return Response.json({
          error: 'Failed to decrypt token. Please reconnect in Settings.',
          code: 'TOKEN_DECRYPT_FAILED',
        }, { status: 400 });
      }

      const messagesWithAttachmentsSingle = injectAttachmentBlocks(messages, attachmentStore);

      return await runChat(ctx, messagesWithAttachmentsSingle, {
        userId: user.id,
        adAccountId: account.id,
        conversationId: body.conversationId,
        useBonusCall: planCallsLeft <= 0,
        existingContext,
      }, undefined, attachmentStore, req.signal);
    }

    // Fallback: env var credentials (dev/demo mode)
    const envToken = process.env.META_ACCESS_TOKEN;
    const envAccount = process.env.META_AD_ACCOUNT_ID;

    if (!envToken || !envAccount) {
      return Response.json(
        { error: 'Not authenticated and no env credentials configured' },
        { status: 401 },
      );
    }

    const envBody = (await req.json()) as {
      messages: Anthropic.MessageParam[];
      attachments?: Attachment[];
    };
    const { messages, attachments: envAttachments } = envBody;

    const envMsgError = validateMessages(messages);
    if (envMsgError) {
      return Response.json({ error: envMsgError }, { status: 400 });
    }

    const envAttachmentStore: AttachmentStore = new Map();
    if (envAttachments?.length) {
      for (const a of envAttachments) envAttachmentStore.set(a.id, a);
    }

    ctx = {
      accessToken: envToken,
      adAccountId: envAccount,
      apiVersion: process.env.META_API_VERSION ?? META_API_VERSION,
      dryRun: process.env.DRY_RUN === 'true',
    };

    const envMessages = injectAttachmentBlocks(messages, envAttachmentStore);
    return await runChat(ctx, envMessages, undefined, undefined, envAttachmentStore, req.signal);
  } catch (error: any) {
    console.error('[chat/route] Error:', error);
    return Response.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 },
    );
  }
}

/**
 * Transform the last user message to include vision blocks for image attachments
 * and a text note listing all attachment IDs for tool use.
 */
function injectAttachmentBlocks(
  messages: Anthropic.MessageParam[],
  store: AttachmentStore,
): Anthropic.MessageParam[] {
  if (store.size === 0) return messages;

  const result = [...messages];
  const lastIdx = result.length - 1;
  const lastMsg = result[lastIdx];
  if (!lastMsg || lastMsg.role !== 'user') return result;

  const originalText = typeof lastMsg.content === 'string'
    ? lastMsg.content
    : Array.isArray(lastMsg.content)
      ? lastMsg.content.filter((b: any) => b.type === 'text').map((b: any) => b.text).join(' ')
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

interface PersistenceContext {
  userId: string;
  adAccountId: string | null;
  conversationId?: string;
  useBonusCall?: boolean;
  existingContext?: string | null;
}

interface AccountLabel {
  id: string;
  name: string;
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

async function runChat(
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
    ...(isMultiAccount && accountNames ? [{
      type: 'text' as const,
      text: `\n\nYou are in MULTI-ACCOUNT mode. The user has ${accountNames.length} connected ad accounts:\n${accountNames.map((a) => `- ${a.name} (${a.id})`).join('\n')}\n\nWhen tool calls return results, they will be aggregated across all accounts. Always label results by account name so the user knows which data belongs to which account.`,
    }] : []),
    ...(persist?.existingContext ? [{
      type: 'text' as const,
      text: `\nPrevious conversation context (update this in your <context> block):\n${persist.existingContext}`,
    }] : []),
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
      tools: anthropicTools,
      messages: currentMessages,
    });

    const cacheRead = (response.usage as any).cache_read_input_tokens ?? 0;
    const cacheCreate = (response.usage as any).cache_creation_input_tokens ?? 0;
    console.log(`[chat] round=${round} stop=${response.stop_reason} cache_read=${cacheRead} cache_create=${cacheCreate} input=${response.usage.input_tokens}`);

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
              const r = await executeTool(tenantCtx, block.name, block.input as Record<string, any>, attachmentStore);
              return { account: accountNames[i].name, result: r };
            }),
          );
          result = JSON.stringify(perAccount);
        } else {
          result = await executeTool(ctx as TenantContext, block.name, block.input as Record<string, any>, attachmentStore);
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
      returnedConversationId = await persistChatData(persist, messages, cleanText, totalInputTokens, totalOutputTokens, totalCacheCreationTokens, totalCacheReadTokens, extractedContext);

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

  const MAX_STORED_MESSAGES = 200;
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
      .where(
        and(
          eq(conversations.id, conversationId),
          eq(conversations.userId, persist.userId),
        ),
      );
  } else {
    // Create new conversation
    const title = userText.slice(0, 100) || 'New conversation';
    const [inserted] = await db.insert(conversations).values({
      userId: persist.userId,
      adAccountId: persist.adAccountId,
      title,
      messages: newMessages,
      context: context ?? undefined,
    }).returning({ id: conversations.id });
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
      estimatedCostCents: estimateCostCents(inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens),
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

