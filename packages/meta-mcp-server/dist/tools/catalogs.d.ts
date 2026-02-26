import type { TenantContext } from '../tenant-context.js';
export declare const catalogTools: ({
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
            catalog_id?: undefined;
            after?: undefined;
            filter?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            catalog_id: {
                type: string;
                description: string;
            };
            limit?: undefined;
            after?: undefined;
            filter?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            catalog_id: {
                type: string;
                description: string;
            };
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
            filter: {
                type: string;
                enum: string[];
                description: string;
            };
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            catalog_id: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            after?: undefined;
            filter?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleCatalogTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=catalogs.d.ts.map