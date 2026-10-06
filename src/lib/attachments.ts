/**
 * Shared attachment types and constants used by both client and server.
 */

/** What the browser sends with a chat message. Exactly one of url/base64. */
export interface AttachmentRef {
  name: string;
  media_type: string;
  size: number;
  /** Vercel Blob URL (production). */
  url?: string;
  /** Inline data (local dev without blob storage, small images only). */
  base64?: string;
}

/** Subset stored in client state for display */
export interface AttachmentMeta {
  id: string;
  name: string;
  media_type: string;
  preview_url?: string;
}

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;

export const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const;

export const ALLOWED_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES] as const;

/** 10 MB for images */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
/** 100 MB for videos */
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;
/** Inline (no blob storage) uploads must fit in a serverless request body. */
export const MAX_INLINE_SIZE = 3 * 1024 * 1024;

export function isImageType(mime: string): boolean {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(mime);
}

export function isVideoType(mime: string): boolean {
  return (VIDEO_MIME_TYPES as readonly string[]).includes(mime);
}
