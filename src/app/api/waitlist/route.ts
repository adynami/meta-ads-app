import { db } from '@/lib/db';
import { waitlist } from '@/lib/db/schema';

export async function POST(req: Request) {
  try {
    const { email, source } = await req.json();

    if (!email || typeof email !== 'string') {
      return Response.json({ error: 'Email is required' }, { status: 400 });
    }

    const trimmed = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      return Response.json({ error: 'Invalid email address' }, { status: 400 });
    }

    await db
      .insert(waitlist)
      .values({ email: trimmed, source: source ?? 'early-access' })
      .onConflictDoNothing();

    return Response.json({ success: true });
  } catch (error: any) {
    console.error('[waitlist] Error:', error);
    return Response.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
