import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { usage, users } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const dbUser = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);

  if (!dbUser[0]) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const monthUsage = await db
    .select()
    .from(usage)
    .where(
      and(
        eq(usage.userId, dbUser[0].id),
        eq(usage.month, month)
      )
    )
    .limit(1);

  const stats = monthUsage[0] || {
    apiCalls: 0,
    inputTokens: 0,
    outputTokens: 0,
    estimatedCostCents: 0,
  };

  return Response.json({
    month,
    apiCalls: stats.apiCalls,
    inputTokens: stats.inputTokens,
    outputTokens: stats.outputTokens,
    estimatedCostCents: stats.estimatedCostCents,
  });
}
