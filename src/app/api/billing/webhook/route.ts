import { NextRequest } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

/**
 * POST /api/billing/webhook
 * Handles Stripe webhook events for subscription lifecycle.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  if (!sig) {
    return Response.json({ error: 'Missing stripe-signature' }, { status: 400 });
  }

  const stripe = getStripe();
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      const userId = session.subscription
        ? (await stripe.subscriptions.retrieve(session.subscription as string))
            .metadata?.userId
        : null;

      if (userId) {
        const plan = (
          await stripe.subscriptions.retrieve(session.subscription as string)
        ).metadata?.plan;

        await db
          .update(users)
          .set({
            plan: plan ?? 'basic',
            stripeCustomerId: session.customer as string,
          })
          .where(eq(users.id, userId));
      }
      break;
    }

    case 'customer.subscription.updated': {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;
      const plan = subscription.metadata?.plan;

      if (userId && plan) {
        await db
          .update(users)
          .set({ plan })
          .where(eq(users.id, userId));
      }
      break;
    }

    case 'customer.subscription.deleted': {
      const subscription = event.data.object;
      const userId = subscription.metadata?.userId;

      if (userId) {
        await db
          .update(users)
          .set({ plan: 'trial' }) // Downgrade to trial (expired)
          .where(eq(users.id, userId));
      }
      break;
    }

    default:
      // Unhandled event type
      break;
  }

  return Response.json({ received: true });
}
