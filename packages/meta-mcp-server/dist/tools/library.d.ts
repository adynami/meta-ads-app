import type { TenantContext } from '../tenant-context.js';
export declare const libraryTools: {
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
            after: {
                type: string;
                description: string;
            };
        };
    };
}[];
export declare function handleLibraryTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=library.d.ts.map