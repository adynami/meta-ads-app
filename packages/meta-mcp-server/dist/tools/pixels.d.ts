import type { TenantContext } from '../tenant-context.js';
export declare const pixelTools: ({
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
            pixel_id?: undefined;
            time_range?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            pixel_id: {
                type: string;
                description: string;
            };
            time_range: {
                type: string;
                enum: string[];
                description: string;
            };
            limit?: undefined;
        };
        required: string[];
    };
})[];
export declare function handlePixelTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=pixels.d.ts.map