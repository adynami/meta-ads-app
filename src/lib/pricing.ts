/**
 * Model pricing configuration.
 * Rates are in USD per million tokens (Anthropic first-party API).
 * Cache writes are 1.25x input (5-minute TTL).
 */
export const MODEL_PRICING: Record<
  string,
  { input: number; output: number; cacheWrite: number; cacheRead: number }
> = {
  'claude-opus-5-5': { input: 4, output: 20, cacheWrite: 5, cacheRead: 0.2 },
  'claude-sonnet-5-5': { input: 2, output: 10, cacheWrite: 2.5, cacheRead: 0.2 },
  'claude-haiku-4-5': { input: 1, output: 5, cacheWrite: 1.25, cacheRead: 0.1 },
  'claude-sonnet-4-6': { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
};

const FALLBACK_MODEL = 'claude-opus-5-5';

/** Exact (fractional) cost in cents. Round only when storing. */
export function costCents(
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens = 0,
  cacheReadTokens = 0,
  model: string = FALLBACK_MODEL,
): number {
  const p = MODEL_PRICING[model] ?? MODEL_PRICING[FALLBACK_MODEL];
  const dollars =
    (inputTokens * p.input +
      outputTokens * p.output +
      cacheCreationTokens * p.cacheWrite +
      cacheReadTokens * p.cacheRead) /
    1_000_000;
  return dollars * 100;
}

export function estimateCostCents(
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens = 0,
  cacheReadTokens = 0,
  model: string = FALLBACK_MODEL,
): number {
  return Math.round(
    costCents(inputTokens, outputTokens, cacheCreationTokens, cacheReadTokens, model),
  );
}
