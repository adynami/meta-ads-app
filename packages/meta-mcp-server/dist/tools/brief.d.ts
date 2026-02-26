import type { TenantContext } from '../tenant-context.js';
export declare const briefTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            signal_type: {
                type: string;
                enum: string[];
                description: string;
            };
            signal_data: {
                type: string;
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
            constraints: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
}[];
export declare function handleBriefTool(_ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=brief.d.ts.map