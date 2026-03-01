import { NextRequest } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { db } from '@/lib/db';
import { users, webhookEvents } from '@/lib/db/schema';
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

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error('[webhook] STRIPE_WEBHOOK_SECRET is not configured');
    return Response.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const stripe = getStripe();
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      webhookSecret,
    );
  } catch (err: any) {
    console.error('[webhook] Signature verification failed:', err.message);
    return Response.json({ error: 'Invalid signature' }, { status: 400 });
  }

  // Idempotency check — skip already-processed events
  const [existing] = await db
    .select({ id: webhookEvents.id })
    .from(webhookEvents)
    .where(eq(webhookEvents.id, event.id))
    .limit(1);

  if (existing) {
    console.log(`[webhook] Skipping already-processed event: ${event.id}`);
    return Response.json({ received: true });
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
            if (isNaN(credits) || credits <= 0) {
              console.error(`[webhook] Invalid credits value in top-up metadata: ${metadata.credits}`);
              break;
            }
            await db
              .update(users)
              .set({ bonusCalls: sql`bonus_calls + ${credits}` })
              .where(eq(users.id, metadata.userId));
            console.log(`[webhook] Top-up: +${credits} bonus calls for user ${metadata.userId}`);
          }
        }
        break;
      }

      // Handle subscription checkout — retrieve once, reuse for userId and plan
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        const userId = subscription.metadata?.userId;

        if (userId) {
          await db
            .update(users)
            .set({
              plan: subscription.metadata?.plan ?? 'basic',
              stripeCustomerId: session.customer as string,
            })
            .where(eq(users.id, userId));
        }
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
      console.log(`[webhook] Unhandled event type: ${event.type}`);
      break;
  }

  // Record event as processed for idempotency
  await db.insert(webhookEvents).values({ id: event.id }).onConflictDoNothing();

  return Response.json({ received: true });
}
