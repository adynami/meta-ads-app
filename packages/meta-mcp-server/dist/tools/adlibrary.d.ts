import type { TenantContext } from '../tenant-context.js';
export declare const adLibraryTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            search_terms: {
                type: string;
                description: string;
            };
            countries: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            limit: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            active_only: {
                type: string;
                description: string;
            };
            search_page_ids: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
        };
        required: string[];
    };
}[];
export declare function handleAdLibraryTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=adlibrary.d.ts.map