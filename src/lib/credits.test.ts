import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PgDialect } from 'drizzle-orm/pg-core';
import type { SQL } from 'drizzle-orm';

const execute = vi.fn();
vi.mock('@/lib/db', () => ({ db: { execute: (q: SQL) => execute(q) } }));

import { reserveCredit, refundCredit } from './credits';

const dialect = new PgDialect();
const sqlOf = (call: number) => dialect.sqlToQuery(execute.mock.calls[call][0]).sql;

beforeEach(() => execute.mockReset());

describe('reserveCredit', () => {
  it('takes a monthly credit with a conditional upsert', async () => {
    execute.mockResolvedValueOnce({ rows: [{ api_calls: 3 }] });
    const r = await reserveCredit('u1', 'basic');
    expect(r).toMatchObject({ ok: true, source: 'monthly' });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(sqlOf(0)).toMatch(/WHERE usage\.api_calls < \$\d/);
  });

  it('falls through to a bonus credit atomically when monthly credits are gone', async () => {
    execute
      .mockResolvedValueOnce({ rows: [] })
      .mockResolvedValueOnce({ rows: [{ api_calls: 76 }] });
    const r = await reserveCredit('u1', 'basic');
    expect(r).toMatchObject({ ok: true, source: 'bonus' });
    expect(sqlOf(1)).toMatch(/bonus_calls > 0/);
    expect(sqlOf(1)).toMatch(/WITH b AS/);
  });

  it('refuses when both pools are empty', async () => {
    execute.mockResolvedValue({ rows: [] });
    expect(await reserveCredit('u1', 'trial')).toEqual({ ok: false, used: 25, limit: 25 });
  });
});

describe('refundCredit', () => {
  it('returns a bonus credit to the bonus pool', async () => {
    execute.mockResolvedValue({ rows: [] });
    await refundCredit('u1', { ok: true, source: 'bonus', month: '2026-10' });
    expect(execute).toHaveBeenCalledTimes(2);
    expect(sqlOf(1)).toMatch(/bonus_calls = bonus_calls \+ 1/);
  });

  it('only decrements usage for a monthly credit', async () => {
    execute.mockResolvedValue({ rows: [] });
    await refundCredit('u1', { ok: true, source: 'monthly', month: '2026-10' });
    expect(execute).toHaveBeenCalledTimes(1);
    expect(sqlOf(0)).toMatch(/GREATEST\(api_calls - 1, 0\)/);
  });
});
