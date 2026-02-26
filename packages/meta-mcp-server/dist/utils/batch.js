import { rateLimitedCall } from './rate-limiter.js';
/**
 * Execute up to 50 Graph API operations in a single HTTP request.
 * Each item in the returned array corresponds to the matching input operation.
 * Items with API errors return { error, code } rather than throwing.
 */
export async function graphBatch(ctx, operations) {
    if (operations.length === 0)
        return [];
    if (operations.length > 50) {
        throw new Error('Batch API supports a maximum of 50 operations per request');
    }
    return rateLimitedCall(async () => {
        const formBody = new URLSearchParams();
        formBody.append('access_token', ctx.accessToken);
        formBody.append('batch', JSON.stringify(operations));
        const response = await fetch(`https://graph.facebook.com/${ctx.apiVersion}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody.toString(),
        });
        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Batch request failed with HTTP ${response.status}: ${text}`);
        }
        const results = await response.json();
        return results.map((result, i) => {
            if (result === null)
                return null;
            try {
                const body = typeof result.body === 'string' ? JSON.parse(result.body) : result.body;
                if (result.code >= 400 || body?.error) {
                    const e = body?.error ?? {};
                    const err = new Error(e.message ?? `HTTP ${result.code}`);
                    err.response = { error: e };
                    err.batchIndex = i;
                    return { error: err, code: result.code };
                }
                return body;
            }
            catch {
                return { raw: result.body, code: result.code };
            }
        });
    });
}
/**
 * Split a large list of operations into chunks and execute each chunk as a batch.
 * Useful when you have > 50 operations — it fires batches sequentially.
 */
export async function graphBatchAll(ctx, operations) {
    const results = [];
    for (let i = 0; i < operations.length; i += 50) {
        const chunk = operations.slice(i, i + 50);
        const chunkResults = await graphBatch(ctx, chunk);
        results.push(...chunkResults);
    }
    return results;
}
//# sourceMappingURL=batch.js.map