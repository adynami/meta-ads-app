import type { TenantContext } from '../tenant-context.js';
export declare const duplicatorTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            adset_id: {
                type: string;
                description: string;
            };
            target_campaign_id: {
                type: string;
                description: string;
            };
            new_name: {
                type: string;
                description: string;
            };
            deep_copy: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            creative_id?: undefined;
            body_override?: undefined;
            headline_override?: undefined;
            cta_type_override?: undefined;
            url_override?: undefined;
            campaign_id?: undefined;
            new_campaign_name?: undefined;
            funnel_urls?: undefined;
            daily_budget_per_adset?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            creative_id: {
                type: string;
                description: string;
            };
            new_name: {
                type: string;
                description: string;
            };
            body_override: {
                type: string;
                description: string;
            };
            headline_override: {
                type: string;
                description: string;
            };
            cta_type_override: {
                type: string;
                enum: string[];
                description: string;
            };
            url_override: {
                type: string;
                description: string;
            };
            adset_id?: undefined;
            target_campaign_id?: undefined;
            deep_copy?: undefined;
            status?: undefined;
            campaign_id?: undefined;
            new_campaign_name?: undefined;
            funnel_urls?: undefined;
            daily_budget_per_adset?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            campaign_id: {
                type: string;
                description: string;
            };
            new_campaign_name: {
                type: string;
                description: string;
            };
            funnel_urls: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            daily_budget_per_adset: {
                type: string;
                minimum: number;
                description: string;
            };
            adset_id?: undefined;
            target_campaign_id?: undefined;
            new_name?: undefined;
            deep_copy?: undefined;
            status?: undefined;
            creative_id?: undefined;
            body_override?: undefined;
            headline_override?: undefined;
            cta_type_override?: undefined;
            url_override?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleDuplicatorTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=duplicator.d.ts.map