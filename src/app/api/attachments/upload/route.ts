import { NextRequest } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { auth } from '@/lib/auth';
import { getUserByEmail } from '@/lib/tenants';
import { ALLOWED_MIME_TYPES, MAX_VIDEO_SIZE } from '@/lib/attachments';

/**
 * GET: tells the browser whether direct-to-Blob uploads are available and
 * which path prefix it must upload under.
 */
export async function GET() {
  const session = await auth();
  const user = session?.user?.email ? await getUserByEmail(session.user.email) : null;
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return Response.json({
    enabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    prefix: `attachments/${user.id}/`,
  });
}

/**
 * POST: Vercel Blob client-upload handshake. Issues a short-lived token that
 * lets the browser upload directly to Blob — file bytes never pass through
 * this function, so the 4.5 MB request-body limit doesn't apply.
 */
export async function POST(req: NextRequest) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return Response.json({ error: 'Blob storage not configured' }, { status: 501 });
  }
  const session = await auth();
  const user = session?.user?.email ? await getUserByEmail(session.user.email) : null;
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(`attachments/${user.id}/`)) {
          throw new Error('Invalid upload path');
        }
        return {
          allowedContentTypes: [...ALLOWED_MIME_TYPES],
          // Per-type limits are re-checked when the attachment is used in chat.
          maximumSizeInBytes: MAX_VIDEO_SIZE,
          // Unguessable URLs: blobs are public so Claude and Meta can fetch them.
          addRandomSuffix: true,
          validUntil: Date.now() + 10 * 60_000,
        };
      },
    });
    return Response.json(result);
  } catch (err) {
    return Response.json({ error: (err as Error).message }, { status: 400 });
  }
}
