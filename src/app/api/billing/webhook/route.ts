import { NextRequest } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * POST /api/billing/webhook
 * Handles Stripe webhook events for subscription lifecycle and top-up payments.
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

      // Handle one-time top-up payments
      if (session.mode === 'payment') {
        const paymentIntentId = session.payment_intent as string;
        if (paymentIntentId) {
          const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
          const metadata = paymentIntent.metadata;
          if (metadata?.type === 'topup' && metadata.userId && metadata.credits) {
            const credits = parseInt(metadata.credits, 10);
            await db
              .update(users)
              .set({ bonusCalls: sql`bonus_calls + ${credits}` })
              .where(eq(users.id, metadata.userId));
            console.log(`[webhook] Top-up: +${credits} bonus calls for user ${metadata.userId}`);
          }
        }
        break;
      }

      // Handle subscription checkout
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
