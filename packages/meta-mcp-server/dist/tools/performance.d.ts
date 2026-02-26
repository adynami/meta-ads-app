import type { TenantContext } from '../tenant-context.js';
export declare const performanceTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            campaign_id: {
                type: string;
                description: string;
            };
            time_range: {
                type: string;
                enum: string[];
                description: string;
            };
            primary_metric: {
                type: string;
                enum: string[];
                description: string;
            };
            product_or_service: {
                type: string;
                description: string;
            };
            objective: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
}[];
export declare function handlePerformanceTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=performance.d.ts.map