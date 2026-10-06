import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('@/lib/db', () => ({ db: {} }));

import { attachmentBlocks, isTrustedBlobUrl, validateAttachmentRef } from './attachment-store';

const USER = '11111111-1111-1111-1111-111111111111';
const blobUrl = (path: string) => `https://abc123.public.blob.vercel-storage.com/${path}`;

afterEach(() => {
  delete process.env.BLOB_READ_WRITE_TOKEN;
});

describe('isTrustedBlobUrl', () => {
  it("accepts our store under the user's folder only", () => {
    expect(isTrustedBlobUrl(blobUrl(`attachments/${USER}/a-x1.png`), USER)).toBe(true);
    expect(isTrustedBlobUrl(blobUrl('attachments/someone-else/a.png'), USER)).toBe(false);
    expect(isTrustedBlobUrl(`https://evil.example/attachments/${USER}/a.png`, USER)).toBe(false);
    expect(
      isTrustedBlobUrl(`http://abc.public.blob.vercel-storage.com/attachments/${USER}/a`, USER),
    ).toBe(false);
  });
});

describe('validateAttachmentRef', () => {
  const img = { name: 'a.png', media_type: 'image/png', size: 1000 };

  it('accepts a trusted blob url', () => {
    expect(
      validateAttachmentRef({ ...img, url: blobUrl(`attachments/${USER}/a.png`) }, USER),
    ).toBeNull();
  });

  it('rejects unsupported types and oversize files', () => {
    expect(
      validateAttachmentRef({ ...img, media_type: 'application/pdf', url: 'x' }, USER),
    ).toMatch(/Unsupported/);
    expect(validateAttachmentRef({ ...img, size: 50 * 1024 * 1024, url: 'x' }, USER)).toMatch(
      /too large/,
    );
  });

  it('allows small inline images only without blob storage', () => {
    expect(validateAttachmentRef({ ...img, base64: 'AAAA' }, USER)).toBeNull();
    process.env.BLOB_READ_WRITE_TOKEN = 't';
    expect(validateAttachmentRef({ ...img, base64: 'AAAA' }, USER)).toMatch(/disabled/);
  });

  it('rejects inline videos', () => {
    expect(
      validateAttachmentRef(
        { name: 'v.mp4', media_type: 'video/mp4', size: 1000, base64: 'AA' },
        USER,
      ),
    ).toMatch(/small images/);
  });
});

describe('attachmentBlocks', () => {
  it('adds vision blocks for images and an id note for all files', () => {
    const blocks = attachmentBlocks([
      {
        id: 'i1',
        name: 'a.png',
        mediaType: 'image/png',
        url: 'https://x/a.png',
        dataBase64: null,
      } as any,
      {
        id: 'v1',
        name: 'v.mp4',
        mediaType: 'video/mp4',
        url: 'https://x/v.mp4',
        dataBase64: null,
      } as any,
    ]);
    expect(blocks[0]).toEqual({ type: 'image', source: { type: 'url', url: 'https://x/a.png' } });
    expect(blocks).toHaveLength(2);
    expect((blocks[1] as any).text).toContain('attachment_id: v1');
  });
});
