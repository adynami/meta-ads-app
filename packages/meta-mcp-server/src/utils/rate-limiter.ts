/**
 * Per-ad-account Meta API throttling.
 *
 * Meta reports usage on EVERY response (success or error) via
 * `x-business-use-case-usage`, `x-ad-account-usage` and `x-app-usage`.
 * `metaFetch` (utils/graph.ts) feeds those headers here, keyed by the ad
 * account the request was made for, so one busy tenant never slows another.
 *
 * In serverless we must not sleep for a minute inside a request. Short waits
 * are absorbed; long ones fail fast with a MetaThrottledError that the agent
 * can relay to the user ("try again in ~N seconds").
 */

interface AccountState {
  /** Highest usage percentage Meta reported (0-100). */
  usagePct: number;
  /** Epoch ms before which calls should not be made. */
  blockedUntil: number;
  updatedAt: number;
}

const states = new Map<string, AccountState>();

/** Max time we'll wait in-process before failing fast. */
const MAX_INLINE_WAIT_MS = 8_000;

export class MetaThrottledError extends Error {
  code = 'META_THROTTLED';
  constructor(public retryAfterSec: number) {
    super(
      `Meta API rate limit for this ad account is nearly exhausted. Try again in about ${retryAfterSec}s.`,
    );
  }
}

function getState(key: string): AccountState {
  let s = states.get(key);
  if (!s) {
    s = { usagePct: 0, blockedUntil: 0, updatedAt: 0 };
    states.set(key, s);
  }
  return s;
}

function maxPct(obj: Record<string, unknown> | undefined): number {
  if (!obj) return 0;
  return Math.max(
    Number(obj.call_count ?? 0),
    Number(obj.total_cputime ?? 0),
    Number(obj.total_time ?? 0),
    Number(obj.acc_id_util_pct ?? 0),
  );
}

/** Parse Meta usage headers and update throttle state for `key`. */
export function noteUsageHeaders(key: string, headers: Headers | Record<string, string>): void {
  const get = (name: string): string | null =>
    headers instanceof Headers ? headers.get(name) : (headers[name] ?? null);

  let pct = 0;
  let waitMin = 0;
  try {
    const buc = get('x-business-use-case-usage');
    if (buc) {
      const parsed = JSON.parse(buc) as Record<string, Array<Record<string, unknown>>>;
      for (const entries of Object.values(parsed)) {
        for (const e of entries) {
          pct = Math.max(pct, maxPct(e));
          waitMin = Math.max(waitMin, Number(e.estimated_time_to_regain_access ?? 0));
        }
      }
    }
    const acc = get('x-ad-account-usage');
    if (acc) pct = Math.max(pct, maxPct(JSON.parse(acc)));
    const app = get('x-app-usage');
    if (app) pct = Math.max(pct, maxPct(JSON.parse(app)));
  } catch {
    // malformed header — ignore
  }

  const s = getState(key);
  s.usagePct = pct;
  s.updatedAt = Date.now();
  if (waitMin > 0) {
    s.blockedUntil = Date.now() + waitMin * 60_000;
  } else if (pct >= 95) {
    s.blockedUntil = Date.now() + 60_000;
  } else if (pct >= 85) {
    s.blockedUntil = Date.now() + 5_000;
  } else {
    s.blockedUntil = 0;
  }
}

/** Mark an account as throttled after an explicit rate-limit error. */
export function noteRateLimitError(key: string, waitMs: number): void {
  const s = getState(key);
  s.blockedUntil = Math.max(s.blockedUntil, Date.now() + waitMs);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Wait (briefly) until `key` may call Meta again, or throw MetaThrottledError. */
export async function awaitAccountSlot(key: string): Promise<void> {
  const s = states.get(key);
  if (!s || s.blockedUntil <= Date.now()) return;
  const wait = s.blockedUntil - Date.now();
  if (wait > MAX_INLINE_WAIT_MS) throw new MetaThrottledError(Math.ceil(wait / 1000));
  await sleep(wait);
}

const RATE_LIMIT_CODES = new Set([4, 17, 32, 613, 80000, 80003, 80004, 80014]);

export function isRateLimitError(err: any): boolean {
  const code = err?.error?.code ?? err?.response?.error?.code;
  return err?.status === 429 || RATE_LIMIT_CODES.has(Number(code));
}

/**
 * Retry wrapper for Meta calls. Throttle state itself is handled per account
 * in `metaFetch`; this only retries explicit rate-limit errors, briefly.
 */
export async function rateLimitedCall<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (err instanceof MetaThrottledError) throw err;
      if (!isRateLimitError(err) || attempt >= maxRetries) throw err;
      await sleep(2_000 * Math.pow(2, attempt)); // 2s, 4s
    }
  }
}

/** Exported for tests. */
export function _resetRateLimitState(): void {
  states.clear();
}
