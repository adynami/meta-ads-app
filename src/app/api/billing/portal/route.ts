import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { getStripe } from '@/lib/stripe';

/**
 * POST /api/billing/portal
 * Returns: { url: string } — Stripe Customer Portal URL
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user?.stripeCustomerId) {
    return Response.json(
      { error: 'No billing account found. Subscribe to a plan first.' },
      { status: 400 },
    );
  }

  const stripe = getStripe();
  const portalSession = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${process.env.AUTH_URL}/settings`,
  });

  return Response.json({ url: portalSession.url });
}
