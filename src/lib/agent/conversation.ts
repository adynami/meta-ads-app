import type Anthropic from '@anthropic-ai/sdk';
import { and, eq, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { conversations } from '@/lib/db/schema';
import type { ActionView, ToolCall } from '@/types/chat';

export type ConversationRow = typeof conversations.$inferSelect;

/** Display history kept for the UI (the API transcript is separate). */
const MAX_DISPLAY_MESSAGES = 200;
/** Tool results stored for display are clipped; the model's copy is in the transcript. */
const MAX_DISPLAY_RESULT_CHARS = 4_000;

export interface DisplayMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  toolCalls?: ToolCall[];
  actions?: ActionView[];
  attachments?: { id: string; name: string; media_type: string }[];
}

export async function getConversation(
  userId: string,
  conversationId: string,
): Promise<ConversationRow | null> {
  const [row] = await db
    .select()
    .from(conversations)
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function createConversation(
  userId: string,
  adAccountId: string | null,
  title: string,
): Promise<ConversationRow> {
  const [row] = await db
    .insert(conversations)
    .values({ userId, adAccountId, title: title.slice(0, 100) || 'New conversation' })
    .returning();
  return row;
}

/**
 * Append one turn atomically: transcript entries (append-only) and display
 * messages (trimmed to the most recent MAX_DISPLAY_MESSAGES).
 */
export async function appendTurn(
  conversationId: string,
  userId: string,
  transcriptEntries: Anthropic.Beta.BetaMessageParam[],
  display: DisplayMessage[],
): Promise<void> {
  const clipped = display.map((m) => ({
    ...m,
    toolCalls: m.toolCalls?.map((tc) => ({
      ...tc,
      result:
        tc.result.length > MAX_DISPLAY_RESULT_CHARS
          ? `${tc.result.slice(0, MAX_DISPLAY_RESULT_CHARS)}…`
          : tc.result,
    })),
  }));
  const displayJson = JSON.stringify(clipped);
  await db
    .update(conversations)
    .set({
      transcript: sql`${conversations.transcript} || ${JSON.stringify(transcriptEntries)}::jsonb`,
      messages: sql`(
        SELECT COALESCE(jsonb_agg(elem ORDER BY ord), '[]'::jsonb) FROM (
          SELECT elem, ord FROM jsonb_array_elements(${conversations.messages} || ${displayJson}::jsonb)
            WITH ORDINALITY AS t(elem, ord)
          ORDER BY ord DESC
          LIMIT ${MAX_DISPLAY_MESSAGES}
        ) recent
      )`,
      updatedAt: new Date(),
    })
    .where(and(eq(conversations.id, conversationId), eq(conversations.userId, userId)));
}
