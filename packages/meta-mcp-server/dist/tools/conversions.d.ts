import type { TenantContext } from '../tenant-context.js';
export declare const conversionsTools: {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            pixel_id: {
                type: string;
                description: string;
            };
            event_name: {
                type: string;
                enum: string[];
                description: string;
            };
            custom_event_name: {
                type: string;
                description: string;
            };
            event_time: {
                type: string;
                description: string;
            };
            event_source_url: {
                type: string;
                description: string;
            };
            action_source: {
                type: string;
                enum: string[];
                description: string;
            };
            event_id: {
                type: string;
                description: string;
            };
            user_data: {
                type: string;
                description: string;
                properties: {
                    email: {
                        type: string;
                        description: string;
                    };
                    phone: {
                        type: string;
                        description: string;
                    };
                    first_name: {
                        type: string;
                        description: string;
                    };
                    last_name: {
                        type: string;
                        description: string;
                    };
                    city: {
                        type: string;
                        description: string;
                    };
                    state: {
                        type: string;
                        description: string;
                    };
                    zip: {
                        type: string;
                        description: string;
                    };
                    country: {
                        type: string;
                        description: string;
                    };
                    external_id: {
                        type: string;
                        description: string;
                    };
                    client_ip_address: {
                        type: string;
                        description: string;
                    };
                    client_user_agent: {
                        type: string;
                        description: string;
                    };
                    fbc: {
                        type: string;
                        description: string;
                    };
                    fbp: {
                        type: string;
                        description: string;
                    };
                };
            };
            custom_data: {
                type: string;
                description: string;
                properties: {
                    value: {
                        type: string;
                        description: string;
                    };
                    currency: {
                        type: string;
                        description: string;
                    };
                    content_ids: {
                        type: string;
                        items: {
                            type: string;
                        };
                        description: string;
                    };
                    content_type: {
                        type: string;
                        enum: string[];
                        description: string;
                    };
                    content_name: {
                        type: string;
                        description: string;
                    };
                    num_items: {
                        type: string;
                        description: string;
                    };
                    order_id: {
                        type: string;
                        description: string;
                    };
                    predicted_ltv: {
                        type: string;
                        description: string;
                    };
                    search_string: {
                        type: string;
                        description: string;
                    };
                };
            };
            test_event_code: {
                type: string;
                description: string;
            };
        };
        required: string[];
    };
}[];
export declare function handleConversionsTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=conversions.d.ts.map