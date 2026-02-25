import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, adAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { encrypt } from '@/lib/crypto';
import { exchangeForLongLivedToken, fetchAdAccounts } from '@/lib/meta-auth';
import { canAddAccount, type Plan } from '@/lib/plans';

/**
 * POST /api/auth/meta/connect
 * Body: { access_token: string, selected_account_id?: string }
 *
 * Takes a short-lived token from the Meta OAuth flow,
 * exchanges it for a long-lived token, discovers ad accounts,
 * and stores the selected account.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { access_token, selected_account_id } = await req.json();
  if (!access_token) {
    return Response.json({ error: 'access_token is required' }, { status: 400 });
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
    const longLived = await exchangeForLongLivedToken(access_token);

    // Fetch available ad accounts
    const accounts = await fetchAdAccounts(longLived.access_token);

    if (accounts.length === 0) {
      return Response.json({
        error: 'No ad accounts found. Make sure your Meta account has access to at least one ad account.',
      }, { status: 400 });
    }

    // If no specific account selected, return the list for the user to choose
    if (!selected_account_id) {
      return Response.json({
        accounts: accounts.map((a) => ({
          id: a.id,
          name: a.name,
          status: a.account_status,
          currency: a.currency,
        })),
      });
    }

    // Check plan limits
    const existingAccounts = await db
      .select()
      .from(adAccounts)
      .where(and(
        eq(adAccounts.userId, user.id),
        eq(adAccounts.isActive, true),
      ));

    if (!canAddAccount(user.plan as Plan, existingAccounts.length)) {
      return Response.json({
        error: `Your ${user.plan} plan supports up to ${user.plan === 'basic' || user.plan === 'trial' ? '1' : '5'} ad account(s). Upgrade to add more.`,
      }, { status: 403 });
    }

    // Find the selected account in the list
    const selected = accounts.find((a) => a.id === selected_account_id);
    if (!selected) {
      return Response.json({ error: 'Selected ad account not found' }, { status: 400 });
    }

    // Calculate token expiry (~60 days for long-lived tokens)
    const tokenExpiresAt = longLived.expires_in
      ? new Date(Date.now() + longLived.expires_in * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    // Store encrypted token and account
    const [account] = await db.insert(adAccounts).values({
      userId: user.id,
      metaAdAccountId: selected.id,
      metaAccountName: selected.name,
      accessTokenEnc: encrypt(longLived.access_token),
      tokenExpiresAt,
      scopes: 'ads_management,ads_read,business_management,read_insights',
      isActive: true,
    }).returning();

    return Response.json({
      success: true,
      account: {
        id: account.id,
        metaAdAccountId: account.metaAdAccountId,
        metaAccountName: account.metaAccountName,
      },
    });
  } catch (error: any) {
    console.error('[meta/connect] Error:', error);
    return Response.json(
      { error: error.message ?? 'Failed to connect Meta account' },
      { status: 500 },
    );
  }
}
