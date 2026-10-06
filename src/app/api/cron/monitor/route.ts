import { timingSafeEqual } from 'node:crypto';
import { runDailyMonitor } from '@/lib/monitor';

export const maxDuration = 300;

/** Vercel Cron sends `Authorization: Bearer $CRON_SECRET`. */
function authorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const got = Buffer.from(req.headers.get('authorization') ?? '');
  const want = Buffer.from(`Bearer ${secret}`);
  return got.length === want.length && timingSafeEqual(got, want);
}

export async function GET(req: Request) {
  if (!authorized(req)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const summary = await runDailyMonitor();
  console.log('[cron/monitor]', summary);
  return Response.json(summary);
}
