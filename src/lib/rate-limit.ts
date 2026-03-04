/**
 * In-memory sliding window rate limiter.
 * Suitable for single-process / serverless deployments.
 */

const store = new Map<string, number[]>();

export interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
}

export function rateLimit(key: string, config: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  let timestamps = store.get(key);
  if (!timestamps) {
    timestamps = [];
    store.set(key, timestamps);
  }

  // Remove expired entries
  const firstValid = timestamps.findIndex((t) => t > windowStart);
  if (firstValid > 0) {
    timestamps.splice(0, firstValid);
  } else if (firstValid === -1) {
    timestamps.length = 0;
  }

  const remaining = Math.max(0, config.maxRequests - timestamps.length);

  if (timestamps.length >= config.maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  timestamps.push(now);
  return { allowed: true, remaining: remaining - 1 };
}

/** Exported for testing — clears all stored timestamps. */
export function _resetStore() {
  store.clear();
}
