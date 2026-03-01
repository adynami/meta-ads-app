/**
 * Model pricing configuration.
 * Rates are in USD per million tokens.
 */
export const MODEL_PRICING = {
  'claude-sonnet-4-6': {
    input: 3,
    output: 15,
    cacheWrite: 3.75,
    cacheRead: 0.30,
  },
} as const;

type ModelId = keyof typeof MODEL_PRICING;

export function estimateCostCents(
  inputTokens: number,
  outputTokens: number,
  cacheCreationTokens = 0,
  cacheReadTokens = 0,
  model: ModelId = 'claude-sonnet-4-6',
): number {
  const pricing = MODEL_PRICING[model];
  const inputCost = (inputTokens / 1_000_000) * pricing.input;
  const outputCost = (outputTokens / 1_000_000) * pricing.output;
  const cacheWriteCost = (cacheCreationTokens / 1_000_000) * pricing.cacheWrite;
  const cacheReadCost = (cacheReadTokens / 1_000_000) * pricing.cacheRead;
  return Math.round((inputCost + outputCost + cacheWriteCost + cacheReadCost) * 100);
}
