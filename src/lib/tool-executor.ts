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
    let message: string;
    let code: string | undefined;
    if (error instanceof Error) {
      message = error.message;
      code = 'code' in error ? String((error as Record<string, unknown>).code) : undefined;
    } else if (error && typeof error === 'object') {
      try {
        message = JSON.stringify(error);
      } catch {
        message = 'Unknown tool execution error';
      }
    } else {
      message = 'Unknown tool execution error';
    }
    return JSON.stringify({ error: message, ...(code ? { code } : {}) });
  }
}
