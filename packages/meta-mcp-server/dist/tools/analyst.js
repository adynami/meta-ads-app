import { fetchAccountInsights, fetchInsightsBreakdown, fetchBreakdownInsights, getAccountContext, startAsyncInsights, pollInsightsReport, fetchInsightsReport, } from '../meta-client.js';
import { resolveRange, resolvePreviousPeriod } from '../utils/date-ranges.js';
import { computeMetrics, pctChange } from '../utils/metrics.js';
export const analystTools = [
    {
        name: 'meta_get_breakdown_insights',
        description: `Get metrics broken down by dimension (age, gender, country, platform, placement, device) and/or time series (daily, weekly). Dimensions and time can be combined.`,
        inputSchema: {
            type: 'object',
            properties: {
                time_range: {
                    type: 'string',
                    enum: ['last_3d', 'last_7d', 'last_14d', 'last_30d', 'last_90d', 'this_month', 'last_month'],
                    description: 'Analysis period (default: last_7d)',
                },
                breakdown: {
                    type: 'string',
                    enum: ['age', 'gender', 'age_gender', 'country', 'platform', 'placement', 'device'],
                    description: [
                        'age: break down by age group (13-17, 18-24, 25-34, 35-44, 45-54, 55-64, 65+)',
                        'gender: break down by male/female/unknown',
                        'age_gender: both age and gender simultaneously',
                        'country: break down by country code',
                        'platform: break down by publisher platform (facebook, instagram, audience_network, messenger)',
                        'placement: break down by platform + position + device (most granular)',
                        'device: break down by impression device type',
                    ].join(' | '),
                },
                time_series: {
                    type: 'string',
                    enum: ['daily', 'weekly', 'monthly'],
                    description: 'Add time dimension to the breakdown. daily = one row per day, weekly = one row per 7-day period, monthly = one row per month. Can be combined with breakdown.',
                },
                campaign_id: { type: 'string', description: 'Restrict to a specific campaign' },
                level: {
                    type: 'string',
                    enum: ['account', 'campaign', 'adset', 'ad'],
                    description: 'Aggregation level (default: account). Use "campaign" to see per-campaign breakdown rows.',
                },
                limit: { type: 'number', minimum: 1, maximum: 200, description: 'Max rows (default 50)' },
                attribution_window: {
                    type: 'string',
                    enum: ['1d_click', '7d_click', '28d_click', '1d_view', '7d_view', '7d_click_1d_view', '28d_click_1d_view'],
                    description: 'Attribution window override. Default is the ad set\'s configured window. Use to compare performance across different attribution models.',
                },
            },
        },
    },
    {
        name: 'meta_request_insights_report',
        description: `Run async insights report for large date ranges (90+ days) or high-granularity breakdowns. Takes 1-3 min.`,
        inputSchema: {
            type: 'object',
            properties: {
                time_range: {
                    type: 'string',
                    enum: ['last_7d', 'last_14d', 'last_30d', 'last_60d', 'last_90d', 'this_month', 'last_month', 'this_quarter', 'last_year'],
                    description: 'Analysis period. Supports longer ranges than the synchronous tool (default: last_30d)',
                },
                breakdown: {
                    type: 'string',
                    enum: ['age', 'gender', 'age_gender', 'country', 'platform', 'placement', 'device'],
                    description: 'Dimension to break results down by. Ask the user if not specified.',
                },
                time_series: {
                    type: 'string',
                    enum: ['daily', 'weekly', 'monthly'],
                    description: 'Add a time dimension (daily/weekly/monthly rows). Ask the user if not specified.',
                },
                campaign_id: { type: 'string', description: 'Restrict to a specific campaign' },
                level: {
                    type: 'string',
                    enum: ['account', 'campaign', 'adset', 'ad'],
                    description: 'Aggregation level (default: account)',
                },
                attribution_window: {
                    type: 'string',
                    enum: ['1d_click', '7d_click', '28d_click', '1d_view', '7d_view', '7d_click_1d_view', '28d_click_1d_view'],
                    description: 'Attribution window override for this report. Useful for comparing 1-day vs 7-day attribution models.',
                },
            },
        },
    },
    {
        name: 'meta_account_intelligence',
        description: `Generate intelligence report: period-over-period trends, top campaigns by ROAS, bleeder campaigns with zero conversions.`,
        inputSchema: {
            type: 'object',
            properties: {
                time_range: {
                    type: 'string',
                    enum: ['last_3d', 'last_7d', 'last_14d', 'last_30d', 'last_90d', 'this_month', 'last_month'],
                    description: 'Analysis period (default: last_7d)',
                },
                response_format: {
                    type: 'string',
                    enum: ['concise', 'detailed'],
                    description: 'concise = summary text only (~200 tokens), detailed = summary + structured trend data (default: concise)',
                },
            },
        },
    },
];
export async function handleAnalystTool(ctx, name, args) {
    if (name === 'meta_account_intelligence')
        return getAccountIntelligence(ctx, args);
    if (name === 'meta_get_breakdown_insights')
        return getBreakdownInsights(ctx, args);
    if (name === 'meta_request_insights_report')
        return requestAsyncInsightsReport(ctx, args);
    throw new Error(`Unknown tool: ${name}`);
}
// Breakdown dimension -> Meta API breakdowns param
const BREAKDOWN_MAP = {
    age: ['age'],
    gender: ['gender'],
    age_gender: ['age', 'gender'],
    country: ['country'],
    platform: ['publisher_platform'],
    placement: ['publisher_platform', 'platform_position', 'impression_device'],
    device: ['impression_device'],
};
// Dimension fields that appear in each row (for display)
const DIMENSION_FIELDS = {
    age: ['age'],
    gender: ['gender'],
    age_gender: ['age', 'gender'],
    country: ['country'],
    platform: ['publisher_platform'],
    placement: ['publisher_platform', 'platform_position', 'impression_device'],
    device: ['impression_device'],
};
const TIME_INCREMENT_MAP = {
    daily: 1,
    weekly: 7,
    monthly: 'monthly',
};
async function getBreakdownInsights(ctx, args) {
    const rangeKey = (args.time_range ?? 'last_7d');
    const range = resolveRange(rangeKey);
    const breakdowns = args.breakdown ? BREAKDOWN_MAP[args.breakdown] : undefined;
    const time_increment = args.time_series ? TIME_INCREMENT_MAP[args.time_series] : undefined;
    const result = await fetchBreakdownInsights(ctx, {
        campaign_id: args.campaign_id,
        time_range: range,
        breakdowns,
        time_increment,
        level: args.level ?? 'account',
        limit: args.limit ?? 50,
        ...(args.attribution_window && { action_attribution_windows: [args.attribution_window] }),
    });
    const dimFields = args.breakdown ? DIMENSION_FIELDS[args.breakdown] : [];
    const rows = result.data.map((row) => {
        const m = computeMetrics(row);
        // Build dimension labels
        const dim = {};
        for (const f of dimFields) {
            if (row[f] != null)
                dim[f] = row[f];
        }
        // Time label when using time_series
        if (time_increment != null && row.date_start) {
            dim.date = time_increment === 1 ? row.date_start : `${row.date_start} to ${row.date_stop}`;
        }
        // Entity label for non-account levels
        const entity = row.campaign_name ?? row.adset_name ?? row.ad_name ?? null;
        return {
            ...(entity && { entity }),
            ...(Object.keys(dim).length > 0 && { dimension: dim }),
            spend: m.spend,
            impressions: m.impressions,
            clicks: m.clicks,
            ctr: m.ctr,
            cpc: m.cpc,
            cpm: m.cpm,
            conversions: m.conversions,
            cpa: m.cpa,
            roas: m.roas,
            ...(m.conversion_breakdown && { conversion_breakdown: m.conversion_breakdown }),
            ...(m.conversion_value_breakdown && { conversion_value_breakdown: m.conversion_value_breakdown }),
            ...(m.video && { video: m.video }),
            ...(m.quality_ranking && { quality_ranking: m.quality_ranking }),
            ...(m.engagement_rate_ranking && { engagement_rate_ranking: m.engagement_rate_ranking }),
            ...(m.conversion_rate_ranking && { conversion_rate_ranking: m.conversion_rate_ranking }),
        };
    });
    return {
        period: `${range.since} to ${range.until}`,
        breakdown: args.breakdown ?? null,
        time_series: args.time_series ?? null,
        level: args.level ?? 'account',
        rows,
        ...(result.paging?.cursors?.after && { next_cursor: result.paging.cursors.after }),
    };
}
async function getAccountIntelligence(ctx, args) {
    const rangeKey = (args.time_range ?? 'last_7d');
    const currentRange = resolveRange(rangeKey);
    const previousRange = resolvePreviousPeriod(rangeKey);
    const account = await getAccountContext(ctx);
    const [currentRaw, previousRaw, campaignBreakdown] = await Promise.all([
        fetchAccountInsights(ctx, { time_range: currentRange }),
        fetchAccountInsights(ctx, { time_range: previousRange }),
        fetchInsightsBreakdown(ctx, {
            time_range: currentRange,
            level: 'campaign',
            limit: 50,
            sort: ['spend_descending'],
        }),
    ]);
    const current = currentRaw.length ? computeMetrics(currentRaw[0]) : zeroMetrics();
    const previous = previousRaw.length ? computeMetrics(previousRaw[0]) : zeroMetrics();
    const campaigns = campaignBreakdown.map((row) => ({
        name: row.campaign_name,
        metrics: computeMetrics(row),
    }));
    const topByRoas = campaigns
        .filter((c) => c.metrics.roas > 0)
        .sort((a, b) => b.metrics.roas - a.metrics.roas)
        .slice(0, 3);
    const bleeders = campaigns
        .filter((c) => c.metrics.spend > 0 && c.metrics.conversions === 0)
        .sort((a, b) => b.metrics.spend - a.metrics.spend)
        .slice(0, 3);
    const ccy = account.currency;
    const summary = buildSummaryText(current, previous, topByRoas, bleeders, ccy, currentRange, previousRange);
    // Concise mode: just the summary text -- minimal tokens
    if (args.response_format !== 'detailed') {
        return { summary };
    }
    // Detailed mode: summary + structured data for follow-up
    return {
        summary,
        account: { name: account.name, currency: ccy, timezone: account.timezone },
        period: { current: `${currentRange.since} to ${currentRange.until}`, previous: `${previousRange.since} to ${previousRange.until}` },
        trends: {
            spend: { current: current.spend, previous: previous.spend, change: pctChange(current.spend, previous.spend) },
            ctr: { current: current.ctr, previous: previous.ctr, change: pctChange(current.ctr, previous.ctr) },
            cpc: { current: current.cpc, previous: previous.cpc, change: pctChange(current.cpc, previous.cpc) },
            conversions: { current: current.conversions, previous: previous.conversions, change: pctChange(current.conversions, previous.conversions) },
            cpa: { current: current.cpa, previous: previous.cpa, change: pctChange(current.cpa, previous.cpa) },
            roas: { current: current.roas, previous: previous.roas, change: pctChange(current.roas, previous.roas) },
        },
        top_performers: topByRoas.map((c) => ({
            campaign: c.name, roas: c.metrics.roas, spend: c.metrics.spend, revenue: c.metrics.conversion_value,
        })),
        bleeders: bleeders.map((c) => ({
            campaign: c.name, spend: c.metrics.spend, clicks: c.metrics.clicks,
        })),
    };
}
function buildSummaryText(current, previous, topPerformers, bleeders, ccy, currentRange, previousRange) {
    const lines = [];
    lines.push(`Period: ${currentRange.since} to ${currentRange.until} vs ${previousRange.since} to ${previousRange.until}`);
    lines.push(`Spend: ${ccy} ${current.spend} (${pctChange(current.spend, previous.spend)})`);
    lines.push(`Conversions: ${current.conversions} (${pctChange(current.conversions, previous.conversions)}) | CPA: ${ccy} ${current.cpa} (${pctChange(current.cpa, previous.cpa)})`);
    lines.push(`ROAS: ${current.roas}x (${pctChange(current.roas, previous.roas)}) | CTR: ${current.ctr}% (${pctChange(current.ctr, previous.ctr)})`);
    if (topPerformers.length) {
        lines.push(`Top by ROAS: ${topPerformers.map((c) => `"${c.name}" ${c.metrics.roas}x`).join(', ')}`);
    }
    if (bleeders.length) {
        lines.push(`Bleeders (spend, 0 conversions): ${bleeders.map((c) => `"${c.name}" ${ccy} ${c.metrics.spend}`).join(', ')}`);
    }
    return lines.join('\n');
}
function resolveAsyncRange(key) {
    const now = new Date();
    const fmt = (d) => d.toISOString().slice(0, 10);
    const daysAgo = (n) => {
        const d = new Date(now);
        d.setDate(d.getDate() - n);
        return d;
    };
    if (key === 'last_60d')
        return { since: fmt(daysAgo(60)), until: fmt(daysAgo(1)) };
    if (key === 'last_90d')
        return { since: fmt(daysAgo(90)), until: fmt(daysAgo(1)) };
    if (key === 'this_quarter') {
        const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
        return { since: fmt(qStart), until: fmt(now) };
    }
    if (key === 'last_year') {
        return { since: `${now.getFullYear() - 1}-01-01`, until: `${now.getFullYear() - 1}-12-31` };
    }
    // Fall back to resolveRange for supported standard keys
    return resolveRange(key);
}
async function requestAsyncInsightsReport(ctx, args) {
    const rangeKey = args.time_range ?? 'last_30d';
    // Use resolveRange for standard keys, resolveAsyncRange for extended keys
    const extendedKeys = ['last_60d', 'last_90d', 'this_quarter', 'last_year'];
    const range = extendedKeys.includes(rangeKey)
        ? resolveAsyncRange(rangeKey)
        : resolveRange(rangeKey);
    const breakdowns = args.breakdown ? BREAKDOWN_MAP[args.breakdown] : undefined;
    const time_increment = args.time_series ? TIME_INCREMENT_MAP[args.time_series] : undefined;
    // Start the async job
    const reportRunId = await startAsyncInsights(ctx, {
        campaign_id: args.campaign_id,
        time_range: range,
        breakdowns,
        time_increment,
        level: args.level ?? 'account',
        ...(args.attribution_window && { action_attribution_windows: [args.attribution_window] }),
    });
    // Poll until complete
    await pollInsightsReport(ctx, reportRunId);
    // Collect all pages
    const allRows = [];
    let cursor;
    do {
        const page = await fetchInsightsReport(ctx, reportRunId, cursor);
        allRows.push(...page.data);
        cursor = page.paging?.cursors?.after && page.paging?.next ? page.paging.cursors.after : undefined;
    } while (cursor);
    const dimFields = args.breakdown ? DIMENSION_FIELDS[args.breakdown] : [];
    const rows = allRows.map((row) => {
        const m = computeMetrics(row);
        const dim = {};
        for (const f of dimFields) {
            if (row[f] != null)
                dim[f] = row[f];
        }
        if (time_increment != null && row.date_start) {
            dim.date = time_increment === 1 ? row.date_start : `${row.date_start} to ${row.date_stop}`;
        }
        const entity = row.campaign_name ?? row.adset_name ?? row.ad_name ?? null;
        return {
            ...(entity && { entity }),
            ...(Object.keys(dim).length > 0 && { dimension: dim }),
            spend: m.spend,
            impressions: m.impressions,
            clicks: m.clicks,
            ctr: m.ctr,
            cpc: m.cpc,
            cpm: m.cpm,
            conversions: m.conversions,
            cpa: m.cpa,
            roas: m.roas,
            ...(m.conversion_breakdown && { conversion_breakdown: m.conversion_breakdown }),
            ...(m.conversion_value_breakdown && { conversion_value_breakdown: m.conversion_value_breakdown }),
            ...(m.video && { video: m.video }),
        };
    });
    return {
        period: `${range.since} to ${range.until}`,
        breakdown: args.breakdown ?? null,
        time_series: args.time_series ?? null,
        level: args.level ?? 'account',
        total_rows: rows.length,
        rows,
    };
}
function zeroMetrics() {
    return { impressions: 0, clicks: 0, spend: 0, ctr: 0, cpc: 0, cpm: 0, conversions: 0, conversion_value: 0, roas: 0, cpa: 0, frequency: 0, reach: 0 };
}
//# sourceMappingURL=analyst.js.map