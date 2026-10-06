import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  getStripe,
  PRICE_IDS,
  ANNUAL_PRICE_IDS,
  CREDIT_PACK_PRICE_IDS,
  type PricePlan,
  type CreditPack,
} from '@/lib/stripe';
import { rateLimit } from '@/lib/rate-limit';

/**
 * POST /api/billing/checkout
 * Body: { plan: 'basic' | 'pro' | 'agency' }
 *   OR  { type: 'credit_pack', pack: '12' | '45' | '120' }
 * Returns: { url: string } — Stripe Checkout session URL
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { allowed } = await rateLimit(`checkout:${session.user.email}`, {
    windowMs: 60_000,
    maxRequests: 5,
  });
  if (!allowed) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }

  const body = await req.json();

  const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const stripe = getStripe();

  // Create or retrieve Stripe customer
  let customerId = user.stripeCustomerId;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    });
    customerId = customer.id;

    await db.update(users).set({ stripeCustomerId: customerId }).where(eq(users.id, user.id));
  }

  // Credit pack (one-time payment)
  if (body.type === 'credit_pack') {
    const pack = body.pack as CreditPack;
    if (!pack || !(pack in CREDIT_PACK_PRICE_IDS)) {
      return Response.json({ error: 'Invalid credit pack' }, { status: 400 });
    }

    const credits = parseInt(pack, 10);
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'payment',
      line_items: [{ price: CREDIT_PACK_PRICE_IDS[pack], quantity: 1 }],
      success_url: `${process.env.AUTH_URL}/billing?credits=success`,
      cancel_url: `${process.env.AUTH_URL}/billing`,
      payment_intent_data: {
        metadata: { userId: user.id, type: 'credit_pack', credits: String(credits) },
      },
    });

    return Response.json({ url: checkoutSession.url });
  }

  // Subscription checkout
  const { plan, period } = body as { plan: PricePlan; period?: 'monthly' | 'annual' };
  if (!plan || !(plan in PRICE_IDS)) {
    return Response.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const priceId =
    period === 'annual' && ANNUAL_PRICE_IDS[plan] ? ANNUAL_PRICE_IDS[plan] : PRICE_IDS[plan];

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.AUTH_URL}/chat?subscribed=true`,
    cancel_url: `${process.env.AUTH_URL}/billing`,
    subscription_data: {
      metadata: { userId: user.id, plan },
    },
  });

  return Response.json({ url: checkoutSession.url });
}
