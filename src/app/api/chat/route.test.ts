import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ──────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
vi.mock('@/lib/auth', () => ({ auth: () => mockAuth() }));

const mockDb = {
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
};
function mockDbChain(rows: any[]) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  };
}
vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/db/schema', () => ({
  users: { id: 'id', email: 'email', plan: 'plan' },
  adAccounts: { id: 'id', userId: 'user_id', isActive: 'is_active' },
  conversations: { id: 'id', userId: 'user_id', context: 'context' },
  usage: { userId: 'user_id', month: 'month', apiCalls: 'api_calls' },
}));

vi.mock('@/lib/crypto', () => ({
  decrypt: vi.fn((v: string) => {
    if (v === 'bad') throw new Error('decrypt failed');
    return 'decrypted_token';
  }),
}));

vi.mock('@/lib/plans', () => ({
  isTrialExpired: vi.fn(() => false),
  PLAN_LIMITS: {
    trial: { adAccounts: 1, hasMcp: false, monthlyCredits: 25 },
    basic: { adAccounts: 1, hasMcp: false, monthlyCredits: 75 },
    pro: { adAccounts: 5, hasMcp: false, monthlyCredits: 250 },
    agency: { adAccounts: Infinity, hasMcp: true, monthlyCredits: 650 },
  },
}));

const mockRunChat = vi.fn().mockResolvedValue(Response.json({ ok: true }));
const mockValidateMessages = vi.fn().mockReturnValue(null);
const mockInjectAttachmentBlocks = vi.fn((msgs: any) => msgs);
vi.mock('@/lib/chat', () => ({
  runChat: (...args: any[]) => mockRunChat(...args),
  validateMessages: (msgs: any) => mockValidateMessages(msgs),
  injectAttachmentBlocks: (msgs: any, store: any) => mockInjectAttachmentBlocks(msgs, store),
}));

vi.mock('@/lib/meta-auth', () => ({ META_API_VERSION: 'v25.0' }));

const mockUser = {
  id: 'u1',
  email: 'test@test.com',
  plan: 'basic',
  trialEndsAt: new Date(Date.now() + 86400000),
  bonusCalls: 0,
};

function makeReq(body: any = {}) {
  return new NextRequest('http://localhost/api/chat', {
    method: 'POST',
    body: JSON.stringify({
      messages: [{ role: 'user', content: 'hello' }],
      ...body,
    }),
    headers: { 'content-type': 'application/json' },
  });
}

let POST: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.clearAllMocks();
  delete process.env.META_ACCESS_TOKEN;
  delete process.env.META_AD_ACCOUNT_ID;
  mockAuth.mockResolvedValue(null);

  const mod = await import('./route');
  POST = mod.POST;
});

describe('POST /api/chat', () => {
  it('returns 401 when no session and no env vars', async () => {
    const res = await POST(makeReq());
    expect(res.status).toBe(401);
  });

  it('returns 404 when user not found in DB', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } });
    mockDb.select.mockReturnValue(mockDbChain([]));

    const res = await POST(makeReq());
    expect(res.status).toBe(404);
  });

  it('returns 403 when trial expired', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } });
    mockDb.select.mockReturnValue(mockDbChain([mockUser]));
    const { isTrialExpired } = await import('@/lib/plans');
    vi.mocked(isTrialExpired).mockReturnValueOnce(true);

    const res = await POST(makeReq());
    expect(res.status).toBe(403);
    const body = await res.json();
    expect(body.code).toBe('TRIAL_EXPIRED');
  });

  it('returns 429 when rate limited (calls >= limit, no bonus)', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } });
    // First select: user, second select: usage
    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return mockDbChain([mockUser]);
      return mockDbChain([{ apiCalls: 75 }]); // at limit for basic plan
    });

    const res = await POST(makeReq());
    expect(res.status).toBe(429);
    const body = await res.json();
    expect(body.code).toBe('RATE_LIMITED');
  });

  it('returns 400 when messages are invalid', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } });
    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return mockDbChain([mockUser]);
      return mockDbChain([{ apiCalls: 0 }]);
    });
    mockValidateMessages.mockReturnValueOnce('Messages must be an array');

    const res = await POST(makeReq());
    expect(res.status).toBe(400);
  });

  it('returns 400 when no ad accounts found', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } });
    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return mockDbChain([mockUser]);
      if (callCount === 2) return mockDbChain([{ apiCalls: 0 }]);
      return mockDbChain([]); // no ad accounts
    });

    const res = await POST(makeReq());
    expect(res.status).toBe(400);
  });

  it('calls runChat with TenantContext on success', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } });
    const account = {
      id: 'acc1',
      userId: 'u1',
      metaAdAccountId: 'act_123',
      accessTokenEnc: 'encrypted',
      isActive: true,
    };
    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return mockDbChain([mockUser]);
      if (callCount === 2) return mockDbChain([{ apiCalls: 0 }]);
      return mockDbChain([account]);
    });

    const res = await POST(makeReq());
    expect(res.status).toBe(200);
    expect(mockRunChat).toHaveBeenCalled();
    const ctx = mockRunChat.mock.calls[0][0];
    expect(ctx.accessToken).toBe('decrypted_token');
    expect(ctx.adAccountId).toBe('act_123');
  });

  it('returns 400 when decrypt fails', async () => {
    mockAuth.mockResolvedValue({ user: { email: 'test@test.com' } });
    const account = {
      id: 'acc1',
      userId: 'u1',
      metaAdAccountId: 'act_123',
      accessTokenEnc: 'bad',
      isActive: true,
    };
    let callCount = 0;
    mockDb.select.mockImplementation(() => {
      callCount++;
      if (callCount === 1) return mockDbChain([mockUser]);
      if (callCount === 2) return mockDbChain([{ apiCalls: 0 }]);
      return mockDbChain([account]);
    });

    const res = await POST(makeReq());
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.code).toBe('TOKEN_DECRYPT_FAILED');
  });
});
