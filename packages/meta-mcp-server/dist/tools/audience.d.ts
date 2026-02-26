import type { TenantContext } from '../tenant-context.js';
export declare const audienceTools: ({
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
            response_format: {
                type: string;
                enum: string[];
                description: string;
            };
            name?: undefined;
            description?: undefined;
            emails?: undefined;
            phones?: undefined;
            source_audience_id?: undefined;
            country?: undefined;
            ratio?: undefined;
            type?: undefined;
            pixel_id?: undefined;
            retention_days?: undefined;
            rules?: undefined;
            exclude_rules?: undefined;
            source_id?: undefined;
            source_type?: undefined;
            engagement_type?: undefined;
            video_id?: undefined;
            audience_id?: undefined;
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
            description: {
                type: string;
                description: string;
            };
            emails: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            phones: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
            };
            limit?: undefined;
            after?: undefined;
            response_format?: undefined;
            source_audience_id?: undefined;
            country?: undefined;
            ratio?: undefined;
            type?: undefined;
            pixel_id?: undefined;
            retention_days?: undefined;
            rules?: undefined;
            exclude_rules?: undefined;
            source_id?: undefined;
            source_type?: undefined;
            engagement_type?: undefined;
            video_id?: undefined;
            audience_id?: undefined;
        };
        required: string[];
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
            source_audience_id: {
                type: string;
                description: string;
            };
            country: {
                type: string;
                description: string;
            };
            ratio: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            limit?: undefined;
            after?: undefined;
            response_format?: undefined;
            description?: undefined;
            emails?: undefined;
            phones?: undefined;
            pixel_id?: undefined;
            retention_days?: undefined;
            rules?: undefined;
            exclude_rules?: undefined;
            source_id?: undefined;
            source_type?: undefined;
            engagement_type?: undefined;
            video_id?: undefined;
            audience_id?: undefined;
        };
        required: string[];
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
            pixel_id: {
                type: string;
                description: string;
            };
            retention_days: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            rules: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        type: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                        operator: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                        value: {
                            type: string;
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            exclude_rules: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        type: {
                            type: string;
                            enum: string[];
                        };
                        operator: {
                            type: string;
                            enum: string[];
                        };
                        value: {
                            type: string;
                        };
                    };
                    required: string[];
                };
            };
            limit?: undefined;
            after?: undefined;
            response_format?: undefined;
            description?: undefined;
            emails?: undefined;
            phones?: undefined;
            source_audience_id?: undefined;
            country?: undefined;
            ratio?: undefined;
            type?: undefined;
            source_id?: undefined;
            source_type?: undefined;
            engagement_type?: undefined;
            video_id?: undefined;
            audience_id?: undefined;
        };
        required: string[];
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
            description: {
                type: string;
                description: string;
            };
            source_id: {
                type: string;
                description: string;
            };
            source_type: {
                type: string;
                enum: string[];
                description: string;
            };
            engagement_type: {
                type: string;
                description: string;
                enum?: undefined;
            };
            retention_days: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            limit?: undefined;
            after?: undefined;
            response_format?: undefined;
            emails?: undefined;
            phones?: undefined;
            source_audience_id?: undefined;
            country?: undefined;
            ratio?: undefined;
            type?: undefined;
            pixel_id?: undefined;
            rules?: undefined;
            exclude_rules?: undefined;
            video_id?: undefined;
            audience_id?: undefined;
        };
        required: string[];
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
            description: {
                type: string;
                description: string;
            };
            video_id: {
                type: string;
                description: string;
            };
            engagement_type: {
                type: string;
                enum: string[];
                description: string;
            };
            retention_days: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            limit?: undefined;
            after?: undefined;
            response_format?: undefined;
            emails?: undefined;
            phones?: undefined;
            source_audience_id?: undefined;
            country?: undefined;
            ratio?: undefined;
            type?: undefined;
            pixel_id?: undefined;
            rules?: undefined;
            exclude_rules?: undefined;
            source_id?: undefined;
            source_type?: undefined;
            audience_id?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            audience_id: {
                type: string;
                description: string;
            };
            limit?: undefined;
            after?: undefined;
            response_format?: undefined;
            name?: undefined;
            description?: undefined;
            emails?: undefined;
            phones?: undefined;
            source_audience_id?: undefined;
            country?: undefined;
            ratio?: undefined;
            type?: undefined;
            pixel_id?: undefined;
            retention_days?: undefined;
            rules?: undefined;
            exclude_rules?: undefined;
            source_id?: undefined;
            source_type?: undefined;
            engagement_type?: undefined;
            video_id?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleAudienceTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=audience.d.ts.map