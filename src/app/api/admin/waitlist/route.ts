import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, waitlist } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);
  if (!user?.isAdmin) return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 });
  }

  const entries = await db
    .select({
      id: waitlist.id,
      email: waitlist.email,
      source: waitlist.source,
      createdAt: waitlist.createdAt,
    })
    .from(waitlist)
    .orderBy(desc(waitlist.createdAt));

  return Response.json({ entries, count: entries.length });
}
