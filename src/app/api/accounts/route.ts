import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, adAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { encrypt } from '@/lib/crypto';
import { exchangeForLongLivedToken, fetchAdAccounts } from '@/lib/meta-auth';
import { canAddAccount, type Plan } from '@/lib/plans';

/**
 * GET /api/accounts — list user's connected ad accounts
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const accounts = await db
    .select({
      id: adAccounts.id,
      metaAdAccountId: adAccounts.metaAdAccountId,
      metaAccountName: adAccounts.metaAccountName,
      isActive: adAccounts.isActive,
      tokenExpiresAt: adAccounts.tokenExpiresAt,
      createdAt: adAccounts.createdAt,
    })
    .from(adAccounts)
    .where(and(
      eq(adAccounts.userId, user.id),
      eq(adAccounts.isActive, true),
    ));

  return Response.json({ accounts });
}

/**
 * DELETE /api/accounts?id=<uuid> — disconnect an ad account
 */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const accountId = req.nextUrl.searchParams.get('id');
  if (!accountId) {
    return Response.json({ error: 'id is required' }, { status: 400 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  // Soft delete — mark as inactive
  await db
    .update(adAccounts)
    .set({ isActive: false })
    .where(and(
      eq(adAccounts.id, accountId),
      eq(adAccounts.userId, user.id),
    ));

  return Response.json({ success: true });
}

/**
 * POST /api/accounts — connect a Meta ad account
 * Body: { shortLivedToken: string, adAccountId: string }
 *
 * Flow:
 *  1. Exchange short-lived token for long-lived token (~60 days)
 *  2. Fetch the user's ad accounts from Meta to validate the selected one
 *  3. Encrypt the long-lived token and store in adAccounts
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const body = await req.json();
  const { shortLivedToken, adAccountId } = body as {
    shortLivedToken: string;
    adAccountId: string;
  };

  if (!shortLivedToken || !adAccountId) {
    return Response.json(
      { error: 'shortLivedToken and adAccountId are required' },
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

  // Exchange for long-lived token
  const { access_token: longLivedToken, expires_in } =
    await exchangeForLongLivedToken(shortLivedToken);

  // Fetch ad accounts to validate the selected one and get its name
  const metaAccounts = await fetchAdAccounts(longLivedToken);
  const selectedAccount = metaAccounts.find((a) => a.id === adAccountId);

  if (!selectedAccount) {
    return Response.json(
      { error: `Ad account ${adAccountId} not found or not accessible with this token` },
      { status: 400 },
    );
  }

  // Check if this ad account is already connected (and reactivate if so)
  const [existing] = await db
    .select()
    .from(adAccounts)
    .where(
      and(
        eq(adAccounts.userId, user.id),
        eq(adAccounts.metaAdAccountId, adAccountId),
      ),
    )
    .limit(1);

  const tokenExpiresAt = expires_in
    ? new Date(Date.now() + expires_in * 1000)
    : null;

  if (existing) {
    // Update existing record — refresh token and reactivate
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
      metaAdAccountId: adAccountId,
      metaAccountName: selectedAccount.name,
      accessTokenEnc: encrypt(longLivedToken),
      tokenExpiresAt,
    })
    .returning({ id: adAccounts.id });

  return Response.json({ accountId: newAccount.id }, { status: 201 });
}
