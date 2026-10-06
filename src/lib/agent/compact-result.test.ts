import { describe, it, expect } from 'vitest';
import { compactResult } from './compact-result';

describe('compactResult', () => {
  it('drops empty fields and rounds long floats', () => {
    const out = JSON.parse(
      compactResult({ a: null, b: '', c: [], d: 1.234567891, e: '0.123456789', f: 'x', id: '123' }),
    );
    expect(out).toEqual({ d: 1.2346, e: '0.1235', f: 'x', id: '123' });
  });

  it('leaves small results untouched otherwise', () => {
    const v = { campaigns: [{ id: '1', name: 'A', spend: '10.50' }] };
    expect(JSON.parse(compactResult(v))).toEqual(v);
  });

  it('caps long arrays and reports what was cut', () => {
    const rows = Array.from({ length: 1000 }, (_, i) => ({ id: String(i), name: `row ${i}` }));
    const out = JSON.parse(compactResult({ rows }, 5_000));
    expect(out.rows.length).toBeLessThan(1000);
    expect(out._truncated).toMatch(/rows omitted/);
    expect(JSON.stringify(out).length).toBeLessThanOrEqual(5_000 + 300);
  });

  it('wraps top-level arrays when truncating', () => {
    const rows = Array.from({ length: 1000 }, (_, i) => ({ id: String(i) }));
    const out = JSON.parse(compactResult(rows, 2_000));
    expect(Array.isArray(out.data)).toBe(true);
    expect(out._truncated).toBeDefined();
  });
});
