import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { conversations, users } from '@/lib/db/schema';
import { eq, desc, and, isNull } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
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
  const { searchParams } = new URL(req.url);
  const accountId = searchParams.get('accountId');
  const id = searchParams.get('id');

  // Single conversation by ID (with messages)
  if (id) {
    const [conv] = await db
      .select()
      .from(conversations)
      .where(and(eq(conversations.id, id), eq(conversations.userId, userId)))
      .limit(1);

    if (!conv) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    return NextResponse.json({ conversation: conv });
  }

  // Filter by account — return most recent with messages
  if (accountId) {
    const accountFilter = accountId === 'all'
      ? and(eq(conversations.userId, userId), isNull(conversations.adAccountId))
      : and(eq(conversations.userId, userId), eq(conversations.adAccountId, accountId));

    const userConversations = await db
      .select()
      .from(conversations)
      .where(accountFilter)
      .orderBy(desc(conversations.updatedAt))
      .limit(1);

    return NextResponse.json({ conversations: userConversations });
  }

  // Default: list all conversations (without messages for sidebar listing)
  const userConversations = await db
    .select({
      id: conversations.id,
      title: conversations.title,
      adAccountId: conversations.adAccountId,
      createdAt: conversations.createdAt,
      updatedAt: conversations.updatedAt,
    })
    .from(conversations)
    .where(eq(conversations.userId, userId))
    .orderBy(desc(conversations.updatedAt))
    .limit(50);

  return NextResponse.json({ conversations: userConversations });
}
