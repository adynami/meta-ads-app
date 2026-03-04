import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import {
  exchangeForLongLivedToken,
  fetchAdAccounts,
  connectAdAccount,
  AdAccountLimitError,
} from '@/lib/meta-auth';

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

  const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  try {
    const longLived = await exchangeForLongLivedToken(access_token);
    const accounts = await fetchAdAccounts(longLived.access_token);

    if (accounts.length === 0) {
      return Response.json(
        {
          error:
            'No ad accounts found. Make sure your Meta account has access to at least one ad account.',
        },
        { status: 400 },
      );
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

    const selected = accounts.find((a) => a.id === selected_account_id);
    if (!selected) {
      return Response.json({ error: 'Selected ad account not found' }, { status: 400 });
    }

    const result = await connectAdAccount({
      userId: user.id,
      plan: user.plan,
      metaAdAccountId: selected.id,
      longLivedToken: longLived.access_token,
      expiresIn: longLived.expires_in,
      accountName: selected.name,
    });

    return Response.json({
      success: true,
      account: {
        id: result.accountId,
        metaAdAccountId: selected.id,
        metaAccountName: selected.name,
      },
    });
  } catch (error: any) {
    if (error instanceof AdAccountLimitError) {
      return Response.json({ error: error.message }, { status: 403 });
    }
    console.error('[meta/connect] Error:', error);
    return Response.json(
      { error: error.message ?? 'Failed to connect Meta account' },
      { status: 500 },
    );
  }
}
