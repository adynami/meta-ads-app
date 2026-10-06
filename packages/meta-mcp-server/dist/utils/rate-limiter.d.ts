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
export declare class MetaThrottledError extends Error {
    retryAfterSec: number;
    code: string;
    constructor(retryAfterSec: number);
}
/** Parse Meta usage headers and update throttle state for `key`. */
export declare function noteUsageHeaders(key: string, headers: Headers | Record<string, string>): void;
/** Mark an account as throttled after an explicit rate-limit error. */
export declare function noteRateLimitError(key: string, waitMs: number): void;
/** Wait (briefly) until `key` may call Meta again, or throw MetaThrottledError. */
export declare function awaitAccountSlot(key: string): Promise<void>;
export declare function isRateLimitError(err: any): boolean;
/**
 * Retry wrapper for Meta calls. Throttle state itself is handled per account
 * in `metaFetch`; this only retries explicit rate-limit errors, briefly.
 */
export declare function rateLimitedCall<T>(fn: () => Promise<T>, maxRetries?: number): Promise<T>;
/** Exported for tests. */
export declare function _resetRateLimitState(): void;
//# sourceMappingURL=rate-limiter.d.ts.map