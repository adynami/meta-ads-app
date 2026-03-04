import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { exchangeForLongLivedToken, fetchAdAccounts, connectAdAccount, AdAccountLimitError } from '@/lib/meta-auth';

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

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const { access_token: longLivedToken, expires_in } =
      await exchangeForLongLivedToken(session.accessToken);

    const metaAccounts = await fetchAdAccounts(longLivedToken);
    const selectedAccount = metaAccounts.find((a) => a.id === selectedAccountId);

    if (!selectedAccount) {
      return Response.json(
        { error: `Ad account ${selectedAccountId} not found or not accessible with this token` },
        { status: 400 },
      );
    }

    const result = await connectAdAccount({
      userId: user.id,
      plan: user.plan,
      metaAdAccountId: selectedAccountId,
      longLivedToken,
      expiresIn: expires_in,
      accountName: selectedAccount.name,
    });

    return Response.json(result, { status: result.reconnected ? 200 : 201 });
  } catch (error: any) {
    if (error instanceof AdAccountLimitError) {
      return Response.json({ error: error.message }, { status: 403 });
    }
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
