import { describe, it, expect } from 'vitest';
import { mcpToAnthropic, mcpToAnthropicCached, type McpToolDef } from './tools-schema';

const makeTool = (name: string): McpToolDef => ({
  name,
  description: `${name} description`,
  inputSchema: {
    type: 'object',
    properties: { id: { type: 'string' } },
    required: ['id'],
  },
});

describe('mcpToAnthropic', () => {
  it('returns empty array for empty input', () => {
    expect(mcpToAnthropic([])).toEqual([]);
  });

  it('converts inputSchema to input_schema', () => {
    const result = mcpToAnthropic([makeTool('get_campaign')]);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('get_campaign');
    expect(result[0].description).toBe('get_campaign description');
    expect(result[0].input_schema).toEqual({
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    });
    expect(result[0]).not.toHaveProperty('inputSchema');
  });

  it('preserves nested schema properties', () => {
    const tool: McpToolDef = {
      name: 'complex',
      description: 'complex tool',
      inputSchema: {
        type: 'object',
        properties: {
          filter: {
            type: 'object',
            properties: {
              status: { type: 'string', enum: ['active', 'paused'] },
            },
          },
        },
      },
    };
    const result = mcpToAnthropic([tool]);
    expect(result[0].input_schema.properties.filter.properties.status.enum).toEqual([
      'active',
      'paused',
    ]);
  });
});

describe('mcpToAnthropicCached', () => {
  it('adds cache_control to last tool only', () => {
    const result = mcpToAnthropicCached([makeTool('a'), makeTool('b'), makeTool('c')]);
    expect(result[0]).not.toHaveProperty('cache_control');
    expect(result[1]).not.toHaveProperty('cache_control');
    expect(result[2].cache_control).toEqual({ type: 'ephemeral' });
  });

  it('adds cache_control when single tool', () => {
    const result = mcpToAnthropicCached([makeTool('only')]);
    expect(result[0].cache_control).toEqual({ type: 'ephemeral' });
  });
});
