import { describe, it, expect } from 'vitest';
import { ALL_TOOLS } from './tool-executor';
import { READ_TOOLS, WRITE_TOOLS, isWriteTool } from './tool-policy';

describe('tool policy', () => {
  const names = ALL_TOOLS.map((t) => t.name);

  it('classifies every exposed tool exactly once', () => {
    const unclassified = names.filter((n) => !READ_TOOLS.has(n) && !WRITE_TOOLS.has(n));
    const both = names.filter((n) => READ_TOOLS.has(n) && WRITE_TOOLS.has(n));
    expect(unclassified).toEqual([]);
    expect(both).toEqual([]);
  });

  it('has no stale entries for tools that no longer exist', () => {
    const known = new Set(names);
    expect([...READ_TOOLS, ...WRITE_TOOLS].filter((n) => !known.has(n))).toEqual([]);
  });

  it('treats mutating verbs as writes', () => {
    for (const n of names) {
      if (
        /_(create|update|delete|deploy|duplicate|upload|send|add|bulk)_/.test(`_${n.slice(5)}_`)
      ) {
        expect(isWriteTool(n), n).toBe(true);
      }
    }
  });

  it('fails closed for unknown tools', () => {
    expect(isWriteTool('meta_some_new_tool')).toBe(true);
  });
});
