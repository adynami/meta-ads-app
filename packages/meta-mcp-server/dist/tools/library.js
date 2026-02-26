import { rateLimitedCall } from '../utils/rate-limiter.js';
import { graphGet, graphPostMultipart } from '../utils/graph.js';
// ── Tool definitions ──
export const libraryTools = [
    {
        name: 'meta_list_ad_images',
        description: 'Browse ad image library: hash, name, dimensions, URL.',
        inputSchema: {
            type: 'object',
            properties: {
                limit: { type: 'number', minimum: 1, maximum: 100, description: 'Max results (default 25)' },
                after: { type: 'string', description: 'Pagination cursor from a previous response' },
            },
        },
    },
    {
        name: 'meta_list_ad_videos',
        description: 'Browse ad video library: ID, title, length, status, thumbnail.',
        inputSchema: {
            type: 'object',
            properties: {
                limit: { type: 'number', minimum: 1, maximum: 100, description: 'Max results (default 25)' },
                after: { type: 'string', description: 'Pagination cursor from a previous response' },
            },
        },
    },
    {
        name: 'meta_upload_image',
        description: 'Upload an attached image to the ad library. Returns image hash.',
        inputSchema: {
            type: 'object',
            properties: {
                attachment_id: { type: 'string', description: 'The attachment ID from the user message' },
                name: { type: 'string', description: 'Optional name for the image' },
            },
            required: ['attachment_id'],
        },
    },
    {
        name: 'meta_upload_video',
        description: 'Upload an attached video to the ad library. Returns video_id.',
        inputSchema: {
            type: 'object',
            properties: {
                attachment_id: { type: 'string', description: 'The attachment ID from the user message' },
                title: { type: 'string', description: 'Optional title for the video' },
                description: { type: 'string', description: 'Optional description for the video' },
            },
            required: ['attachment_id'],
        },
    },
];
// ── Handler ──
export async function handleLibraryTool(ctx, name, args, attachmentStore) {
    switch (name) {
        case 'meta_list_ad_images': return listAdImages(ctx, args);
        case 'meta_list_ad_videos': return listAdVideos(ctx, args);
        case 'meta_upload_image': return uploadImage(ctx, args, attachmentStore);
        case 'meta_upload_video': return uploadVideo(ctx, args, attachmentStore);
        default: throw new Error(`Unknown tool: ${name}`);
    }
}
// ── Implementations ──
async function listAdImages(ctx, args) {
    const params = {
        fields: 'hash,name,url,width,height,status,created_time',
        limit: args.limit ?? 25,
    };
    if (args.after)
        params.after = args.after;
    const result = await rateLimitedCall(() => graphGet(ctx, `${ctx.adAccountId}/adimages`, params));
    const images = (result.data ?? []).map((img) => ({
        hash: img.hash,
        name: img.name ?? null,
        url: img.url ?? null,
        dimensions: img.width && img.height ? `${img.width}×${img.height}` : null,
        status: img.status ?? null,
        created: img.created_time ?? null,
    }));
    return {
        images,
        total_returned: images.length,
        ...(result.paging?.cursors?.after && result.paging?.next
            ? { next_cursor: result.paging.cursors.after }
            : {}),
        note: 'Use the hash field when creating ads with meta_add_ad or meta_deploy_campaign.',
    };
}
const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
const VIDEO_MIME_TYPES = ['video/mp4', 'video/quicktime', 'video/webm'];
async function uploadImage(ctx, args, attachmentStore) {
    if (!attachmentStore)
        throw new Error('No attachment store available');
    const attachment = attachmentStore.get(args.attachment_id);
    if (!attachment)
        throw new Error(`Attachment not found: ${args.attachment_id}`);
    if (!IMAGE_MIME_TYPES.includes(attachment.media_type)) {
        throw new Error(`Attachment is not an image (type: ${attachment.media_type})`);
    }
    const buffer = Buffer.from(attachment.base64, 'base64');
    const filename = args.name || attachment.name || 'image.jpg';
    const result = await rateLimitedCall(() => graphPostMultipart(ctx, `${ctx.adAccountId}/adimages`, {}, {
        name: 'filename',
        data: buffer,
        filename,
        contentType: attachment.media_type,
    }));
    // Meta returns images keyed by filename
    const imageData = result.images?.[filename] ?? Object.values(result.images ?? {})[0];
    return {
        success: true,
        hash: imageData?.hash ?? null,
        name: filename,
        url: imageData?.url ?? null,
    };
}
async function uploadVideo(ctx, args, attachmentStore) {
    if (!attachmentStore)
        throw new Error('No attachment store available');
    const attachment = attachmentStore.get(args.attachment_id);
    if (!attachment)
        throw new Error(`Attachment not found: ${args.attachment_id}`);
    if (!VIDEO_MIME_TYPES.includes(attachment.media_type)) {
        throw new Error(`Attachment is not a video (type: ${attachment.media_type})`);
    }
    const buffer = Buffer.from(attachment.base64, 'base64');
    const title = args.title || attachment.name || 'video.mp4';
    const fields = {};
    if (args.title)
        fields.title = args.title;
    if (args.description)
        fields.description = args.description;
    const result = await rateLimitedCall(() => graphPostMultipart(ctx, `${ctx.adAccountId}/advideos`, fields, {
        name: 'source',
        data: buffer,
        filename: attachment.name || 'video.mp4',
        contentType: attachment.media_type,
    }));
    return {
        success: true,
        video_id: result.id ?? null,
        title,
    };
}
async function listAdVideos(ctx, args) {
    const params = {
        fields: 'id,title,description,length,status,created_time,picture',
        limit: args.limit ?? 25,
    };
    if (args.after)
        params.after = args.after;
    const result = await rateLimitedCall(() => graphGet(ctx, `${ctx.adAccountId}/advideos`, params));
    const videos = (result.data ?? []).map((v) => ({
        id: v.id,
        title: v.title ?? null,
        description: v.description ?? null,
        length_seconds: v.length ?? null,
        status: v.status ?? null,
        thumbnail_url: v.picture ?? null,
        created: v.created_time ?? null,
    }));
    return {
        videos,
        total_returned: videos.length,
        ...(result.paging?.cursors?.after && result.paging?.next
            ? { next_cursor: result.paging.cursors.after }
            : {}),
        note: 'Use the id field when creating video ads with meta_deploy_campaign.',
    };
}
//# sourceMappingURL=library.js.map