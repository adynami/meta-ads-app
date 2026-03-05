/**
 * Imports all meta-mcp-server tool handlers and dispatches tool calls.
 * This is the bridge between Claude's tool_use responses and the Meta API.
 */

import type { TenantContext } from 'meta-mcp-server/tenant-context';
import {
  managementTools,
  handleManagementTool,
  analystTools,
  handleAnalystTool,
  creatorTools,
  handleCreatorTool,
  debugTools,
  handleDebugTool,
  duplicatorTools,
  handleDuplicatorTool,
  audienceTools,
  handleAudienceTool,
  updaterTools,
  handleUpdaterTool,
  pixelTools,
  handlePixelTool,
  rulesTools,
  handleRulesTool,
  leadsTools,
  handleLeadsTool,
  libraryTools,
  handleLibraryTool,
  conversionsTools,
  handleConversionsTool,
  catalogTools,
  handleCatalogTool,
  testingTools,
  handleTestingTool,
  valueRulesTools,
  handleValueRulesTool,
  budgetScheduleTools,
  handleBudgetScheduleTool,
  copyTools,
  handleCopyTool,
  briefTools,
  handleBriefTool,
  adLibraryTools,
  handleAdLibraryTool,
  performanceTools,
  handlePerformanceTool,
} from 'meta-mcp-server/tools';

import type { McpToolDef } from './tools-schema';

// ── All tool definitions (MCP format) ────────────────────────────────────────

export const ALL_TOOLS: McpToolDef[] = [
  ...managementTools,
  ...analystTools,
  ...creatorTools,
  ...debugTools,
  ...duplicatorTools,
  ...audienceTools,
  ...updaterTools,
  ...pixelTools,
  ...rulesTools,
  ...leadsTools,
  ...libraryTools,
  ...conversionsTools,
  ...catalogTools,
  ...testingTools,
  ...valueRulesTools,
  ...budgetScheduleTools,
  ...copyTools,
  ...briefTools,
  ...adLibraryTools,
  ...performanceTools,
] as McpToolDef[];

// ── Dispatch map ─────────────────────────────────────────────────────────────

type Handler = (
  ctx: TenantContext,
  name: string,
  args: Record<string, any>,
  attachmentStore?: Map<string, any>,
) => Promise<any>;

const dispatchMap = new Map<string, Handler>();

function register(tools: McpToolDef[], handler: Handler) {
  for (const t of tools) {
    dispatchMap.set(t.name, handler);
  }
}

register(managementTools as McpToolDef[], handleManagementTool);
register(analystTools as McpToolDef[], handleAnalystTool);
register(creatorTools as McpToolDef[], handleCreatorTool);
register(debugTools as McpToolDef[], handleDebugTool);
register(duplicatorTools as McpToolDef[], handleDuplicatorTool);
register(audienceTools as McpToolDef[], handleAudienceTool);
register(updaterTools as McpToolDef[], handleUpdaterTool);
register(pixelTools as McpToolDef[], handlePixelTool);
register(rulesTools as McpToolDef[], handleRulesTool);
register(leadsTools as McpToolDef[], handleLeadsTool);
register(libraryTools as McpToolDef[], handleLibraryTool);
register(conversionsTools as McpToolDef[], handleConversionsTool);
register(catalogTools as McpToolDef[], handleCatalogTool);
register(testingTools as McpToolDef[], handleTestingTool);
register(valueRulesTools as McpToolDef[], handleValueRulesTool);
register(budgetScheduleTools as McpToolDef[], handleBudgetScheduleTool);
register(copyTools as McpToolDef[], handleCopyTool);
register(briefTools as McpToolDef[], handleBriefTool);
register(adLibraryTools as McpToolDef[], handleAdLibraryTool);
register(performanceTools as McpToolDef[], handlePerformanceTool);

// ── Execute a single tool call ───────────────────────────────────────────────

export async function executeTool(
  ctx: TenantContext,
  toolName: string,
  args: Record<string, any>,
  attachmentStore?: Map<string, any>,
): Promise<string> {
  const handler = dispatchMap.get(toolName);
  if (!handler) {
    return JSON.stringify({ error: `Unknown tool: ${toolName}` });
  }

  try {
    const result = await handler(ctx, toolName, args, attachmentStore);
    return JSON.stringify(result);
  } catch (error: unknown) {
    const message = extractErrorMessage(error);
    const code =
      error instanceof Error && 'code' in error
        ? String((error as Record<string, unknown>).code)
        : undefined;
    return JSON.stringify({ error: message, ...(code ? { code } : {}) });
  }
}

function extractErrorMessage(error: unknown): string {
  const err = error as Record<string, any> | null;
  // Meta API errors — extract human-readable message with details
  if (err?.response?.error) {
    const e = err.response.error;
    const title = e.error_user_title ?? e.message ?? 'Unknown error';
    const detail = e.error_user_msg ? ` ${e.error_user_msg}` : '';
    const code = e.code ? ` (code ${e.code})` : '';
    const subcode = e.error_subcode ? `, subcode ${e.error_subcode}` : '';
    return `${title}${detail}${code}${subcode}`;
  }
  if (err?.error?.message) return err.error.message;
  if (error instanceof Error) return error.message;
  if (error && typeof error === 'object') {
    try {
      return JSON.stringify(error);
    } catch {
      return 'Unknown tool execution error';
    }
  }
  return 'Unknown tool execution error';
}
