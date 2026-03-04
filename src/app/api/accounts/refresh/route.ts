import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, adAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { refreshAccountTokenIfNeeded } from '@/lib/meta-auth';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const { accountId } = (await req.json()) as { accountId?: string };
  if (!accountId) {
    return Response.json({ error: 'Missing accountId' }, { status: 400 });
  }

  // Ownership check
  const [account] = await db
    .select({ id: adAccounts.id })
    .from(adAccounts)
    .where(and(eq(adAccounts.id, accountId), eq(adAccounts.userId, user.id)))
    .limit(1);

  if (!account) {
    return Response.json({ error: 'Account not found' }, { status: 404 });
  }

  const success = await refreshAccountTokenIfNeeded(accountId, 60);
  return Response.json({ success });
}
