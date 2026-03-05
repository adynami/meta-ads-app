import { rateLimitedCall } from '../utils/rate-limiter.js';
import { graphGet, graphPost } from '../utils/graph.js';
// ── Tool definitions ──
export const duplicatorTools = [
    {
        name: 'meta_duplicate_adset',
        description: 'Clone an ad set with its ads into same or different campaign. Created as PAUSED.',
        inputSchema: {
            type: 'object',
            properties: {
                adset_id: { type: 'string', description: 'ID of the ad set to duplicate' },
                target_campaign_id: {
                    type: 'string',
                    description: 'Campaign to copy the ad set into (default: same campaign)',
                },
                new_name: {
                    type: 'string',
                    description: 'Name for the new ad set (default: original name + " Copy")',
                },
                deep_copy: {
                    type: 'boolean',
                    description: 'Copy ads inside the ad set as well (default: true)',
                },
                status: {
                    type: 'string',
                    enum: ['PAUSED', 'ACTIVE', 'INHERITED_FROM_SOURCE'],
                    description: 'Status for the new ad set (default: PAUSED)',
                },
            },
            required: ['adset_id'],
        },
    },
    {
        name: 'meta_duplicate_creative',
        description: 'Clone a creative with optional overrides (body, headline, CTA, URL).',
        inputSchema: {
            type: 'object',
            properties: {
                creative_id: { type: 'string', description: 'ID of the creative to clone' },
                new_name: { type: 'string', description: 'Name for the new creative' },
                body_override: { type: 'string', description: 'Replace the primary text (body copy)' },
                headline_override: { type: 'string', description: 'Replace the headline' },
                cta_type_override: {
                    type: 'string',
                    enum: [
                        'LEARN_MORE',
                        'SHOP_NOW',
                        'SIGN_UP',
                        'BOOK_TRAVEL',
                        'CONTACT_US',
                        'DOWNLOAD',
                        'GET_OFFER',
                        'GET_QUOTE',
                        'SUBSCRIBE',
                        'APPLY_NOW',
                    ],
                    description: 'Replace the CTA button type',
                },
                url_override: {
                    type: 'string',
                    description: 'Replace destination URL in all link placements',
                },
            },
            required: ['creative_id'],
        },
    },
    {
        name: 'meta_duplicate_campaign',
        description: 'Deep-copy a campaign with all ad sets and ads. Created as PAUSED.',
        inputSchema: {
            type: 'object',
            properties: {
                campaign_id: {
                    type: 'string',
                    description: 'ID of the campaign to duplicate',
                },
                new_campaign_name: {
                    type: 'string',
                    description: 'Display name for the new campaign',
                },
                funnel_urls: {
                    type: 'array',
                    items: { type: 'string' },
                    description: 'New destination URLs to assign to ad sets by index. Optional — omit to keep original URLs. If fewer URLs than ad sets, the last URL is reused for remaining ad sets. Provide one per ad set for full control.',
                },
                daily_budget_per_adset: {
                    type: 'number',
                    minimum: 1,
                    description: 'New daily budget per ad set in major currency units (e.g. 33 for $33/day). Optional — omit to keep original ad set budgets.',
                },
            },
            required: ['campaign_id', 'new_campaign_name'],
        },
    },
];
// ── Handler ──
export async function handleDuplicatorTool(ctx, name, args) {
    switch (name) {
        case 'meta_duplicate_campaign':
            return duplicateCampaign(ctx, args);
        case 'meta_duplicate_adset':
            return duplicateAdSet(ctx, args);
        case 'meta_duplicate_creative':
            return duplicateCreative(ctx, args);
        default:
            throw new Error(`Unknown tool: ${name}`);
    }
}
// ── Helpers ──
/** Fetch all ad sets for a campaign, auto-paginating. */
async function fetchAllAdSets(ctx, campaignId) {
    const adSets = [];
    let cursor = null;
    do {
        const params = { fields: 'id,name,status', limit: 25 };
        if (cursor)
            params.after = cursor;
        const resp = await rateLimitedCall(() => graphGet(ctx, `${campaignId}/adsets`, params));
        adSets.push(...(resp.data ?? []));
        cursor = resp.paging?.cursors?.after && resp.paging?.next ? resp.paging.cursors.after : null;
    } while (cursor);
    return adSets;
}
/** Poll an async Graph API session until completed or failed (~20 min max with exponential backoff). */
async function pollAsyncSession(ctx, sessionId, maxAttempts = 50) {
    const BASE_MS = 5_000;
    const MAX_MS = 30_000;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) {
            const delay = Math.min(BASE_MS * Math.pow(2, attempt - 1), MAX_MS);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        const session = await rateLimitedCall(() => graphGet(ctx, sessionId, {
            fields: 'id,status,result,results,error_message,error_code,error_subcode,error_user_title,error_user_msg',
        }));
        const status = (session.status ?? '').toLowerCase();
        if (status === 'completed') {
            const directId = session.copied_campaign_id ??
                session.result?.copied_campaign_id ??
                session.data?.copied_campaign_id;
            if (directId)
                return directId;
            const batchResults = session.results ?? (Array.isArray(session.result) ? session.result : []);
            if (batchResults.length > 0) {
                try {
                    const body = typeof batchResults[0].body === 'string'
                        ? JSON.parse(batchResults[0].body)
                        : (batchResults[0].body ?? {});
                    const campaignId = body.copied_campaign_id;
                    if (campaignId)
                        return campaignId;
                }
                catch {
                    /* fall through */
                }
            }
            throw new Error(`Async session ${sessionId} completed but no copied_campaign_id found. Raw: ${JSON.stringify(session)}`);
        }
        if (status === 'failed' || status === 'error') {
            // Surface v25 error fields for actionable diagnostics
            const userMsg = session.error_user_msg ??
                session.error_user_title ??
                session.error_message ??
                JSON.stringify(session);
            const code = session.error_code ? ` (code ${session.error_code})` : '';
            const subcode = session.error_subcode ? ` (subcode ${session.error_subcode})` : '';
            throw new Error(`Async copy session ${sessionId} failed: ${userMsg}${code}${subcode}`);
        }
        // in_progress / pending — keep polling
    }
    throw new Error(`Async copy session ${sessionId} did not complete within ~20 minutes. The campaign may still be copying on Meta's side — check Ads Manager.`);
}
// ── Copy helpers (three-tier fallback) ──
/** Detect Meta "too many objects to copy at once" error (code 100, subcode 1885194). */
function isTooManyObjectsError(err) {
    const e = err?.response?.error;
    return e?.code === 100 && e?.error_subcode === 1885194;
}
/** Fetch all ad IDs in an ad set (paginated). */
async function fetchAdIdsForAdSet(ctx, adsetId) {
    const ids = [];
    let cursor = null;
    do {
        const params = { fields: 'id', limit: 50 };
        if (cursor)
            params.after = cursor;
        const resp = await rateLimitedCall(() => graphGet(ctx, `${adsetId}/ads`, params));
        for (const ad of resp.data ?? [])
            ids.push(ad.id);
        cursor = resp.paging?.cursors?.after && resp.paging?.next ? resp.paging.cursors.after : null;
    } while (cursor);
    return ids;
}
/**
 * Try async batch copy. Returns the copied object ID on success.
 * Handles three response shapes: async_session_id, sync success array, sync error array.
 */
