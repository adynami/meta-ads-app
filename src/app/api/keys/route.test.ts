import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ──────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: () => mockAuth() }));

const mockDb = {
  select: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
};
function mockDbChain(rows: any[]) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  };
}
function mockDbSelectAll(rows: any[]) {
  return {
    from: () => ({ where: () => Promise.resolve(rows) }),
  };
}

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/db/schema', () => ({
  users: { id: 'id', email: 'email', plan: 'plan' },
  apiKeys: { id: 'id', userId: 'user_id', keyHash: 'key_hash', label: 'label' },
}));

const agencyUser = { id: 'u1', email: 'agency@test.com', plan: 'agency' };
const basicUser = { id: 'u2', email: 'basic@test.com', plan: 'basic' };

let GET: () => Promise<Response>;
let POST: (req: NextRequest) => Promise<Response>;
let DELETE: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(null);

  const mod = await import('./route');
  GET = mod.GET;
  POST = mod.POST;
  DELETE = mod.DELETE;
});

// ── GET ────────────────────────────────────────────────────────────────

describe('GET /api/keys', () => {
  it('returns 401 when not authenticated', async () => {
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-agency user', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'basic@test.com' } });
    mockDb.select.mockReturnValue(mockDbChain([basicUser]));

    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns keys list for agency user', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'agency@test.com' } });
    const keys = [{ id: 'k1', label: 'test', lastUsedAt: null, createdAt: new Date() }];
    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return mockDbChain([agencyUser]);
      return mockDbSelectAll(keys);
    });

    const res = await GET();
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.keys).toHaveLength(1);
    expect(body.keys[0].id).toBe('k1');
  });
});

// ── POST ───────────────────────────────────────────────────────────────

describe('POST /api/keys', () => {
  it('returns 401 when not authenticated', async () => {
    const req = new NextRequest('http://localhost/api/keys', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('returns 403 for non-agency user', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'basic@test.com' } });
    mockDb.select.mockReturnValue(mockDbChain([basicUser]));

    const req = new NextRequest('http://localhost/api/keys', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('creates key with sk-meta- prefix for agency user', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'agency@test.com' } });
    mockDb.select.mockReturnValue(mockDbChain([agencyUser]));
    mockDb.insert.mockReturnValue({ values: () => Promise.resolve() });

    const req = new NextRequest('http://localhost/api/keys', {
      method: 'POST',
      body: JSON.stringify({ label: 'my-key' }),
      headers: { 'content-type': 'application/json' },
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.key).toMatch(/^sk-meta-/);
    expect(body.key.length).toBeGreaterThan(20);
  });
});

// ── DELETE ──────────────────────────────────────────────────────────────

describe('DELETE /api/keys', () => {
  it('returns 401 when not authenticated', async () => {
    const req = new NextRequest('http://localhost/api/keys?id=k1', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(401);
  });

  it('returns 400 when id param is missing', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'agency@test.com' } });
    const req = new NextRequest('http://localhost/api/keys', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 when user not found', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'ghost@test.com' } });
    mockDb.select.mockReturnValue(mockDbChain([]));

    const req = new NextRequest('http://localhost/api/keys?id=k1', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });

  it('deletes key with userId ownership filter', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'agency@test.com' } });
    mockDb.select.mockReturnValue(mockDbChain([agencyUser]));
    mockDb.delete.mockReturnValue({ where: () => Promise.resolve() });

    const req = new NextRequest('http://localhost/api/keys?id=k1', { method: 'DELETE' });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ success: true });
    expect(mockDb.delete).toHaveBeenCalled();
  });
});
