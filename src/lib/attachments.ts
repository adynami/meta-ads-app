/**
 * Shared attachment types and constants used by both client and server.
 */

export interface Attachment {
  id: string;
  name: string;
  media_type: string;
  size: number;
  base64: string;
}

/** Subset stored in client state after sending (no base64) */
export interface AttachmentMeta {
  id: string;
  name: string;
  media_type: string;
  preview_url?: string;
}

export type AttachmentStore = Map<string, Attachment>;

export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const;

export const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'] as const;

export const ALLOWED_MIME_TYPES = [...IMAGE_MIME_TYPES, ...VIDEO_MIME_TYPES] as const;

/** 10 MB for images */
export const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
/** 100 MB for videos */
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024;

export function isImageType(mime: string): boolean {
  return (IMAGE_MIME_TYPES as readonly string[]).includes(mime);
}

export function isVideoType(mime: string): boolean {
  return (VIDEO_MIME_TYPES as readonly string[]).includes(mime);
}
