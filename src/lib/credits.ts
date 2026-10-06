import { sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { PLAN_LIMITS, type Plan } from '@/lib/plans';

export function currentMonth(now = new Date()): string {
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export type Reservation =
  | { ok: true; source: 'monthly' | 'bonus'; month: string }
  | { ok: false; used: number; limit: number };

/**
 * Atomically reserve one credit BEFORE running a turn.
 *
 * Each step is a single conditional SQL statement, so concurrent requests
 * can't both pass a "credits left?" check and overspend:
 *  1. take a monthly credit: increment usage only while api_calls < limit
 *  2. else take a bonus credit: decrement bonus_calls only while > 0, and
 *     record the turn in usage in the same statement (CTE)
 */
export async function reserveCredit(userId: string, plan: string): Promise<Reservation> {
  const limit = (PLAN_LIMITS[plan as Plan] ?? PLAN_LIMITS.trial).monthlyCredits;
  const month = currentMonth();

  const monthly = await db.execute(sql`
    INSERT INTO usage (user_id, month, api_calls)
    VALUES (${userId}, ${month}, 1)
    ON CONFLICT (user_id, month) DO UPDATE SET api_calls = usage.api_calls + 1
    WHERE usage.api_calls < ${limit}
    RETURNING api_calls
  `);
  if (rowsOf(monthly).length > 0) return { ok: true, source: 'monthly', month };

  const bonus = await db.execute(sql`
    WITH b AS (
      UPDATE users SET bonus_calls = bonus_calls - 1
      WHERE id = ${userId} AND bonus_calls > 0
      RETURNING id
    )
    INSERT INTO usage (user_id, month, api_calls)
    SELECT id, ${month}, 1 FROM b
    ON CONFLICT (user_id, month) DO UPDATE SET api_calls = usage.api_calls + 1
    RETURNING api_calls
  `);
  if (rowsOf(bonus).length > 0) return { ok: true, source: 'bonus', month };

  return { ok: false, used: limit, limit };
}

/** Give a reserved credit back (turn failed before producing anything). */
export async function refundCredit(userId: string, reservation: Reservation): Promise<void> {
  if (!reservation.ok) return;
  await db.execute(sql`
    UPDATE usage SET api_calls = GREATEST(api_calls - 1, 0)
    WHERE user_id = ${userId} AND month = ${reservation.month}
  `);
  if (reservation.source === 'bonus') {
    await db.execute(sql`UPDATE users SET bonus_calls = bonus_calls + 1 WHERE id = ${userId}`);
  }
}

/** Record token spend for a finished turn (the credit itself was already taken). */
export async function recordTokenUsage(
  userId: string,
  month: string,
  inputTokens: number,
  outputTokens: number,
  costCents: number,
): Promise<void> {
  await db.execute(sql`
    UPDATE usage SET
      input_tokens = input_tokens + ${inputTokens},
      output_tokens = output_tokens + ${outputTokens},
      estimated_cost_cents = estimated_cost_cents + ${costCents}
    WHERE user_id = ${userId} AND month = ${month}
  `);
}

function rowsOf(result: unknown): unknown[] {
  // neon-http returns { rows }, some drivers return the array directly
  if (Array.isArray(result)) return result;
  return ((result as { rows?: unknown[] })?.rows ?? []) as unknown[];
}
