/**
 * Chat request orchestration: auth → credit reservation → tenants →
 * conversation + attachments → agent turn → persistence → response.
 *
 * The client sends ONLY the new user message (+ conversationId). History is
 * loaded server-side from the stored transcript, so it can't be forged and
 * tool results survive across turns.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { isTrialExpired } from '@/lib/plans';
import { reserveCredit, refundCredit, recordTokenUsage, type Reservation } from '@/lib/credits';
import { devEnvTenant, loadTenants, type Tenant, type UserRow } from '@/lib/tenants';
import {
  attachmentBlocks,
  loadAttachmentStore,
  saveAttachments,
  validateAttachmentRef,
} from '@/lib/attachment-store';
import type { AttachmentRef } from '@/lib/attachments';
import { MAX_USER_MESSAGE_CHARS } from '@/lib/agent/config';
import { runAgentTurn, type TurnOutput } from '@/lib/agent/engine';
import {
  appendTurn,
  createConversation,
  getConversation,
  type ConversationRow,
} from '@/lib/agent/conversation';
import type { StreamEvent } from '@/types/chat';

export interface ChatRequestBody {
  message?: unknown;
  conversationId?: unknown;
  accountId?: unknown;
  attachments?: unknown;
  stream?: unknown;
}

export class ChatError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public extra?: Record<string, unknown>,
  ) {
    super(message);
  }
}

export interface ParsedChatRequest {
  message: string;
  conversationId: string | null;
  accountId: string | null;
  attachments: AttachmentRef[];
  stream: boolean;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const MAX_ATTACHMENTS = 10;

export function parseChatRequest(body: ChatRequestBody): ParsedChatRequest {
  const message = typeof body.message === 'string' ? body.message.trim() : '';
  const attachments = Array.isArray(body.attachments) ? (body.attachments as AttachmentRef[]) : [];
  if (!message && attachments.length === 0) throw new ChatError('message is required', 400);
  if (message.length > MAX_USER_MESSAGE_CHARS) {
    throw new ChatError(`message exceeds ${MAX_USER_MESSAGE_CHARS} characters`, 400);
  }
  if (attachments.length > MAX_ATTACHMENTS) {
    throw new ChatError(`at most ${MAX_ATTACHMENTS} attachments per message`, 400);
  }
  const conversationId = typeof body.conversationId === 'string' ? body.conversationId : null;
  if (conversationId && !UUID.test(conversationId))
    throw new ChatError('invalid conversationId', 400);
  const accountId = typeof body.accountId === 'string' ? body.accountId : null;
  if (accountId && accountId !== 'all' && !UUID.test(accountId)) {
    throw new ChatError('invalid accountId', 400);
  }
  return { message, conversationId, accountId, attachments, stream: body.stream !== false };
}

/** Everything needed to run a turn, resolved before any credit is spent. */
interface PreparedTurn {
  user: UserRow | null;
  tenants: Tenant[];
  multiAccount: boolean;
  conversation: ConversationRow | null;
}

export async function prepareTurn(
  user: UserRow | null,
  req: ParsedChatRequest,
): Promise<PreparedTurn> {
  if (!user) {
    const dev = devEnvTenant();
    if (!dev) throw new ChatError('Unauthorized', 401);
    return { user: null, tenants: [dev], multiAccount: false, conversation: null };
  }

  if (isTrialExpired(user.plan, user.trialEndsAt)) {
    throw new ChatError(
      'Your trial has expired. Please subscribe to continue.',
      403,
      'TRIAL_EXPIRED',
    );
  }

  for (const ref of req.attachments) {
    const err = validateAttachmentRef(ref, user.id);
    if (err) throw new ChatError(err, 400);
  }

  const conversation = req.conversationId
    ? await getConversation(user.id, req.conversationId)
    : null;
  if (req.conversationId && !conversation) throw new ChatError('Conversation not found', 404);

  // A conversation is bound to the account scope it started with.
  const accountId = conversation
    ? (conversation.adAccountId ?? (req.accountId === 'all' ? 'all' : req.accountId))
    : req.accountId;

  const { tenants, failed } = await loadTenants(user.id, accountId);
  if (tenants.length === 0) {
    if (failed.length) {
      throw new ChatError(
        'Failed to decrypt the ad account token. Please reconnect in Settings.',
        400,
        'TOKEN_DECRYPT_FAILED',
      );
    }
    throw new ChatError(
      'No connected ad account found. Go to Settings to connect your Meta ad account.',
      400,
      'NO_ACCOUNT',
    );
  }

  return { user, tenants, multiAccount: accountId === 'all', conversation };
}

