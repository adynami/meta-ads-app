import type { TenantContext } from '../tenant-context.js';
export declare const debugTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            ad_id: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
}[];
export declare function handleDebugTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=debug.d.ts.map