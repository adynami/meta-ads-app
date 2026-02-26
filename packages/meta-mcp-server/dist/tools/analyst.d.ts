import type { TenantContext } from '../tenant-context.js';
export declare const analystTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            time_range: {
                type: string;
                enum: string[];
                description: string;
            };
            breakdown: {
                type: string;
                enum: string[];
                description: string;
            };
            time_series: {
                type: string;
                enum: string[];
                description: string;
            };
            campaign_id: {
                type: string;
                description: string;
            };
            level: {
                type: string;
                enum: string[];
                description: string;
            };
            limit: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            attribution_window: {
                type: string;
                enum: string[];
                description: string;
            };
            response_format?: undefined;
        };
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            time_range: {
                type: string;
                enum: string[];
                description: string;
            };
            breakdown: {
                type: string;
                enum: string[];
                description: string;
            };
            time_series: {
                type: string;
                enum: string[];
                description: string;
            };
            campaign_id: {
                type: string;
                description: string;
            };
            level: {
                type: string;
                enum: string[];
                description: string;
            };
            attribution_window: {
                type: string;
                enum: string[];
                description: string;
            };
            limit?: undefined;
            response_format?: undefined;
        };
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            time_range: {
                type: string;
                enum: string[];
                description: string;
            };
            response_format: {
                type: string;
                enum: string[];
                description: string;
            };
            breakdown?: undefined;
            time_series?: undefined;
            campaign_id?: undefined;
            level?: undefined;
            limit?: undefined;
            attribution_window?: undefined;
        };
    };
})[];
export declare function handleAnalystTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=analyst.d.ts.map