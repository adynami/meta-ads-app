import { NextRequest } from 'next/server';
import { and, desc, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { playbooks } from '@/lib/db/schema';
import { getUserByEmail } from '@/lib/tenants';
import { BUILT_IN_PLAYBOOKS } from '@/lib/playbooks';
import { MAX_USER_MESSAGE_CHARS } from '@/lib/agent/config';

const MAX_PLAYBOOKS = 50;

async function currentUser() {
  const session = await auth();
  return session?.user?.email ? getUserByEmail(session.user.email) : undefined;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const custom = await db
    .select({ id: playbooks.id, name: playbooks.name, prompt: playbooks.prompt })
    .from(playbooks)
    .where(eq(playbooks.userId, user.id))
    .orderBy(desc(playbooks.createdAt));
  return Response.json({
    playbooks: [...BUILT_IN_PLAYBOOKS.map((p) => ({ ...p, builtIn: true })), ...custom],
  });
}

export async function POST(req: NextRequest) {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { name?: unknown; prompt?: unknown };
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  if (!name || name.length > 80) {
    return Response.json({ error: 'name is required (max 80 chars)' }, { status: 400 });
  }
  if (!prompt || prompt.length > MAX_USER_MESSAGE_CHARS) {
    return Response.json({ error: 'prompt is required' }, { status: 400 });
  }

  const existing = await db
    .select({ id: playbooks.id })
    .from(playbooks)
    .where(eq(playbooks.userId, user.id));
  if (existing.length >= MAX_PLAYBOOKS) {
    return Response.json(
      { error: `You can save up to ${MAX_PLAYBOOKS} playbooks` },
      { status: 400 },
    );
  }

  const [row] = await db
    .insert(playbooks)
    .values({ userId: user.id, name, prompt })
    .returning({ id: playbooks.id, name: playbooks.name, prompt: playbooks.prompt });
  return Response.json({ playbook: row });
}

export async function DELETE(req: NextRequest) {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const id = new URL(req.url).searchParams.get('id');
  if (!id) return Response.json({ error: 'Missing id' }, { status: 400 });
  const deleted = await db
    .delete(playbooks)
    .where(and(eq(playbooks.id, id), eq(playbooks.userId, user.id)))
    .returning({ id: playbooks.id });
  if (deleted.length === 0) return Response.json({ error: 'Not found' }, { status: 404 });
  return Response.json({ success: true });
}
