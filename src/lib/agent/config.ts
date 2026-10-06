/**
 * Agent model configuration — the one place to change model, effort and
 * per-turn spend limits.
 *
 * Model routing: we deliberately use ONE model and ONE effort level for the
 * whole conversation. Switching model or top-level effort between requests
 * invalidates the prompt cache (and switching model drops thinking blocks),
 * which costs more than a cheap-model router saves. Tune CHAT_EFFORT instead.
 */
import type Anthropic from '@anthropic-ai/sdk';

export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export const AGENT_MODEL = process.env.CHAT_MODEL ?? 'claude-opus-5-5';

/** Default effort for chat turns. Opus 5.5 defaults to medium if omitted. */
export const DEFAULT_EFFORT: Effort = (process.env.CHAT_EFFORT as Effort) ?? 'medium';

/** Max model round-trips (each may run several tools in parallel) per user turn. */
export const MAX_TOOL_ROUNDS = 12;

/** Streaming lets us give the model room without HTTP timeouts. */
export const MAX_OUTPUT_TOKENS = 32_000;

/**
 * Advisory token budget the model paces itself against for one user turn
 * (task budgets beta). The hard stop is MAX_TURN_COST_CENTS below.
 */
export const TURN_TASK_BUDGET_TOKENS = 150_000;

/** Hard cost ceiling per user turn. One credit must never cost more than this. */
export const MAX_TURN_COST_CENTS = Number(process.env.MAX_TURN_COST_CENTS ?? 60);

/** Longest single user message we accept. */
export const MAX_USER_MESSAGE_CHARS = 20_000;

/** Tool result payloads are compacted to at most this many characters. */
export const MAX_TOOL_RESULT_CHARS = 24_000;

export const AGENT_BETAS: Anthropic.Beta.AnthropicBeta[] = [
  'compact-2026-01-12', // server-side compaction for long conversations
  'task-budgets-2026-03-13',
  'server-side-fallback-2026-07-01', // reroute on safety-classifier refusals
];
