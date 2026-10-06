import type { TenantContext } from '../tenant-context.js';
export declare function validateMetaId(id: string): void;
/**
 * Single choke point for every HTTP call to the Graph API.
 *
 * - Moves `access_token` out of the URL into the Authorization header so
 *   tokens never land in proxy/CDN/access logs. (Form bodies are left alone.)
 * - Adds `appsecret_proof` when the tenant carries one.
 * - Applies per-ad-account throttling and records usage headers on every
 *   response, success or failure.
 */
export declare function metaFetch(ctx: TenantContext, input: string, init?: RequestInit): Promise<Response>;
export declare function graphGet(ctx: TenantContext, objectPath: string, params?: Record<string, any>): Promise<any>;
export interface PageOptions {
    /** Stop after this many rows in total (default 1000). */
    maxRows?: number;
    /** Stop after this many pages (default 20). */
    maxPages?: number;
}
/**
 * GET an edge and follow `paging.next` until exhausted or a cap is hit.
 * Returns all rows plus `truncated: true` when a cap cut the result short.
 */
export declare function graphGetAll(ctx: TenantContext, objectPath: string, params?: Record<string, any>, opts?: PageOptions): Promise<{
    data: any[];
    truncated: boolean;
}>;
export declare function graphPost(ctx: TenantContext, objectPath: string, params: Record<string, any>): Promise<any>;
export declare function graphPostMultipart(ctx: TenantContext, objectPath: string, fields: Record<string, string>, fileField: {
    name: string;
    data: Buffer;
    filename: string;
    contentType: string;
}): Promise<any>;
export declare function graphDelete(ctx: TenantContext, objectPath: string): Promise<any>;
//# sourceMappingURL=graph.d.ts.map