/**
 * Atomically take one credit for this turn. Call before streaming starts so
 * an empty balance is a real 429, not an in-stream error.
 */
export async function reserveTurnCredit(prepared: PreparedTurn): Promise<Reservation | null> {
  const { user } = prepared;
  if (!user) return null;
  const reservation = await reserveCredit(user.id, user.plan);
  if (!reservation.ok) {
    throw new ChatError(
      `You've used all ${reservation.limit} credits on the ${user.plan} plan. Buy a credit pack or upgrade for more.`,
      429,
      'RATE_LIMITED',
      { canTopUp: true, usage: { current: reservation.used, limit: reservation.limit } },
    );
  }
  return reservation;
}

/**
 * Run one chat turn, emitting events as it goes. Refunds the reserved credit
 * if the turn fails or the model never produced anything.
 */
export async function runChatTurn(
  prepared: PreparedTurn,
  reservation: Reservation | null,
  req: ParsedChatRequest,
  emit: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<{ conversationId: string | null; output: TurnOutput }> {
  const { user, tenants, multiAccount } = prepared;

  try {
    let conversation = prepared.conversation;
    if (user && !conversation) {
      conversation = await createConversation(
        user.id,
        multiAccount ? null : tenants[0].id,
        req.message || 'Attachment',
      );
    }
    const conversationId = conversation?.id ?? null;
    if (conversationId) emit({ type: 'start', conversationId });

    const saved =
      user && conversationId ? await saveAttachments(user.id, conversationId, req.attachments) : [];
    const attachmentStore =
      user && conversationId ? await loadAttachmentStore(user.id, conversationId) : new Map();

    const userContent: Anthropic.Beta.BetaContentBlockParam[] = [
      ...attachmentBlocks(saved),
      ...(req.message ? [{ type: 'text' as const, text: req.message }] : []),
    ];

    const output = await runAgentTurn({
      userId: user?.id ?? null,
      conversationId,
      tenants,
      multiAccount,
      history: (conversation?.transcript ?? []) as Anthropic.Beta.BetaMessageParam[],
      legacyContext: conversation?.context ?? null,
      userContent,
      attachmentStore,
      signal,
      emit,
    });

    if (user && conversationId) {
      const now = new Date().toISOString();
      await appendTurn(conversationId, user.id, output.newEntries, [
        {
          role: 'user',
          content: req.message,
          timestamp: now,
          attachments: saved.map((a) => ({ id: a.id, name: a.name, media_type: a.mediaType })),
        },
        {
          role: 'assistant',
          content: output.text,
          timestamp: now,
          toolCalls: output.toolCalls,
          actions: output.actions,
        },
      ]);
      if (reservation?.ok) {
        if (!output.producedOutput) {
          await refundCredit(user.id, reservation);
        } else {
          await recordTokenUsage(
            user.id,
            reservation.month,
            output.usage.inputTokens,
            output.usage.outputTokens,
            Math.round(output.usage.costCents),
          );
        }
      }
    }

    return { conversationId, output };
  } catch (err) {
    if (user && reservation?.ok) await refundCredit(user.id, reservation).catch(() => {});
    throw err;
  }
}

// ── Response adapters ─────────────────────────────────────────────────────

export function sseResponse(
  run: (emit: (event: StreamEvent) => void) => Promise<{ conversationId: string | null }>,
): Response {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const write = (event: StreamEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // client went away
        }
      };
      try {
        const { conversationId } = await run(write);
        write({ type: 'done', conversationId: conversationId ?? undefined });
      } catch (err) {
        const e = err as ChatError;
        console.error('[chat] turn failed:', err);
        write({
          type: 'error',
          message: err instanceof ChatError ? e.message : 'Something went wrong. Please try again.',
          code: e?.code,
        });
      } finally {
        try {
          controller.close();
        } catch {
          // already closed
        }
      }
    },
  });
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
