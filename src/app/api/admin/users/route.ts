import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, usage } from '@/lib/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.email) return null;
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, session.user.email))
    .limit(1);
  if (!user?.isAdmin) return null;
  return user;
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const now = new Date();
  const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const allUsers = await db
    .select({
      id: users.id,
      email: users.email,
      name: users.name,
      plan: users.plan,
      bonusCalls: users.bonusCalls,
      isAdmin: users.isAdmin,
      createdAt: users.createdAt,
    })
    .from(users);

  const monthlyUsage = await db
    .select({
      userId: usage.userId,
      apiCalls: usage.apiCalls,
      estimatedCostCents: usage.estimatedCostCents,
    })
    .from(usage)
    .where(eq(usage.month, month));

  const usageMap = new Map(
    monthlyUsage.map((u) => [u.userId, u])
  );

  const merged = allUsers.map((u) => {
    const usg = usageMap.get(u.id);
    return {
      ...u,
      apiCalls: usg?.apiCalls ?? 0,
      estimatedCostCents: usg?.estimatedCostCents ?? 0,
    };
  });

  const totalCostCents = merged.reduce((s, u) => s + u.estimatedCostCents, 0);
  const totalApiCalls = merged.reduce((s, u) => s + u.apiCalls, 0);

  return NextResponse.json({
    users: merged,
    summary: {
      totalUsers: merged.length,
      totalCostCents,
      totalApiCalls,
      month,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { userId, plan, bonusCalls, isAdmin } = body as {
    userId: string;
    plan?: string;
    bonusCalls?: number;
    isAdmin?: boolean;
  };

  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 });
  }

  if (plan && !['trial', 'basic', 'pro', 'agency'].includes(plan)) {
    return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
  }

  if (userId === admin.id && isAdmin === false) {
    return NextResponse.json({ error: 'Cannot remove your own admin access' }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  if (plan !== undefined) updates.plan = plan;
  if (bonusCalls !== undefined) updates.bonusCalls = bonusCalls;
  if (isAdmin !== undefined) updates.isAdmin = isAdmin;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
  }

  await db.update(users).set(updates).where(eq(users.id, userId));

  return NextResponse.json({ success: true });
}
