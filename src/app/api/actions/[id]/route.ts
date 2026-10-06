import { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { getUserByEmail } from '@/lib/tenants';
import {
  ActionError,
  approveAction,
  rejectAction,
  rollbackAction,
  toView,
} from '@/lib/agent/actions';

export const maxDuration = 120;

/** POST { decision: 'approve' | 'reject' | 'undo' } */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const user = session?.user?.email ? await getUserByEmail(session.user.email) : null;
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  let decision: unknown;
  try {
    ({ decision } = (await req.json()) as { decision?: unknown });
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const row =
      decision === 'approve'
        ? await approveAction(id, user.id)
        : decision === 'reject'
          ? await rejectAction(id, user.id)
          : decision === 'undo'
            ? await rollbackAction(id, user.id)
            : null;
    if (!row)
      return Response.json({ error: 'decision must be approve, reject or undo' }, { status: 400 });
    return Response.json({ action: toView(row) });
  } catch (err) {
    if (err instanceof ActionError) {
      return Response.json({ error: err.message }, { status: err.status });
    }
    console.error('[actions] error:', err);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
