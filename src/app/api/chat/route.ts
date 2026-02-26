import { NextRequest } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { getAnthropicClient, SYSTEM_PROMPT } from '@/lib/anthropic';
import { ALL_TOOLS, executeTool } from '@/lib/tool-executor';
import { mcpToAnthropic } from '@/lib/tools-schema';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, adAccounts, conversations, usage } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { decrypt } from '@/lib/crypto';
import { isTrialExpired, PLAN_LIMITS, type Plan } from '@/lib/plans';
import type { TenantContext } from 'meta-mcp-server/tenant-context';

const anthropicTools = mcpToAnthropic(ALL_TOOLS);
const MAX_TOOL_ROUNDS = 10;

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

      if (monthUsage && monthUsage.apiCalls >= planLimits.monthlyApiCalls) {
        return Response.json({
          error: `You've reached your monthly limit of ${planLimits.monthlyApiCalls} API calls on the ${user.plan} plan. Upgrade for more.`,
          code: 'RATE_LIMITED',
          usage: { current: monthUsage.apiCalls, limit: planLimits.monthlyApiCalls },
        }, { status: 429 });
      }

      // Get the user's active ad account (use account_id from request or first active)
      const body = await req.json();
      const { messages, accountId } = body as {
        messages: Anthropic.MessageParam[];
        accountId?: string;
      };

      if (!messages?.length) {
        return Response.json({ error: 'messages is required' }, { status: 400 });
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

      ctx = {
        accessToken: decrypt(account.accessTokenEnc),
        adAccountId: account.metaAdAccountId,
        apiVersion: 'v25.0',
        dryRun: false,
      };

      return await runChat(ctx, messages, {
        userId: user.id,
        adAccountId: account.id,
        conversationId: body.conversationId,
      });
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

    const { messages } = (await req.json()) as {
      messages: Anthropic.MessageParam[];
    };

    if (!messages?.length) {
      return Response.json({ error: 'messages is required' }, { status: 400 });
    }

    ctx = {
      accessToken: envToken,
      adAccountId: envAccount,
      apiVersion: process.env.META_API_VERSION ?? 'v25.0',
      dryRun: process.env.DRY_RUN === 'true',
    };

    return await runChat(ctx, messages);
  } catch (error: any) {
    console.error('[chat/route] Error:', error);
    return Response.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 },
    );
  }
}

interface PersistenceContext {
  userId: string;
  adAccountId: string;
  conversationId?: string;
}

async function runChat(
  ctx: TenantContext,
  messages: Anthropic.MessageParam[],
  persist?: PersistenceContext,
): Promise<Response> {
  const client = getAnthropicClient();

  let currentMessages: Anthropic.MessageParam[] = [...messages];
  let finalText = '';
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  const toolCalls: { id: string; name: string; input: any; result: string }[] = [];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      tools: anthropicTools,
      messages: currentMessages,
    });

    totalInputTokens += response.usage.input_tokens;
    totalOutputTokens += response.usage.output_tokens;

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

    if (toolUseBlocks.length === 0 || response.stop_reason === 'end_turn') {
      break;
    }

    const toolResults = await Promise.all(
      toolUseBlocks.map(async (block) => {
        if (block.type !== 'tool_use') return null;
        const result = await executeTool(ctx, block.name, block.input as Record<string, any>);
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

  // Persist conversation and usage to DB (fire-and-forget, don't block response)
  if (persist) {
    persistChatData(persist, messages, finalText, totalInputTokens, totalOutputTokens).catch(
      (err) => console.error('[chat/route] Persistence error:', err),
    );
  }

  return Response.json({ text: finalText, toolCalls });
}

async function persistChatData(
  persist: PersistenceContext,
  messages: Anthropic.MessageParam[],
  assistantText: string,
  inputTokens: number,
  outputTokens: number,
) {
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

  if (persist.conversationId) {
    // Append to existing conversation
    await db
      .update(conversations)
      .set({
        messages: sql`${conversations.messages} || ${JSON.stringify(newMessages)}::jsonb`,
        updatedAt: now,
      })
      .where(
        and(
          eq(conversations.id, persist.conversationId),
          eq(conversations.userId, persist.userId),
        ),
      );
  } else {
    // Create new conversation
    const title = userText.slice(0, 100) || 'New conversation';
    await db.insert(conversations).values({
      userId: persist.userId,
      adAccountId: persist.adAccountId,
      title,
      messages: newMessages,
    });
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
      estimatedCostCents: estimateCostCents(inputTokens, outputTokens),
    })
    .onConflictDoUpdate({
      target: [usage.userId, usage.month],
      set: {
        apiCalls: sql`${usage.apiCalls} + 1`,
        inputTokens: sql`${usage.inputTokens} + ${inputTokens}`,
        outputTokens: sql`${usage.outputTokens} + ${outputTokens}`,
        estimatedCostCents: sql`${usage.estimatedCostCents} + ${estimateCostCents(inputTokens, outputTokens)}`,
      },
    });
}

function estimateCostCents(inputTokens: number, outputTokens: number): number {
  // Sonnet pricing: $3/MTok input, $15/MTok output
  const inputCost = (inputTokens / 1_000_000) * 3;
  const outputCost = (outputTokens / 1_000_000) * 15;
  return Math.round((inputCost + outputCost) * 100);
}
