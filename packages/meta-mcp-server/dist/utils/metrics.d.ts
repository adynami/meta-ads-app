export interface RawInsightRow {
    impressions?: string;
    clicks?: string;
    spend?: string;
    actions?: Array<{
        action_type: string;
        value: string;
    }>;
    action_values?: Array<{
        action_type: string;
        value: string;
    }>;
    campaign_id?: string;
    campaign_name?: string;
    adset_id?: string;
    adset_name?: string;
    ad_id?: string;
    ad_name?: string;
    date_start?: string;
    date_stop?: string;
    cpm?: string;
    frequency?: string;
    reach?: string;
    video_p25_watched_actions?: Array<{
        action_type: string;
        value: string;
    }>;
    video_p50_watched_actions?: Array<{
        action_type: string;
        value: string;
    }>;
    video_p75_watched_actions?: Array<{
        action_type: string;
        value: string;
    }>;
    video_p100_watched_actions?: Array<{
        action_type: string;
        value: string;
    }>;
    video_avg_time_watched_actions?: Array<{
        action_type: string;
        value: string;
    }>;
    unique_clicks?: string;
    unique_ctr?: string;
    outbound_clicks?: Array<{
        action_type: string;
        value: string;
    }>;
    outbound_clicks_ctr?: Array<{
        action_type: string;
        value: string;
    }>;
    inline_link_clicks?: string;
    inline_link_click_ctr?: string;
    quality_ranking?: string;
    engagement_rate_ranking?: string;
    conversion_rate_ranking?: string;
}
export interface VideoMetrics {
    views_3s: number;
    views_p25: number;
    views_p50: number;
    views_p75: number;
    views_p100: number;
    avg_watch_time_sec: number;
    completion_rate: number;
}
export interface ConversionBreakdown {
    [shortName: string]: number;
}
export interface ConversionValueBreakdown {
    [shortName: string]: number;
}
export interface ComputedMetrics {
    impressions: number;
    clicks: number;
    spend: number;
    ctr: number;
    cpc: number;
    cpm: number;
    conversions: number;
    conversion_value: number;
    roas: number;
    cpa: number;
    frequency: number;
    reach: number;
    unique_clicks?: number;
    unique_ctr?: number;
    outbound_clicks?: number;
    conversion_breakdown?: ConversionBreakdown;
    conversion_value_breakdown?: ConversionValueBreakdown;
    video?: VideoMetrics;
    quality_ranking?: string;
    engagement_rate_ranking?: string;
    conversion_rate_ranking?: string;
}
export declare function extractConversions(row: RawInsightRow): {
    count: number;
    value: number;
};
/**
 * Extract a per-event-type conversion breakdown from the actions / action_values arrays.
 * Returns only non-zero entries, keyed by short display names.
 * Omits aggregate types (omni_*, lead_form, etc.) when the granular pixel type is also present.
 */
export declare function extractActionBreakdown(row: RawInsightRow): {
    counts: ConversionBreakdown;
    values: ConversionValueBreakdown;
};
export declare function computeMetrics(row: RawInsightRow): ComputedMetrics;
export declare function pctChange(current: number, previous: number): string;
//# sourceMappingURL=metrics.d.ts.map