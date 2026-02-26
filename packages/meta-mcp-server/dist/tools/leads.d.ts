import type { TenantContext } from '../tenant-context.js';
export declare const leadsTools: ({
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
            response_format: {
                type: string;
                enum: string[];
                description: string;
            };
            page_id?: undefined;
            name?: undefined;
            questions?: undefined;
            privacy_policy_url?: undefined;
            context_card_title?: undefined;
            context_card_body?: undefined;
            thank_you_message?: undefined;
            locale?: undefined;
            is_optimized_for_quality?: undefined;
            form_id?: undefined;
            after?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            page_id: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            questions: {
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
                        label: {
                            type: string;
                            description: string;
                        };
                        key: {
                            type: string;
                            description: string;
                        };
                        options: {
                            type: string;
                            items: {
                                type: string;
                            };
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            privacy_policy_url: {
                type: string;
                description: string;
            };
            context_card_title: {
                type: string;
                description: string;
            };
            context_card_body: {
                type: string;
                description: string;
            };
            thank_you_message: {
                type: string;
                description: string;
            };
            locale: {
                type: string;
                description: string;
            };
            is_optimized_for_quality: {
                type: string;
                description: string;
            };
            limit?: undefined;
            response_format?: undefined;
            form_id?: undefined;
            after?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            form_id: {
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
            response_format?: undefined;
            page_id?: undefined;
            name?: undefined;
            questions?: undefined;
            privacy_policy_url?: undefined;
            context_card_title?: undefined;
            context_card_body?: undefined;
            thank_you_message?: undefined;
            locale?: undefined;
            is_optimized_for_quality?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleLeadsTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=leads.d.ts.map