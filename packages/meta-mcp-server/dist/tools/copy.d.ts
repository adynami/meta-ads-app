import type { TenantContext } from '../tenant-context.js';
export declare const copyTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            product_or_service: {
                type: string;
                description: string;
            };
            objective: {
                type: string;
                enum: string[];
                description: string;
            };
            target_audience: {
                type: string;
                description: string;
            };
            hook_style: {
                type: string;
                enum: string[];
                description: string;
            };
            key_benefits: {
                type: string;
                items: {
                    type: string;
                };
                maxItems: number;
                description: string;
            };
            brand_voice: {
                type: string;
                description: string;
            };
            variants: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            link_url: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
}[];
export declare function handleCopyTool(_ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=copy.d.ts.map