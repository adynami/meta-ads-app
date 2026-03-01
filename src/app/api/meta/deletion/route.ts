import { db } from '@/lib/db';
import { users, adAccounts, conversations, usage, apiKeys } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextRequest } from 'next/server';
import { createHmac } from 'crypto';

/**
 * Meta Data Deletion Request Callback
 *
 * When a user removes the app from their Meta account settings,
 * Meta sends a signed POST request to this endpoint.
 * We must verify the signature, delete the user's data, and return
 * a confirmation code and status URL.
 *
 * See: https://developers.facebook.com/docs/development/create-an-app/app-dashboard/data-deletion-callback
 */

function parseSignedRequest(signedRequest: string, secret: string): { user_id: string } | null {
  const [encodedSig, payload] = signedRequest.split('.');
  if (!encodedSig || !payload) return null;

  // Decode the signature
  const sig = Buffer.from(encodedSig.replace(/-/g, '+').replace(/_/g, '/'), 'base64');

  // Compute expected signature
  const expectedSig = createHmac('sha256', secret).update(payload).digest();

  // Compare signatures using timing-safe comparison
  if (sig.length !== expectedSig.length) return null;
  let match = true;
  for (let i = 0; i < sig.length; i++) {
    if (sig[i] !== expectedSig[i]) match = false;
  }
  if (!match) return null;

  // Decode payload
  const decoded = Buffer.from(payload.replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
  return JSON.parse(decoded);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const signedRequest = formData.get('signed_request') as string;

    if (!signedRequest) {
      return Response.json({ error: 'Missing signed_request' }, { status: 400 });
    }

    const appSecret = process.env.META_APP_SECRET;
    if (!appSecret) {
      return Response.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const data = parseSignedRequest(signedRequest, appSecret);
    if (!data) {
      return Response.json({ error: 'Invalid signed request' }, { status: 403 });
    }

    const metaUserId = data.user_id;

    // Find the user by their Meta-provided image URL or by matching ad accounts
    // Meta user ID is stored as part of the user's profile image URL from OAuth
    // We look up via the user's connected ad accounts or profile
    const allUsers = await db.select().from(users);
    let targetUserId: string | null = null;

    // Try to find the user — Meta user ID may be embedded in the profile image URL
    for (const user of allUsers) {
      if (user.image && user.image.includes(metaUserId)) {
        targetUserId = user.id;
        break;
      }
    }

    // If found, delete all their data
    if (targetUserId) {
      await db.delete(apiKeys).where(eq(apiKeys.userId, targetUserId));
      await db.delete(usage).where(eq(usage.userId, targetUserId));
      await db.delete(conversations).where(eq(conversations.userId, targetUserId));
      await db.delete(adAccounts).where(eq(adAccounts.userId, targetUserId));
      await db.delete(users).where(eq(users.id, targetUserId));
    }

    // Generate a confirmation code
    const confirmationCode = `adynami_del_${metaUserId}_${Date.now()}`;

    // Meta expects a JSON response with a status URL and confirmation code
    const appUrl = process.env.AUTH_URL || 'https://adynami.ai';
    return Response.json({
      url: `${appUrl}/deletion-status?code=${confirmationCode}`,
      confirmation_code: confirmationCode,
    });
  } catch {
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