async function tryAsyncBatchCopy(ctx, relativeUrl, bodyParams, idField) {
    const batchItem = {
        method: 'POST',
        relative_url: relativeUrl,
        body: new URLSearchParams(bodyParams).toString(),
    };
    const data = await rateLimitedCall(async () => {
        const formBody = new URLSearchParams();
        formBody.append('access_token', ctx.accessToken);
        formBody.append('async', 'true');
        formBody.append('batch', JSON.stringify([batchItem]));
        const response = await fetch(`https://graph.facebook.com/${ctx.apiVersion}/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: formBody.toString(),
        });
        const result = (await response.json());
        if (!response.ok || result.error) {
            const e = result.error ?? {};
            const err = new Error(e.message ?? `HTTP ${response.status}`);
            err.response = { error: e };
            throw err;
        }
        return result;
    });
    // Shape 1: Got an async session — poll it
    if (data.async_session_id) {
        const pollFn = idField === 'copied_adset_id' ? pollAsyncSessionForAdSet : pollAsyncSession;
        return pollFn(ctx, data.async_session_id);
    }
    // Shape 2/3: Synchronous batch response (array)
    if (Array.isArray(data) && data.length > 0) {
        const entry = data[0];
        const body = typeof entry.body === 'string' ? JSON.parse(entry.body) : (entry.body ?? {});
        if (body.error) {
            const err = new Error(body.error.message ?? 'Batch item error');
            err.response = { error: body.error };
            throw err;
        }
        const copiedId = body[idField] ?? body.id;
        if (copiedId)
            return copiedId;
    }
    throw new Error(`Async batch returned unexpected shape. Raw: ${JSON.stringify(data)}`);
}
/** Tier 3: Shallow-copy ad set then copy each ad individually. */
async function decomposeAdSetCopy(ctx, adsetId, bodyParams) {
    // Shallow copy (structure only, no ads)
    const shallowParams = { ...bodyParams, deep_copy: '0' };
    const shallowResult = await rateLimitedCall(() => graphPost(ctx, `${adsetId}/copies`, shallowParams));
    const newAdSetId = shallowResult.copied_adset_id ?? shallowResult.id;
    if (!newAdSetId)
        throw new Error(`Shallow ad set copy returned no ID. Raw: ${JSON.stringify(shallowResult)}`);
    // Copy each ad individually into the new ad set
    const adIds = await fetchAdIdsForAdSet(ctx, adsetId);
    for (const adId of adIds) {
        await rateLimitedCall(() => graphPost(ctx, `${adId}/copies`, {
            adset_id: newAdSetId,
            status_option: bodyParams.status_option ?? 'PAUSED',
            rename_strategy: 'DEEP_RENAME',
        }));
    }
    return newAdSetId;
}
/** Tier 3: Shallow-copy campaign then copy each ad set individually (using tiered fallback). */
async function decomposeCampaignCopy(ctx, campaignId, newName) {
    // Shallow copy campaign (structure only)
    const shallowResult = await rateLimitedCall(() => graphPost(ctx, `${campaignId}/copies`, {
        deep_copy: '0',
        status_option: 'PAUSED',
        rename_strategy: 'DEEP_RENAME',
        name: newName,
    }));
    const newCampaignId = shallowResult.copied_campaign_id ?? shallowResult.id;
    if (!newCampaignId)
        throw new Error(`Shallow campaign copy returned no ID. Raw: ${JSON.stringify(shallowResult)}`);
    // Copy each ad set from original into new campaign (using tiered fallback)
    const adSets = await fetchAllAdSets(ctx, campaignId);
    for (const adSet of adSets) {
        const adSetBodyParams = {
            deep_copy: '1',
            status_option: 'PAUSED',
            rename_strategy: 'DEEP_RENAME',
            campaign_id: newCampaignId,
            targeting: JSON.stringify({ targeting_automation: { advantage_audience: 0 } }),
        };
        await copyWithTieredFallback(ctx, adSet.id, `${adSet.id}/copies`, adSetBodyParams, 'copied_adset_id');
    }
    return newCampaignId;
}
/**
 * Three-tier copy fallback:
 *  1. Direct POST (fast, works for small copies)
 *  2. Async batch (handles medium copies)
 *  3. Manual decomposition (handles 3+ child objects)
 */
async function copyWithTieredFallback(ctx, objectId, relativeUrl, bodyParams, idField) {
    // Tier 1: Direct POST
    try {
        const result = await rateLimitedCall(() => graphPost(ctx, relativeUrl, bodyParams));
        const copiedId = result[idField] ?? result.id;
        if (copiedId)
            return copiedId;
        throw new Error(`Direct copy returned no ID. Raw: ${JSON.stringify(result)}`);
    }
    catch (err) {
        if (!isTooManyObjectsError(err))
            throw err;
    }
    // Tier 2: Async batch
    try {
        return await tryAsyncBatchCopy(ctx, relativeUrl, bodyParams, idField);
    }
    catch (err) {
        if (!isTooManyObjectsError(err))
            throw err;
    }
    // Tier 3: Manual decomposition
    if (idField === 'copied_adset_id') {
        return decomposeAdSetCopy(ctx, objectId, bodyParams);
    }
    else {
        return decomposeCampaignCopy(ctx, objectId, bodyParams.name ?? 'Campaign Copy');
    }
}
// ── Implementation ──
async function duplicateAdSet(ctx, args) {
    const { adset_id, target_campaign_id, new_name, deep_copy = true, status = 'PAUSED' } = args;
    if (ctx.dryRun) {
        return {
            dry_run: true,
            message: `Simulated: Duplicate ad set ${adset_id}${target_campaign_id ? ` into campaign ${target_campaign_id}` : ''}`,
        };
    }
    const bodyParams = {
        deep_copy: deep_copy ? '1' : '0',
        status_option: status === 'INHERITED_FROM_SOURCE' ? 'INHERITED_FROM_SOURCE' : status,
        rename_strategy: 'DEEP_RENAME',
        targeting: JSON.stringify({ targeting_automation: { advantage_audience: 0 } }),
    };
    if (new_name)
        bodyParams.name = new_name;
    if (target_campaign_id)
        bodyParams.campaign_id = target_campaign_id;
    const newAdSetId = await copyWithTieredFallback(ctx, adset_id, `${adset_id}/copies`, bodyParams, 'copied_adset_id');
    return {
        success: true,
        new_adset_id: newAdSetId,
        target_campaign_id: target_campaign_id ?? '(same as source)',
        status: status === 'INHERITED_FROM_SOURCE' ? 'INHERITED_FROM_SOURCE' : status,
    };
}
/** Like pollAsyncSession but extracts copied_adset_id from the result. */
async function pollAsyncSessionForAdSet(ctx, sessionId, maxAttempts = 50) {
    const BASE_MS = 5_000;
    const MAX_MS = 30_000;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        if (attempt > 0) {
            const delay = Math.min(BASE_MS * Math.pow(2, attempt - 1), MAX_MS);
            await new Promise((resolve) => setTimeout(resolve, delay));
        }
        const session = await rateLimitedCall(() => graphGet(ctx, sessionId, {
            fields: 'id,status,result,results,error_message,error_code,error_subcode,error_user_title,error_user_msg',
        }));
        const status = (session.status ?? '').toLowerCase();
        if (status === 'completed') {
            // Try direct fields first
            const directId = session.copied_adset_id ?? session.result?.copied_adset_id;
            if (directId)
                return directId;
            // Try batch results array
            const batchResults = session.results ?? (Array.isArray(session.result) ? session.result : []);
            if (batchResults.length > 0) {
                try {
                    const body = typeof batchResults[0].body === 'string'
                        ? JSON.parse(batchResults[0].body)
                        : (batchResults[0].body ?? {});
                    const adsetId = body.copied_adset_id ?? body.id;
                    if (adsetId)
                        return adsetId;
                }
                catch {
                    /* fall through */
                }
            }
            throw new Error(`Async session ${sessionId} completed but no copied_adset_id found. Raw: ${JSON.stringify(session)}`);
        }
        if (status === 'failed' || status === 'error') {
            const userMsg = session.error_user_msg ??
                session.error_user_title ??
                session.error_message ??
                JSON.stringify(session);
            const code = session.error_code ? ` (code ${session.error_code})` : '';
            const subcode = session.error_subcode ? ` (subcode ${session.error_subcode})` : '';
            throw new Error(`Async copy session ${sessionId} failed: ${userMsg}${code}${subcode}`);
        }
    }
    throw new Error(`Async copy session ${sessionId} did not complete within ~20 minutes.`);
}
async function duplicateCreative(ctx, args) {
    const { creative_id, new_name, body_override, headline_override, cta_type_override, url_override, } = args;
    if (ctx.dryRun) {
        return {
            dry_run: true,
            message: `Simulated: Duplicate creative ${creative_id}`,
        };
    }
    // Step 1: Fetch existing creative
    const qp = new URLSearchParams({
        access_token: ctx.accessToken,
        fields: 'id,name,object_story_spec,asset_feed_spec,degrees_of_freedom_spec',
    });
    const response = await fetch(`https://graph.facebook.com/${ctx.apiVersion}/${creative_id}?${qp.toString()}`);
    const creative = (await response.json());
    if (!response.ok || creative.error) {
        const e = creative.error ?? {};
        throw new Error(e.message ?? `HTTP ${response.status}`);
    }
    const isDco = !!creative.asset_feed_spec;
    let creativeParams;
    if (isDco) {
        // DCO/flex creative: preserve asset_feed_spec with all variations
        const feedSpec = JSON.parse(JSON.stringify(creative.asset_feed_spec));
        if (headline_override)
            feedSpec.titles = [{ text: headline_override }];
        if (body_override)
            feedSpec.bodies = [{ text: body_override }];
        if (url_override) {
            feedSpec.link_urls = (feedSpec.link_urls ?? []).map((entry) => ({
                ...entry,
                website_url: url_override,
                display_url: new URL(url_override).hostname,
            }));
            if (feedSpec.link_urls.length === 0) {
                feedSpec.link_urls = [{ website_url: url_override, display_url: new URL(url_override).hostname }];
            }
        }
        if (cta_type_override)
            feedSpec.call_to_action_types = [cta_type_override];
        creativeParams = {
            name: new_name ?? `${creative.name} Copy`,
            asset_feed_spec: feedSpec,
        };
        // object_story_spec carries page_id — include if present
        if (creative.object_story_spec) {
            creativeParams.object_story_spec = JSON.parse(JSON.stringify(creative.object_story_spec));
        }
        if (creative.degrees_of_freedom_spec) {
            creativeParams.degrees_of_freedom_spec = JSON.parse(JSON.stringify(creative.degrees_of_freedom_spec));
        }
    }
    else {
        // Standard creative
        if (!creative.object_story_spec) {
            throw new Error('Creative does not have an object_story_spec or asset_feed_spec — cannot clone this type of creative.');
        }
        const spec = JSON.parse(JSON.stringify(creative.object_story_spec));
        const applyToLinkData = (ld) => {
            if (!ld)
                return;
            if (body_override)
                ld.message = body_override;
            if (headline_override)
                ld.name = headline_override;
            if (url_override)
                ld.link = url_override;
            if (cta_type_override && ld.call_to_action)
                ld.call_to_action.type = cta_type_override;
            if (url_override && ld.child_attachments) {
                for (const card of ld.child_attachments) {
                    if (card.link)
                        card.link = url_override;
                }
            }
        };
        applyToLinkData(spec.link_data);
        if (spec.video_data) {
            if (body_override)
                spec.video_data.message = body_override;
            if (url_override && spec.video_data.call_to_action?.value) {
                spec.video_data.call_to_action.value.link = url_override;
            }
            if (cta_type_override && spec.video_data.call_to_action) {
                spec.video_data.call_to_action.type = cta_type_override;
            }
        }
        creativeParams = {
            name: new_name ?? `${creative.name} Copy`,
            object_story_spec: spec,
        };
    }
    const newCreative = await rateLimitedCall(() => graphPost(ctx, `${ctx.adAccountId}/adcreatives`, creativeParams));
    return {
        success: true,
        new_creative_id: newCreative.id,
        new_name: creativeParams.name,
        account_id: ctx.adAccountId,
        ...(isDco && { is_dco: true }),
    };
}
async function duplicateCampaign(ctx, args) {
    const { campaign_id, new_campaign_name, funnel_urls, daily_budget_per_adset } = args;
    if (ctx.dryRun) {
        return {
            dry_run: true,
            message: `Simulated: Duplicate campaign ${campaign_id} as "${new_campaign_name}"`,
            new_campaign_name,
            funnel_urls: funnel_urls ?? '(keep originals)',
            daily_budget_per_adset: daily_budget_per_adset ?? '(keep originals)',
        };
    }
    // Step 1: Deep copy via three-tier fallback
    const campaignBodyParams = {
        deep_copy: '1',
        status_option: 'PAUSED',
        rename_strategy: 'DEEP_RENAME',
        name: new_campaign_name,
    };
    const newCampaignId = await copyWithTieredFallback(ctx, campaign_id, `${campaign_id}/copies`, campaignBodyParams, 'copied_campaign_id');
    // Step 2: Fetch all ad sets in the new campaign (auto-paginated)
    const adSets = await fetchAllAdSets(ctx, newCampaignId);
    if (adSets.length === 0) {
        return {
            success: true,
            new_campaign_id: newCampaignId,
            new_campaign_name,
            adsets: [],
            note: 'Campaign copied but no ad sets found in the new campaign.',
        };
    }
    // Step 3: For each ad set — optionally update budget and swap funnel URLs
    const adsetSummaries = [];
    for (let i = 0; i < adSets.length; i++) {
        const adSet = adSets[i];
        // Determine funnel URL for this ad set
        // If funnel_urls has fewer entries than ad sets, reuse the last one
        let funnelUrl = null;
        if (funnel_urls?.length) {
            funnelUrl = funnel_urls[Math.min(i, funnel_urls.length - 1)];
        }
        // Update budget if requested
        if (daily_budget_per_adset != null) {
            const budgetCents = Math.round(daily_budget_per_adset * 100);
            await rateLimitedCall(() => graphPost(ctx, adSet.id, { daily_budget: String(budgetCents) }));
        }
        // Swap funnel URLs if provided
        if (funnelUrl) {
            const adsResponse = await rateLimitedCall(() => graphGet(ctx, `${adSet.id}/ads`, {
                fields: 'id,name,creative{id,object_story_spec}',
                limit: 50,
            }));
            const ads = adsResponse.data ?? [];
            for (const ad of ads) {
                const creative = ad.creative;
                if (!creative?.object_story_spec)
                    continue;
                const updatedSpec = JSON.parse(JSON.stringify(creative.object_story_spec));
                // Handle image, carousel, and video link_data
                if (updatedSpec.link_data?.link) {
                    updatedSpec.link_data.link = funnelUrl;
                }
                if (updatedSpec.link_data?.child_attachments) {
                    for (const card of updatedSpec.link_data.child_attachments) {
                        if (card.link)
                            card.link = funnelUrl;
                    }
                }
                // Handle video CTA link
                if (updatedSpec.video_data?.call_to_action?.value?.link) {
                    updatedSpec.video_data.call_to_action.value.link = funnelUrl;
                }
                // Creatives are immutable — create a new one, then point the ad to it
                const newCreative = await rateLimitedCall(() => graphPost(ctx, `${ctx.adAccountId}/adcreatives`, { object_story_spec: updatedSpec }));
                await rateLimitedCall(() => graphPost(ctx, ad.id, { creative: { creative_id: newCreative.id } }));
            }
        }
        adsetSummaries.push({
            adset_id: adSet.id,
            adset_name: adSet.name,
            funnel_url: funnelUrl,
            budget_updated: daily_budget_per_adset != null,
            status: 'PAUSED',
        });
    }
    return {
        success: true,
        new_campaign_id: newCampaignId,
        new_campaign_name,
        adsets_count: adSets.length,
        adsets: adsetSummaries,
        all_statuses_paused: true,
    };
}
//# sourceMappingURL=duplicator.js.map