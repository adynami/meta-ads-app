/**
 * Sliding-window rate limiter.
 *
 * Production (Vercel): backed by Upstash Redis so limits hold across every
 * serverless instance. Set UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN.
 * Without them (local dev, tests) it falls back to an in-process Map, which
 * is only correct for a single long-lived process.
 */
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

// ── Upstash (shared) ────────────────────────────────────────────────────

let redis: Redis | null | undefined;
const limiters = new Map<string, Ratelimit>();

function getRedis(): Redis | null {
  if (redis === undefined) {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    redis = url && token ? new Redis({ url, token }) : null;
  }
  return redis;
}

function getLimiter(r: Redis, config: RateLimitConfig): Ratelimit {
  const id = `${config.maxRequests}/${config.windowMs}`;
  let limiter = limiters.get(id);
  if (!limiter) {
    limiter = new Ratelimit({
      redis: r,
      limiter: Ratelimit.slidingWindow(config.maxRequests, `${config.windowMs} ms`),
      prefix: 'adynami:rl',
    });
    limiters.set(id, limiter);
  }
  return limiter;
}

// ── In-memory fallback ──────────────────────────────────────────────────

const store = new Map<string, number[]>();

function memoryLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;
  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);
  if (timestamps.length >= config.maxRequests) {
    store.set(key, timestamps);
    return { allowed: false, remaining: 0 };
  }
  timestamps.push(now);
  store.set(key, timestamps);
  return { allowed: true, remaining: config.maxRequests - timestamps.length };
}

// ── Public API ──────────────────────────────────────────────────────────

export async function rateLimit(key: string, config: RateLimitConfig): Promise<RateLimitResult> {
  const r = getRedis();
  if (!r) return memoryLimit(key, config);
  try {
    const res = await getLimiter(r, config).limit(key);
    return { allowed: res.success, remaining: res.remaining };
  } catch (err) {
    // Redis outage: fail open on the shared limiter but keep a local guard.
    console.error('[rate-limit] Upstash error, using in-memory fallback:', err);
    return memoryLimit(key, config);
  }
}

/** Exported for testing — clears in-memory state and forces env re-read. */
export function _resetStore() {
  store.clear();
  limiters.clear();
  redis = undefined;
}
