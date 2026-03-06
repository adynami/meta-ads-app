import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

// ── Mocks ──────────────────────────────────────────────────────────────

const mockDb = {
  select: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  delete: vi.fn(),
};
function mockDbChain(rows: any[]) {
  return {
    from: () => ({ where: () => ({ limit: () => Promise.resolve(rows) }) }),
  };
}
function mockDbChainNoLimit(rows: any[]) {
  return {
    from: () => ({ where: () => Promise.resolve(rows) }),
  };
}
function mockUpdateChain() {
  return { set: () => ({ where: () => Promise.resolve() }) };
}
function mockInsertChain() {
  return { values: () => ({ onConflictDoNothing: () => Promise.resolve() }) };
}

vi.mock('@/lib/db', () => ({ db: mockDb }));
vi.mock('@/lib/db/schema', () => ({
  users: { id: 'id', email: 'email' },
  webhookEvents: { id: 'id' },
}));

const mockConstructEvent = vi.fn();
const mockPaymentIntentsRetrieve = vi.fn();
const mockSubscriptionsRetrieve = vi.fn();

vi.mock('@/lib/stripe', () => ({
  getStripe: () => ({
    webhooks: { constructEvent: mockConstructEvent },
    paymentIntents: { retrieve: mockPaymentIntentsRetrieve },
    subscriptions: { retrieve: mockSubscriptionsRetrieve },
  }),
}));

vi.mock('@/lib/rate-limit', () => ({
  rateLimit: () => ({ allowed: true, remaining: 29 }),
}));

function makeReq(body: string, headers: Record<string, string> = {}) {
  return new NextRequest('http://localhost/api/billing/webhook', {
    method: 'POST',
    body,
    headers: { 'x-forwarded-for': '1.2.3.4', ...headers },
  });
}

let POST: (req: NextRequest) => Promise<Response>;

beforeEach(async () => {
  vi.clearAllMocks();
  mockDb.select.mockReturnValue(mockDbChain([]));
  mockDb.update.mockReturnValue(mockUpdateChain());
  mockDb.insert.mockReturnValue(mockInsertChain());
  process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test';

  // Re-import to pick up fresh mocks
  const mod = await import('./route');
  POST = mod.POST;
});

describe('POST /api/billing/webhook', () => {
  it('returns 400 when stripe-signature header is missing', async () => {
    const res = await POST(makeReq('{}'));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Missing stripe-signature' });
  });

  it('returns 500 when STRIPE_WEBHOOK_SECRET is not set', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;
    const res = await POST(makeReq('{}', { 'stripe-signature': 'sig' }));
    expect(res.status).toBe(500);
  });

  it('returns 400 when signature verification fails', async () => {
    mockConstructEvent.mockImplementation(() => {
      throw new Error('Invalid sig');
    });
    const res = await POST(makeReq('{}', { 'stripe-signature': 'bad' }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: 'Invalid signature' });
  });

  it('returns 200 for duplicate event (idempotency)', async () => {
    mockConstructEvent.mockReturnValue({ id: 'evt_dup', type: 'unknown' });
    mockDb.select.mockReturnValue(mockDbChain([{ id: 'evt_dup' }]));

    const res = await POST(makeReq('{}', { 'stripe-signature': 'sig' }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ received: true });
    // Should not call insert (event already processed)
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it('handles checkout.session.completed credit pack with valid credits', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_1',
      type: 'checkout.session.completed',
      data: { object: { mode: 'payment', payment_intent: 'pi_1' } },
    });
    mockDb.select.mockReturnValue(mockDbChain([])); // no existing event
    mockPaymentIntentsRetrieve.mockResolvedValue({
      metadata: { type: 'credit_pack', userId: 'u1', credits: '12' },
    });

    const res = await POST(makeReq('{}', { 'stripe-signature': 'sig' }));
    expect(res.status).toBe(200);
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalled();
  });

  it('skips credit pack with invalid credits value', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_2',
      type: 'checkout.session.completed',
      data: { object: { mode: 'payment', payment_intent: 'pi_1' } },
    });
    mockDb.select.mockReturnValue(mockDbChain([]));
    mockPaymentIntentsRetrieve.mockResolvedValue({
      metadata: { type: 'credit_pack', userId: 'u1', credits: 'abc' },
    });

    const res = await POST(makeReq('{}', { 'stripe-signature': 'sig' }));
    expect(res.status).toBe(200);
    // update should not be called for invalid credits — only insert for idempotency
    expect(mockDb.update).not.toHaveBeenCalled();
  });

  it('handles checkout.session.completed subscription path', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_3',
      type: 'checkout.session.completed',
      data: { object: { mode: 'subscription', subscription: 'sub_1', customer: 'cus_1' } },
    });
    mockDb.select.mockReturnValue(mockDbChain([]));
    mockSubscriptionsRetrieve.mockResolvedValue({
      metadata: { userId: 'u1', plan: 'pro' },
    });

    const res = await POST(makeReq('{}', { 'stripe-signature': 'sig' }));
    expect(res.status).toBe(200);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('handles customer.subscription.updated', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_4',
      type: 'customer.subscription.updated',
      data: { object: { metadata: { userId: 'u1', plan: 'agency' } } },
    });
    mockDb.select.mockReturnValue(mockDbChain([]));

    const res = await POST(makeReq('{}', { 'stripe-signature': 'sig' }));
    expect(res.status).toBe(200);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('handles customer.subscription.deleted — downgrades to trial', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_5',
      type: 'customer.subscription.deleted',
      data: { object: { metadata: { userId: 'u1' } } },
    });
    mockDb.select.mockReturnValue(mockDbChain([]));

    const res = await POST(makeReq('{}', { 'stripe-signature': 'sig' }));
    expect(res.status).toBe(200);
    expect(mockDb.update).toHaveBeenCalled();
  });

  it('returns 200 for unhandled event type without DB writes', async () => {
    mockConstructEvent.mockReturnValue({
      id: 'evt_6',
      type: 'invoice.paid',
      data: { object: {} },
    });
    mockDb.select.mockReturnValue(mockDbChain([]));

    const res = await POST(makeReq('{}', { 'stripe-signature': 'sig' }));
    expect(res.status).toBe(200);
    // update not called for unhandled events
    expect(mockDb.update).not.toHaveBeenCalled();
    // but insert is called for idempotency tracking
    expect(mockDb.insert).toHaveBeenCalled();
  });
});
