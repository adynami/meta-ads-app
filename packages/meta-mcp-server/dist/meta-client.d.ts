import type { TenantContext } from './tenant-context.js';
import type { AccountContext } from './utils/schemas.js';
export declare function getAccountContext(ctx: TenantContext): Promise<AccountContext>;
export declare function clearAccountCache(adAccountId?: string): void;
export declare function fetchCampaigns(ctx: TenantContext, fields: string[], params: Record<string, any>): Promise<any[]>;
export declare function fetchAdSets(ctx: TenantContext, fields: string[], params: Record<string, any>): Promise<any[]>;
export declare function fetchAds(ctx: TenantContext, fields: string[], params: Record<string, any>): Promise<any[]>;
export declare function fetchAccountInsights(ctx: TenantContext, params: Record<string, any>): Promise<any[]>;
export declare function fetchCampaignInsights(ctx: TenantContext, campaignId: string, params: Record<string, any>): Promise<any[]>;
export declare function fetchInsightsBreakdown(ctx: TenantContext, params: Record<string, any>): Promise<any[]>;
export declare function createCampaign(ctx: TenantContext, params: Record<string, any>): Promise<any>;
export declare function createAdSet(ctx: TenantContext, params: Record<string, any>): Promise<any>;
export declare function createAd(ctx: TenantContext, params: Record<string, any>): Promise<any>;
export declare function deleteCampaign(ctx: TenantContext, id: string): Promise<void>;
export declare function deleteAdSet(ctx: TenantContext, id: string): Promise<void>;
export declare function deleteAd(ctx: TenantContext, id: string): Promise<void>;
export declare function updateCampaignStatus(ctx: TenantContext, id: string, status: string): Promise<any>;
export declare function readAd(ctx: TenantContext, id: string, fields: string[]): Promise<any>;
export declare function readCampaign(ctx: TenantContext, id: string, fields: string[]): Promise<any>;
export declare function readAdSet(ctx: TenantContext, id: string, fields: string[]): Promise<any>;
export declare function updateCampaign(ctx: TenantContext, id: string, params: Record<string, any>): Promise<any>;
export declare function updateAdSet(ctx: TenantContext, id: string, params: Record<string, any>): Promise<any>;
export declare function updateAd(ctx: TenantContext, id: string, params: Record<string, any>): Promise<any>;
export declare function createCustomAudience(ctx: TenantContext, params: Record<string, any>): Promise<any>;
export declare function addUsersToAudience(ctx: TenantContext, audienceId: string, payload: any): Promise<any>;
export declare function fetchAudiences(ctx: TenantContext, params: Record<string, any>): Promise<any[]>;
export declare function deleteAudience(ctx: TenantContext, id: string): Promise<void>;
export declare function listPixels(ctx: TenantContext, limit: number): Promise<any[]>;
export declare function getPixelStats(ctx: TenantContext, pixelId: string, params: Record<string, any>): Promise<any>;
export declare function searchTargetingExtended(ctx: TenantContext, type: string, query: string, opts?: {
    class?: string;
    limit?: number;
}): Promise<any[]>;
export declare function searchGeoLocations(ctx: TenantContext, query: string, locationTypes: string[], limit: number): Promise<any[]>;
export declare function getInterestSuggestions(ctx: TenantContext, interestIds: string[], limit: number): Promise<any[]>;
export declare function estimateAudienceSize(ctx: TenantContext, targetingSpec: any, optimizationGoal: string, dailyBudgetCents?: number): Promise<any>;
export declare function getCreativeDetails(ctx: TenantContext, creativeId: string): Promise<any>;
export declare function downloadImageAsBase64(url: string): Promise<{
    data: string;
    mimeType: string;
}>;
export declare function searchTargeting(ctx: TenantContext, type: 'interest' | 'behavior', query: string): Promise<any[]>;
export declare function startAsyncInsights(ctx: TenantContext, params: Record<string, any>): Promise<string>;
export declare function pollInsightsReport(ctx: TenantContext, reportRunId: string, maxAttempts?: number): Promise<void>;
export declare function fetchInsightsReport(ctx: TenantContext, reportRunId: string, after?: string): Promise<{
    data: any[];
    paging?: any;
}>;
export declare function listAdImages(ctx: TenantContext, params: {
    limit: number;
    after?: string;
}): Promise<{
    data: any[];
    paging?: any;
}>;
export declare function listAdVideos(ctx: TenantContext, params: {
    limit: number;
    after?: string;
}): Promise<{
    data: any[];
    paging?: any;
}>;
export declare function listPages(ctx: TenantContext, limit: number): Promise<any[]>;
export declare function getAdDetails(ctx: TenantContext, adId: string): Promise<any>;
export declare function getAdSetDetails(ctx: TenantContext, adSetId: string): Promise<any>;
export declare function batchUpdateStatus(ctx: TenantContext, ids: string[], status: string): Promise<any[]>;
export declare function fetchBreakdownInsights(ctx: TenantContext, params: Record<string, any>): Promise<{
    data: any[];
    paging?: any;
}>;
//# sourceMappingURL=meta-client.d.ts.map