/**
 * Converts MCP tool definitions to Anthropic tool_use format.
 * MCP tools have { name, description, inputSchema } — Anthropic expects
 * { name, description, input_schema } with identical JSON Schema bodies.
 */

import type Anthropic from '@anthropic-ai/sdk';

export interface McpToolDef {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export function mcpToAnthropic(tools: McpToolDef[]): Anthropic.Tool[] {
  return tools.map((t) => ({
    name: t.name,
    description: t.description,
    input_schema: t.inputSchema as Anthropic.Tool.InputSchema,
  }));
}
