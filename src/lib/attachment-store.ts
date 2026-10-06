/**
 * Server-side attachment handling.
 *
 * Production: the browser uploads straight to Vercel Blob (see
 * /api/attachments/upload) and sends us only { url, name, media_type, size }.
 * Request bodies stay tiny regardless of file size, and attachments persist
 * across turns, so "upload the image I sent earlier" works.
 *
 * Dev without BLOB_READ_WRITE_TOKEN: small images may be sent inline as
 * base64 and are stored in the attachments table.
 */
import type Anthropic from '@anthropic-ai/sdk';
import { and, eq, inArray } from 'drizzle-orm';
import { db } from '@/lib/db';
import { attachments } from '@/lib/db/schema';
import {
  ALLOWED_MIME_TYPES,
  MAX_IMAGE_SIZE,
  MAX_INLINE_SIZE,
  MAX_VIDEO_SIZE,
  isImageType,
  type AttachmentRef,
} from '@/lib/attachments';

export type AttachmentRow = typeof attachments.$inferSelect;

/** Blob URLs must come from our own store and the uploader's own folder. */
export function isTrustedBlobUrl(url: string, userId: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === 'https:' &&
      u.hostname.endsWith('.public.blob.vercel-storage.com') &&
      u.pathname.startsWith(`/attachments/${userId}/`)
    );
  } catch {
    return false;
  }
}

export function validateAttachmentRef(ref: AttachmentRef, userId: string): string | null {
  if (!(ALLOWED_MIME_TYPES as readonly string[]).includes(ref.media_type)) {
    return `Unsupported file type: ${ref.media_type}`;
  }
  const max = isImageType(ref.media_type) ? MAX_IMAGE_SIZE : MAX_VIDEO_SIZE;
  if (!Number.isFinite(ref.size) || ref.size <= 0 || ref.size > max) {
    return `File too large: ${ref.name}`;
  }
  if (ref.url) {
    if (!isTrustedBlobUrl(ref.url, userId)) return 'Invalid attachment URL';
  } else if (ref.base64) {
    if (process.env.BLOB_READ_WRITE_TOKEN) return 'Inline uploads are disabled; upload to storage';
    if (!isImageType(ref.media_type) || ref.size > MAX_INLINE_SIZE) {
      return 'Without blob storage only small images can be attached';
    }
  } else {
    return 'Attachment has no data';
  }
  return null;
}

/** Persist new attachment refs for a conversation; returns stored rows. */
export async function saveAttachments(
  userId: string,
  conversationId: string,
  refs: AttachmentRef[],
): Promise<AttachmentRow[]> {
  if (refs.length === 0) return [];
  return db
    .insert(attachments)
    .values(
      refs.map((r) => ({
        userId,
        conversationId,
        name: r.name.slice(0, 200),
        mediaType: r.media_type,
        size: r.size,
        url: r.url ?? null,
        dataBase64: r.url ? null : (r.base64 ?? null),
      })),
    )
    .returning();
}

/** Map attachment_id → attachment, in the shape the upload tools expect. */
export async function loadAttachmentStore(
  userId: string,
  conversationId: string,
  ids?: string[],
): Promise<Map<string, any>> {
  const where = and(
    eq(attachments.userId, userId),
    eq(attachments.conversationId, conversationId),
    ...(ids?.length ? [inArray(attachments.id, ids)] : []),
  );
  const rows = await db.select().from(attachments).where(where);
  return new Map(
    rows.map((r) => [
      r.id,
      {
        id: r.id,
        name: r.name,
        media_type: r.mediaType,
        size: r.size,
        url: r.url ?? undefined,
        base64: r.dataBase64 ?? undefined,
      },
    ]),
  );
}

/** Content blocks for a user turn: images for vision + a note listing attachment IDs. */
export function attachmentBlocks(rows: AttachmentRow[]): Anthropic.Beta.BetaContentBlockParam[] {
  if (rows.length === 0) return [];
  const blocks: Anthropic.Beta.BetaContentBlockParam[] = [];
  for (const r of rows) {
    if (!isImageType(r.mediaType)) continue;
    if (r.url) {
      blocks.push({ type: 'image', source: { type: 'url', url: r.url } });
    } else if (r.dataBase64) {
      blocks.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: r.mediaType as 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp',
          data: r.dataBase64,
        },
      });
    }
  }
  const list = rows
    .map(
      (r) =>
        `- ${r.name} (${isImageType(r.mediaType) ? 'image' : 'video'}, attachment_id: ${r.id})`,
    )
    .join('\n');
  blocks.push({ type: 'text', text: `[Attached files available to upload tools:\n${list}]` });
  return blocks;
}
