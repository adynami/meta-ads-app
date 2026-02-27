import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, adAccounts, conversations, usage, apiKeys } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      image: users.image,
      plan: users.plan,
      trialEndsAt: users.trialEndsAt,
      bonusCalls: users.bonusCalls,
      createdAt: users.createdAt,
    })
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  return NextResponse.json({ user });
}

export async function DELETE() {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!dbUser[0]) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const userId = dbUser[0].id;

  // Delete in order respecting foreign keys
  await db.delete(apiKeys).where(eq(apiKeys.userId, userId));
  await db.delete(usage).where(eq(usage.userId, userId));
  await db.delete(conversations).where(eq(conversations.userId, userId));
  await db.delete(adAccounts).where(eq(adAccounts.userId, userId));
  await db.delete(users).where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}
