import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, adAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

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
