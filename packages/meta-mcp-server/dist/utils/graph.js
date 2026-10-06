import { awaitAccountSlot, isRateLimitError, noteRateLimitError, noteUsageHeaders } from './rate-limiter.js';
export function validateMetaId(id) {
    if (!/^\d+$/.test(id) && !/^act_\d+$/.test(id)) {
        throw new Error(`Invalid Meta ID: ${id}`);
    }
}
const GRAPH_HOST = 'https://graph.facebook.com';
const REQUEST_TIMEOUT_MS = 30_000;
/**
 * Single choke point for every HTTP call to the Graph API.
 *
 * - Moves `access_token` out of the URL into the Authorization header so
 *   tokens never land in proxy/CDN/access logs. (Form bodies are left alone.)
 * - Adds `appsecret_proof` when the tenant carries one.
 * - Applies per-ad-account throttling and records usage headers on every
 *   response, success or failure.
 */
export async function metaFetch(ctx, input, init = {}) {
    const url = new URL(input);
    const headers = new Headers(init.headers);
    const queryToken = url.searchParams.get('access_token');
    if (queryToken) {
        url.searchParams.delete('access_token');
        headers.set('Authorization', `Bearer ${queryToken}`);
    }
    else if (!(typeof init.body === 'string' && init.body.includes('access_token='))
        && !(init.body instanceof URLSearchParams && init.body.has('access_token'))
        && !(init.body instanceof FormData && init.body.has('access_token'))) {
        headers.set('Authorization', `Bearer ${ctx.accessToken}`);
    }
    if (ctx.appSecretProof && !url.searchParams.has('appsecret_proof')) {
        url.searchParams.set('appsecret_proof', ctx.appSecretProof);
    }
    const key = ctx.adAccountId;
    await awaitAccountSlot(key);
    const response = await fetch(url.toString(), {
        ...init,
        headers,
        signal: init.signal ?? AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    noteUsageHeaders(key, response.headers);
    if (response.status === 429)
        noteRateLimitError(key, 30_000);
    return response;
}
function toMetaError(data, status) {
    const e = data?.error ?? {};
    const err = new Error(e.message ?? `HTTP ${status}`);
    err.response = { error: e };
    err.status = status;
    return err;
}
async function parse(ctx, response) {
    const data = (await response.json());
    if (!response.ok || data?.error) {
        const err = toMetaError(data, response.status);
        if (isRateLimitError(err))
            noteRateLimitError(ctx.adAccountId, 30_000);
        throw err;
    }
    return data;
}
function toQuery(params) {
    const qp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v === undefined)
            continue;
        qp.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
    return qp;
}
export async function graphGet(ctx, objectPath, params = {}) {
    const url = `${GRAPH_HOST}/${ctx.apiVersion}/${objectPath}?${toQuery(params).toString()}`;
    return parse(ctx, await metaFetch(ctx, url));
}
/**
 * GET an edge and follow `paging.next` until exhausted or a cap is hit.
 * Returns all rows plus `truncated: true` when a cap cut the result short.
 */
export async function graphGetAll(ctx, objectPath, params = {}, opts = {}) {
    const maxRows = opts.maxRows ?? 1000;
    const maxPages = opts.maxPages ?? 20;
    const rows = [];
    let page = await graphGet(ctx, objectPath, { limit: 200, ...params });
    for (let n = 1;; n++) {
        rows.push(...(page.data ?? []));
        const next = page.paging?.next;
        if (!next)
            return { data: rows, truncated: false };
        if (rows.length >= maxRows || n >= maxPages) {
            return { data: rows.slice(0, maxRows), truncated: true };
        }
        page = await parse(ctx, await metaFetch(ctx, next));
    }
}
export async function graphPost(ctx, objectPath, params) {
    const debug = process.env.META_MCP_DEBUG === '1';
    const url = `${GRAPH_HOST}/${ctx.apiVersion}/${objectPath}`;
    if (debug) {
        console.error(`[META_MCP_DEBUG] POST ${objectPath}`, JSON.stringify(params));
    }
    const response = await metaFetch(ctx, url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: toQuery(params).toString(),
    });
    try {
        const data = await parse(ctx, response);
        if (debug)
            console.error(`[META_MCP_DEBUG] OK ${objectPath}`, JSON.stringify(data));
        return data;
    }
    catch (err) {
        if (debug)
            console.error(`[META_MCP_DEBUG] ERROR ${objectPath}`, JSON.stringify(err.response));
        throw err;
    }
}
export async function graphPostMultipart(ctx, objectPath, fields, fileField) {
    const url = `${GRAPH_HOST}/${ctx.apiVersion}/${objectPath}`;
    const form = new FormData();
    for (const [k, v] of Object.entries(fields)) {
        form.append(k, v);
    }
    form.append(fileField.name, new Blob([fileField.data], { type: fileField.contentType }), fileField.filename);
    // Do NOT set Content-Type header — fetch auto-sets it with the boundary.
    // Uploads can be large; allow longer than the default timeout.
    const response = await metaFetch(ctx, url, {
        method: 'POST',
        body: form,
        signal: AbortSignal.timeout(120_000),
    });
    return parse(ctx, response);
}
export async function graphDelete(ctx, objectPath) {
    const url = `${GRAPH_HOST}/${ctx.apiVersion}/${objectPath}`;
    return parse(ctx, await metaFetch(ctx, url, { method: 'DELETE' }));
}
//# sourceMappingURL=graph.js.map