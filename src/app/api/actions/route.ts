import { NextRequest } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { agentActions } from '@/lib/db/schema';
import { getUserByEmail } from '@/lib/tenants';
import { toView } from '@/lib/agent/actions';

/** GET ?conversationId=…&status=… — the user's action log (most recent first). */
export async function GET(req: NextRequest) {
  const session = await auth();
  const user = session?.user?.email ? await getUserByEmail(session.user.email) : null;
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const conversationId = searchParams.get('conversationId');
  const status = searchParams.get('status');

  const rows = await db
    .select()
    .from(agentActions)
    .where(
      and(
        eq(agentActions.userId, user.id),
        ...(conversationId ? [eq(agentActions.conversationId, conversationId)] : []),
        ...(status ? [eq(agentActions.status, status)] : []),
      ),
    )
    .orderBy(desc(agentActions.createdAt))
    .limit(100);

  return Response.json({ actions: rows.map(toView) });
}
