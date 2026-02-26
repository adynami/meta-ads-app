export function validateMetaId(id) {
    if (!/^\d+$/.test(id) && !/^act_\d+$/.test(id)) {
        throw new Error(`Invalid Meta ID: ${id}`);
    }
}
export async function graphGet(ctx, objectPath, params = {}) {
    const qp = new URLSearchParams({ access_token: ctx.accessToken });
    for (const [k, v] of Object.entries(params)) {
        qp.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
    const url = `https://graph.facebook.com/${ctx.apiVersion}/${objectPath}?${qp.toString()}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!response.ok || data.error) {
        const e = data.error ?? {};
        const err = new Error(e.message ?? `HTTP ${response.status}`);
        err.response = { error: e };
        throw err;
    }
    return data;
}
export async function graphPost(ctx, objectPath, params) {
    const url = `https://graph.facebook.com/${ctx.apiVersion}/${objectPath}`;
    const formBody = new URLSearchParams();
    formBody.append('access_token', ctx.accessToken);
    for (const [k, v] of Object.entries(params)) {
        formBody.append(k, typeof v === 'object' ? JSON.stringify(v) : String(v));
    }
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString(),
    });
    const data = await response.json();
    if (!response.ok || data.error) {
        const e = data.error ?? {};
        const err = new Error(e.message ?? `HTTP ${response.status}`);
        err.response = { error: e };
        throw err;
    }
    return data;
}
export async function graphDelete(ctx, objectPath) {
    const url = `https://graph.facebook.com/${ctx.apiVersion}/${objectPath}`;
    const formBody = new URLSearchParams({ access_token: ctx.accessToken });
    const response = await fetch(url, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formBody.toString(),
    });
    const data = await response.json();
    if (!response.ok || data.error) {
        const e = data.error ?? {};
        throw new Error(e.message ?? `HTTP ${response.status}`);
    }
    return data;
}
//# sourceMappingURL=graph.js.map