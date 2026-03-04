import { NextRequest } from 'next/server';
import { randomBytes, createHash } from 'crypto';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, apiKeys } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

/**
 * GET /api/keys — list user's API keys (Agency only)
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);

  if (!user || user.plan !== 'agency') {
    return Response.json(
      { error: 'API keys are available on the Agency plan only.' },
      { status: 403 },
    );
  }

  const keys = await db
    .select({
      id: apiKeys.id,
      label: apiKeys.label,
      lastUsedAt: apiKeys.lastUsedAt,
      createdAt: apiKeys.createdAt,
    })
    .from(apiKeys)
    .where(eq(apiKeys.userId, user.id));

  return Response.json({ keys });
}

/**
 * POST /api/keys — create a new API key (Agency only)
 * Body: { label?: string }
 * Returns: { key: string } — shown ONCE, not stored in plaintext
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);

  if (!user || user.plan !== 'agency') {
    return Response.json(
      { error: 'API keys are available on the Agency plan only.' },
      { status: 403 },
    );
  }

  const { label } = (await req.json().catch(() => ({}))) as { label?: string };

  // Generate a random API key
  const rawKey = `sk-meta-${randomBytes(32).toString('hex')}`;
  const keyHash = createHash('sha256').update(rawKey).digest('hex');

  await db.insert(apiKeys).values({
    userId: user.id,
    keyHash,
    label: label ?? null,
  });

  return Response.json({
    key: rawKey,
    message: 'Save this key — it will not be shown again.',
  });
}

/**
 * DELETE /api/keys?id=<uuid> — revoke an API key
 */
export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keyId = req.nextUrl.searchParams.get('id');
  if (!keyId) {
    return Response.json({ error: 'id is required' }, { status: 400 });
  }

  const [user] = await db.select().from(users).where(eq(users.email, session.user.email)).limit(1);

  if (!user) {
    return Response.json({ error: 'User not found' }, { status: 404 });
  }

  await db.delete(apiKeys).where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, user.id)));

  return Response.json({ success: true });
}
