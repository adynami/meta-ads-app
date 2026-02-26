import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, adAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { encrypt } from '@/lib/crypto';
import { exchangeForLongLivedToken, fetchAdAccounts } from '@/lib/meta-auth';
import { canAddAccount, type Plan } from '@/lib/plans';

/**
 * GET /api/meta/ad-accounts
 * Fetch ad accounts directly from the Meta Graph API using the
 * short-lived token stored in the session JWT.
 */
export async function GET() {
  const session = await auth();
  if (!session?.accessToken) {
    return Response.json(
      { error: 'No access token. Please sign in again.' },
      { status: 401 },
    );
  }

  try {
    const { access_token: longLivedToken } =
      await exchangeForLongLivedToken(session.accessToken);

    const accounts = await fetchAdAccounts(longLivedToken);

    return Response.json({
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        account_status: a.account_status,
        currency: a.currency,
      })),
    });
  } catch (error: any) {
    console.error('[meta/ad-accounts] GET error:', error);
    if (error.message?.includes('expired') || error.message?.includes('Invalid')) {
      return Response.json(
        { error: 'Token expired. Please sign in again.' },
        { status: 401 },
      );
    }
    return Response.json(
      { error: error.message ?? 'Failed to fetch ad accounts' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/meta/ad-accounts
 * Body: { selectedAccountId: string }
 *
 * Exchange for long-lived token, validate the selected account,
 * check plan limits, and store the encrypted token + account.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.accessToken || !session.user?.email) {
    return Response.json(
      { error: 'No access token. Please sign in again.' },
      { status: 401 },
    );
  }

  const body = await req.json();
  const { selectedAccountId } = body as { selectedAccountId: string };

  if (!selectedAccountId) {
    return Response.json(
      { error: 'selectedAccountId is required' },
      { status: 400 },
    );
  }

  // Get user from DB
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    // Exchange for long-lived token
    const { access_token: longLivedToken, expires_in } =
      await exchangeForLongLivedToken(session.accessToken);

    // Fetch ad accounts to validate the selected one
    const metaAccounts = await fetchAdAccounts(longLivedToken);
    const selectedAccount = metaAccounts.find((a) => a.id === selectedAccountId);

    if (!selectedAccount) {
      return Response.json(
        { error: `Ad account ${selectedAccountId} not found or not accessible with this token` },
        { status: 400 },
      );
    }

    // Check plan limits
    const existingAccounts = await db
      .select()
      .from(adAccounts)
      .where(and(eq(adAccounts.userId, user.id), eq(adAccounts.isActive, true)));

    if (!canAddAccount(user.plan as Plan, existingAccounts.length)) {
      return Response.json(
        { error: `Your ${user.plan} plan allows a maximum of ${existingAccounts.length} ad account(s). Upgrade to add more.` },
        { status: 403 },
      );
    }

    const tokenExpiresAt = expires_in
      ? new Date(Date.now() + expires_in * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    // Check if this ad account already exists (reconnect case)
    const [existing] = await db
      .select()
      .from(adAccounts)
      .where(
        and(
          eq(adAccounts.userId, user.id),
          eq(adAccounts.metaAdAccountId, selectedAccountId),
        ),
      )
      .limit(1);

    if (existing) {
      // Reactivate and refresh token
      await db
        .update(adAccounts)
        .set({
          accessTokenEnc: encrypt(longLivedToken),
          tokenExpiresAt,
          metaAccountName: selectedAccount.name,
          isActive: true,
        })
        .where(eq(adAccounts.id, existing.id));

      return Response.json({ accountId: existing.id, reconnected: true });
    }

    // Insert new ad account
    const [newAccount] = await db
      .insert(adAccounts)
      .values({
        userId: user.id,
        metaAdAccountId: selectedAccountId,
        metaAccountName: selectedAccount.name,
        accessTokenEnc: encrypt(longLivedToken),
        tokenExpiresAt,
        isActive: true,
      })
      .returning({ id: adAccounts.id });

    return Response.json({ accountId: newAccount.id }, { status: 201 });
  } catch (error: any) {
    console.error('[meta/ad-accounts] POST error:', error);
    if (error.message?.includes('expired') || error.message?.includes('Invalid')) {
      return Response.json(
        { error: 'Token expired. Please sign in again.' },
        { status: 401 },
      );
    }
    return Response.json(
      { error: error.message ?? 'Failed to store ad account' },
      { status: 500 },
    );
  }
}
