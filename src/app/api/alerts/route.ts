import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { encrypt } from '@/lib/crypto';
import { getUserByEmail } from '@/lib/tenants';
import { isValidSlackWebhook } from '@/lib/monitor';

async function currentUser() {
  const session = await auth();
  return session?.user?.email ? getUserByEmail(session.user.email) : undefined;
}

export async function GET() {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return Response.json({
    enabled: user.alertsEnabled,
    hasWebhook: Boolean(user.slackWebhookEnc),
    lastRunAt: user.alertsLastRunAt,
  });
}

/** PATCH { enabled?: boolean, slackWebhookUrl?: string | null } */
export async function PATCH(req: NextRequest) {
  const user = await currentUser();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    enabled?: unknown;
    slackWebhookUrl?: unknown;
  };
  const patch: Partial<typeof users.$inferInsert> = {};

  if (body.slackWebhookUrl === null) {
    patch.slackWebhookEnc = null;
    patch.alertsEnabled = false;
  } else if (typeof body.slackWebhookUrl === 'string') {
    if (!isValidSlackWebhook(body.slackWebhookUrl)) {
      return Response.json(
        { error: 'Enter a Slack incoming webhook URL (https://hooks.slack.com/services/…)' },
        { status: 400 },
      );
    }
    patch.slackWebhookEnc = encrypt(body.slackWebhookUrl);
  }
  if (typeof body.enabled === 'boolean') {
    if (body.enabled && !patch.slackWebhookEnc && !user.slackWebhookEnc) {
      return Response.json({ error: 'Add a Slack webhook first' }, { status: 400 });
    }
    patch.alertsEnabled = body.enabled;
  }

  if (Object.keys(patch).length) {
    await db.update(users).set(patch).where(eq(users.id, user.id));
  }
  return Response.json({ success: true });
}
