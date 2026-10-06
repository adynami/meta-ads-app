import type Anthropic from '@anthropic-ai/sdk';
import { ALL_TOOLS } from '@/lib/tool-executor';
import type { McpToolDef } from '@/lib/tools-schema';
import { isWriteTool, TARGET_ACCOUNT_PARAM } from '@/lib/tool-policy';

/**
 * Tools loaded into context up front. Everything else is deferred and found
 * through tool search, which keeps ~70 schemas out of every request and keeps
 * tool selection accurate. Pick the most frequently used read tools.
 */
export const CORE_TOOLS = new Set([
  'meta_get_account',
  'meta_list_campaigns',
  'meta_list_adsets',
  'meta_list_ads',
  'meta_get_insights',
]);

const TOOL_SEARCH: Anthropic.Beta.BetaToolUnion = {
  type: 'tool_search_tool_bm25_20251119',
  name: 'tool_search_tool_bm25',
};

/**
 * Build the `tools` array for a conversation. The result must be identical
 * for every request in a conversation (it is the head of the cache prefix),
 * so it depends only on `multiAccount`, never on per-turn state.
 */
export function buildAgentTools(multiAccount: boolean): Anthropic.Beta.BetaToolUnion[] {
  const defs = [...(ALL_TOOLS as McpToolDef[])].sort((a, b) => a.name.localeCompare(b.name));
  const tools: Anthropic.Beta.BetaToolUnion[] = [TOOL_SEARCH];
  for (const t of defs) {
    tools.push({
      name: t.name,
      description: t.description,
      input_schema: withTargetAccount(t, multiAccount) as Anthropic.Beta.BetaTool.InputSchema,
      ...(CORE_TOOLS.has(t.name) ? {} : { defer_loading: true }),
    });
  }
  return tools;
}

function withTargetAccount(t: McpToolDef, multiAccount: boolean): McpToolDef['inputSchema'] {
  if (!multiAccount || !isWriteTool(t.name)) return t.inputSchema;
  return {
    ...t.inputSchema,
    properties: {
      ...t.inputSchema.properties,
      [TARGET_ACCOUNT_PARAM]: {
        type: 'string',
        description:
          'Required in multi-account mode: the act_ ID of the ONE ad account this change applies to.',
      },
    },
    required: [...(t.inputSchema.required ?? []), TARGET_ACCOUNT_PARAM],
  };
}
