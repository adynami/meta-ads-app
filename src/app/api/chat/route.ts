import { NextRequest } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, adAccounts, conversations, usage } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { decrypt } from '@/lib/crypto';
import { isTrialExpired, PLAN_LIMITS, type Plan } from '@/lib/plans';
import type { TenantContext } from 'meta-mcp-server/tenant-context';
import type { Attachment, AttachmentStore } from '@/lib/attachments';
import { META_API_VERSION, refreshAccountTokenIfNeeded } from '@/lib/meta-auth';
import { runChat, validateMessages, injectAttachmentBlocks } from '@/lib/chat';
import { runChatStreaming } from '@/lib/chat-streaming';

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
        return Response.json(
          {
            error: 'Your trial has expired. Please subscribe to continue.',
            code: 'TRIAL_EXPIRED',
          },
          { status: 403 },
        );
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
        return Response.json(
          {
            error: `You've reached your monthly limit of ${planLimits.monthlyApiCalls} API calls on the ${user.plan} plan. Upgrade or buy more calls.`,
            code: 'RATE_LIMITED',
            canTopUp: true,
            usage: { current: monthUsage?.apiCalls ?? 0, limit: planLimits.monthlyApiCalls },
          },
          { status: 429 },
        );
      }

      // Get the user's active ad account (use account_id from request or first active)
      const body = await req.json();
      const {
        messages,
        accountId,
        attachments: rawAttachments,
        stream: useStreaming,
      } = body as {
        messages: Anthropic.MessageParam[];
        accountId?: string;
        attachments?: Attachment[];
        stream?: boolean;
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
          return Response.json(
            {
              error:
                'No connected ad accounts found. Go to Settings to connect your Meta ad account.',
            },
            { status: 400 },
          );
        }

        // Fire-and-forget token refresh for accounts expiring soon
        for (const a of allAccounts) {
          if (a.tokenExpiresAt) {
            refreshAccountTokenIfNeeded(a.id, 7).catch(() => {});
          }
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
          return Response.json(
            {
              error: 'Failed to decrypt tokens for all accounts. Please reconnect in Settings.',
              code: 'TOKEN_DECRYPT_FAILED',
            },
            { status: 400 },
          );
        }

        const accountNames = allAccounts.map((a) => ({
          id: a.metaAdAccountId,
          name: a.metaAccountName || a.metaAdAccountId,
        }));

        const messagesWithAttachments = injectAttachmentBlocks(messages, attachmentStore);

        const persistCtx = {
          userId: user.id,
          adAccountId: null,
          conversationId: body.conversationId,
          useBonusCall: planCallsLeft <= 0,
          existingContext,
        };

        if (useStreaming) {
          return runChatStreaming(
            contexts,
            messagesWithAttachments,
            persistCtx,
            accountNames,
            attachmentStore,
            req.signal,
          );
        }

        return await runChat(
          contexts,
          messagesWithAttachments,
          persistCtx,
          accountNames,
          attachmentStore,
          req.signal,
        );
      }

      const accountFilter = accountId
        ? and(
            eq(adAccounts.userId, user.id),
            eq(adAccounts.id, accountId),
            eq(adAccounts.isActive, true),
          )
        : and(eq(adAccounts.userId, user.id), eq(adAccounts.isActive, true));

      const [account] = await db.select().from(adAccounts).where(accountFilter).limit(1);

      if (!account) {
        return Response.json(
          {
            error: 'No connected ad account found. Go to Settings to connect your Meta ad account.',
          },
          { status: 400 },
        );
      }

      try {
        ctx = {
          accessToken: decrypt(account.accessTokenEnc),
          adAccountId: account.metaAdAccountId,
          apiVersion: META_API_VERSION,
          dryRun: false,
        };
      } catch {
        return Response.json(
          {
            error: 'Failed to decrypt token. Please reconnect in Settings.',
            code: 'TOKEN_DECRYPT_FAILED',
          },
          { status: 400 },
        );
      }

      // Fire-and-forget token refresh if expiring soon
      if (account.tokenExpiresAt) {
        refreshAccountTokenIfNeeded(account.id, 7).catch(() => {});
      }

      const messagesWithAttachmentsSingle = injectAttachmentBlocks(messages, attachmentStore);

      const singlePersistCtx = {
        userId: user.id,
        adAccountId: account.id,
        conversationId: body.conversationId,
        useBonusCall: planCallsLeft <= 0,
        existingContext,
      };

      if (useStreaming) {
        return runChatStreaming(
          ctx,
          messagesWithAttachmentsSingle,
          singlePersistCtx,
          undefined,
          attachmentStore,
          req.signal,
        );
      }

      return await runChat(
        ctx,
        messagesWithAttachmentsSingle,
        singlePersistCtx,
        undefined,
        attachmentStore,
        req.signal,
      );
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
    return Response.json({ error: error?.message ?? 'Internal server error' }, { status: 500 });
  }
}
