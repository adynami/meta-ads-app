import { NextRequest } from 'next/server';
import { handlers } from '@/lib/auth';
import { rateLimit } from '@/lib/rate-limit';

export const GET = handlers.GET;

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { allowed } = rateLimit(`auth:${ip}`, { windowMs: 300_000, maxRequests: 15 });
  if (!allowed) {
    return Response.json({ error: 'Too many requests' }, { status: 429 });
  }
  return handlers.POST(req);
}
