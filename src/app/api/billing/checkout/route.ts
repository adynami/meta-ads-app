import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getStripe, PRICE_IDS, type PricePlan } from '@/lib/stripe';

/**
 * POST /api/billing/checkout
 * Body: { plan: 'basic' | 'pro' | 'agency' }
 * Returns: { url: string } — Stripe Checkout session URL
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { plan } = (await req.json()) as { plan: PricePlan };

  if (!plan || !(plan in PRICE_IDS)) {
    return Response.json({ error: 'Invalid plan' }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

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

    await db
      .update(users)
      .set({ stripeCustomerId: customerId })
      .where(eq(users.id, user.id));
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: PRICE_IDS[plan], quantity: 1 }],
    success_url: `${process.env.AUTH_URL}/chat?subscribed=true`,
    cancel_url: `${process.env.AUTH_URL}/billing`,
    subscription_data: {
      metadata: { userId: user.id, plan },
    },
  });

  return Response.json({ url: checkoutSession.url });
}
