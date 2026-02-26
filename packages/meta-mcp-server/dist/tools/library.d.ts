import type { TenantContext } from '../tenant-context.js';
export declare const libraryTools: ({
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
            attachment_id?: undefined;
            name?: undefined;
            title?: undefined;
            description?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            attachment_id: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            limit?: undefined;
            after?: undefined;
            title?: undefined;
            description?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            attachment_id: {
                type: string;
                description: string;
            };
            title: {
                type: string;
                description: string;
            };
            description: {
                type: string;
                description: string;
            };
            limit?: undefined;
            after?: undefined;
            name?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleLibraryTool(ctx: TenantContext, name: string, args: any, attachmentStore?: Map<string, any>): Promise<any>;
//# sourceMappingURL=library.d.ts.map