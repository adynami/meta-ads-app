import { MAX_TOOL_RESULT_CHARS } from './config';

/**
 * Shrink a tool result before it goes into the model's context:
 *  - drop null / undefined / empty-string / empty-array fields
 *  - round long floats (Meta returns strings like "1.23456789")
 *  - if still too large, cap the longest arrays and say how many rows were cut
 *
 * Numbers are never altered beyond rounding to 4 significant decimals, so
 * the model can still quote figures exactly as the UI shows them.
 */
export function compactResult(value: unknown, maxChars = MAX_TOOL_RESULT_CHARS): string {
  const cleaned = clean(value);
  let json = JSON.stringify(cleaned);
  if (json === undefined) return 'null';
  if (json.length <= maxChars) return json;

  // Progressively cap arrays until the payload fits.
  for (const cap of [200, 100, 50, 25, 10, 5]) {
    const capped = capArrays(cleaned, cap);
    json = JSON.stringify(capped.value);
    if (json.length <= maxChars) {
      return JSON.stringify({
        ...(isPlainObject(capped.value) ? capped.value : { data: capped.value }),
        _truncated: `Showing first ${cap} rows of each list; ${capped.dropped} rows omitted. Narrow the query (filters, date range, limit) to see the rest.`,
      });
    }
  }
  return JSON.stringify({
    _truncated:
      'Result too large to include. Narrow the query (filters, fewer fields, shorter date range).',
    preview: json.slice(0, Math.floor(maxChars / 2)),
  });
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null && !Array.isArray(v);
}

const FLOAT_STRING = /^-?\d+\.\d{5,}$/;

function clean(v: unknown): unknown {
  if (v === null || v === undefined || v === '') return undefined;
  if (typeof v === 'number') return Number.isInteger(v) ? v : Math.round(v * 1e4) / 1e4;
  if (typeof v === 'string') {
    return FLOAT_STRING.test(v) ? String(Math.round(Number(v) * 1e4) / 1e4) : v;
  }
  if (Array.isArray(v)) {
    const out = v.map(clean).filter((x) => x !== undefined);
    return out;
  }
  if (isPlainObject(v)) {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v)) {
      const c = clean(val);
      if (c === undefined) continue;
      if (Array.isArray(c) && c.length === 0) continue;
      out[k] = c;
    }
    return out;
  }
  return v;
}

function capArrays(v: unknown, cap: number): { value: unknown; dropped: number } {
  let dropped = 0;
  const walk = (x: unknown): unknown => {
    if (Array.isArray(x)) {
      if (x.length > cap) dropped += x.length - cap;
      return x.slice(0, cap).map(walk);
    }
    if (isPlainObject(x)) {
      const out: Record<string, unknown> = {};
      for (const [k, val] of Object.entries(x)) out[k] = walk(val);
      return out;
    }
    return x;
  };
  return { value: walk(v), dropped };
}
