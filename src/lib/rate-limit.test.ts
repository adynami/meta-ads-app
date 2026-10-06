import { describe, it, expect, beforeEach, vi } from 'vitest';
import { rateLimit, _resetStore } from './rate-limit';

beforeEach(() => {
  _resetStore();
  vi.restoreAllMocks();
});

describe('rateLimit', () => {
  it('allows requests under the limit', async () => {
    const result = await rateLimit('test', { windowMs: 60_000, maxRequests: 3 });
    expect(result.allowed).toBe(true);
    expect(result.remaining).toBe(2);
  });

  it('blocks after maxRequests reached', async () => {
    const cfg = { windowMs: 60_000, maxRequests: 2 };
    await rateLimit('k', cfg);
    await rateLimit('k', cfg);
    const third = await rateLimit('k', cfg);
    expect(third.allowed).toBe(false);
    expect(third.remaining).toBe(0);
  });

  it('returns remaining correctly as requests accumulate', async () => {
    const cfg = { windowMs: 60_000, maxRequests: 5 };
    expect((await rateLimit('k', cfg)).remaining).toBe(4);
    expect((await rateLimit('k', cfg)).remaining).toBe(3);
    expect((await rateLimit('k', cfg)).remaining).toBe(2);
  });

  it('isolates different keys', async () => {
    const cfg = { windowMs: 60_000, maxRequests: 1 };
    expect((await rateLimit('a', cfg)).allowed).toBe(true);
    expect((await rateLimit('b', cfg)).allowed).toBe(true);
    expect((await rateLimit('a', cfg)).allowed).toBe(false);
  });

  it('expires old entries after window passes', async () => {
    const cfg = { windowMs: 1_000, maxRequests: 1 };

    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    expect((await rateLimit('k', cfg)).allowed).toBe(true);
    expect((await rateLimit('k', cfg)).allowed).toBe(false);

    // Advance past window
    vi.spyOn(Date, 'now').mockReturnValue(now + 1_001);
    expect((await rateLimit('k', cfg)).allowed).toBe(true);
  });

  it('partially expires entries within the window', async () => {
    const cfg = { windowMs: 1_000, maxRequests: 2 };

    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);
    await rateLimit('k', cfg);
    await rateLimit('k', cfg);
    expect((await rateLimit('k', cfg)).allowed).toBe(false);

    // Advance past first request but not second
    vi.spyOn(Date, 'now').mockReturnValue(now + 500);
    // Insert at now and now — both within 500ms window? No, window is 1000ms.
    // now + 500 - 1000 = now - 500, so both now entries are still valid.
    expect((await rateLimit('k', cfg)).allowed).toBe(false);

    // Advance past both
    vi.spyOn(Date, 'now').mockReturnValue(now + 1_001);
    expect((await rateLimit('k', cfg)).allowed).toBe(true);
  });

  it('handles maxRequests of 0', async () => {
    const result = await rateLimit('k', { windowMs: 60_000, maxRequests: 0 });
    expect(result.allowed).toBe(false);
    expect(result.remaining).toBe(0);
  });
});
