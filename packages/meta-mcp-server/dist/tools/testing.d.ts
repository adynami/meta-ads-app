import type { TenantContext } from '../tenant-context.js';
export declare const testingTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            limit: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            name?: undefined;
            campaign_a_id?: undefined;
            campaign_b_id?: undefined;
            variable?: undefined;
            optimization_metric?: undefined;
            end_time?: undefined;
            confidence_level?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            name: {
                type: string;
                description: string;
            };
            campaign_a_id: {
                type: string;
                description: string;
            };
            campaign_b_id: {
                type: string;
                description: string;
            };
            variable: {
                type: string;
                enum: string[];
                description: string;
            };
            optimization_metric: {
                type: string;
                enum: string[];
                description: string;
            };
            end_time: {
                type: string;
                description: string;
            };
            confidence_level: {
                type: string;
                enum: number[];
                description: string;
            };
            limit?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleTestingTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=testing.d.ts.map