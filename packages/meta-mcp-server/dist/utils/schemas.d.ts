import { z } from 'zod';
export declare const timeRangeSchema: z.ZodEnum<["today", "yesterday", "last_3d", "last_7d", "last_14d", "last_30d", "last_90d", "this_month", "last_month"]>;
export declare const paginationSchema: z.ZodObject<{
    limit: z.ZodDefault<z.ZodNumber>;
    after: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    after?: string | undefined;
}, {
    limit?: number | undefined;
    after?: string | undefined;
}>;
export declare const campaignStatusSchema: z.ZodEnum<["ACTIVE", "PAUSED", "ARCHIVED", "DELETED"]>;
export declare const objectiveSchema: z.ZodEnum<["OUTCOME_AWARENESS", "OUTCOME_ENGAGEMENT", "OUTCOME_LEADS", "OUTCOME_SALES", "OUTCOME_TRAFFIC", "OUTCOME_APP_PROMOTION"]>;
export declare const targetingSchema: z.ZodObject<{
    age_min: z.ZodDefault<z.ZodNumber>;
    age_max: z.ZodDefault<z.ZodNumber>;
    genders: z.ZodDefault<z.ZodArray<z.ZodNumber, "many">>;
    geo_locations: z.ZodObject<{
        countries: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
        location_types: z.ZodDefault<z.ZodArray<z.ZodString, "many">>;
    }, "strip", z.ZodTypeAny, {
        countries: string[];
        location_types: string[];
    }, {
        countries?: string[] | undefined;
        location_types?: string[] | undefined;
    }>;
    publisher_platforms: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    facebook_positions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    instagram_positions: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    age_min: number;
    age_max: number;
    genders: number[];
    geo_locations: {
        countries: string[];
        location_types: string[];
    };
    publisher_platforms?: string[] | undefined;
    facebook_positions?: string[] | undefined;
    instagram_positions?: string[] | undefined;
}, {
    geo_locations: {
        countries?: string[] | undefined;
        location_types?: string[] | undefined;
    };
    age_min?: number | undefined;
    age_max?: number | undefined;
    genders?: number[] | undefined;
    publisher_platforms?: string[] | undefined;
    facebook_positions?: string[] | undefined;
    instagram_positions?: string[] | undefined;
}>;
export interface CampaignSummary {
    id: string;
    name: string;
    status: string;
    objective: string;
    daily_budget: string | null;
    lifetime_budget: string | null;
    buying_type: string;
}
export interface AdSetSummary {
    id: string;
    name: string;
    status: string;
    daily_budget: string | null;
    lifetime_budget: string | null;
    bid_strategy: string | null;
    optimization_goal: string | null;
    targeting_summary: string;
}
export interface AdSummary {
    id: string;
    name: string;
    status: string;
    creative_id: string | null;
    preview_url: string | null;
}
export interface InsightsSummary {
    entity_id: string;
    entity_name: string;
    date_range: string;
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
}
export interface AccountContext {
    id: string;
    name: string;
    currency: string;
    timezone: string;
    status: number;
    disable_reason: number;
}
//# sourceMappingURL=schemas.d.ts.map