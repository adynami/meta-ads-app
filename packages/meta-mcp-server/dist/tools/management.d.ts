import type { TenantContext } from '../tenant-context.js';
export declare const managementTools: ({
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
            status_filter: {
                type: string;
                items: {
                    type: string;
                    enum: string[];
                };
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
            campaign_id?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            campaign_id: {
                type: string;
                description: string;
            };
            limit?: undefined;
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            campaign_id: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            status_filter: {
                type: string;
                items: {
                    type: string;
                    enum: string[];
                };
                description: string;
            };
            response_format: {
                type: string;
                enum: string[];
                description: string;
            };
            after?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            adset_id: {
                type: string;
                description: string;
            };
            campaign_id: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            time_range: {
                type: string;
                enum: string[];
                description: string;
            };
            since: {
                type: string;
                description: string;
            };
            until: {
                type: string;
                description: string;
            };
            campaign_id: {
                type: string;
                description: string;
            };
            level: {
                type: string;
                enum: string[];
                description: string;
            };
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
            status_filter?: undefined;
            after?: undefined;
            adset_id?: undefined;
            status?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            campaign_id: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            limit?: undefined;
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            limit?: undefined;
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            type: {
                type: string;
                enum: string[];
                description: string;
            };
            query: {
                type: string;
                description: string;
            };
            limit?: undefined;
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            query: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            class: {
                type: string;
                enum: string[];
                description: string;
            };
            query: {
                type: string;
                description: string;
            };
            limit: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            query: {
                type: string;
                description: string;
            };
            location_types: {
                type: string;
                items: {
                    type: string;
                    enum: string[];
                };
                description: string;
            };
            limit: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            class?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            interest_ids: {
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
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            targeting: {
                type: string;
                description: string;
                properties: {
                    age_min: {
                        type: string;
                    };
                    age_max: {
                        type: string;
                    };
                    genders: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    geo_locations: {
                        type: string;
                        properties: {
                            countries: {
                                type: string;
                                items: {
                                    type: string;
                                };
                            };
                        };
                    };
                    interests: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                id: {
                                    type: string;
                                };
                                name: {
                                    type: string;
                                };
                            };
                            required: string[];
                        };
                    };
                    behaviors: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                id: {
                                    type: string;
                                };
                                name: {
                                    type: string;
                                };
                            };
                            required: string[];
                        };
                    };
                };
                required: string[];
            };
            optimization_goal: {
                type: string;
                enum: string[];
                description: string;
            };
            limit?: undefined;
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            ad_id: {
                type: string;
                description: string;
            };
            creative_id: {
                type: string;
                description: string;
            };
            limit?: undefined;
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            ad_id: {
                type: string;
                description: string;
            };
            limit?: undefined;
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            adset_id: {
                type: string;
                description: string;
            };
            limit?: undefined;
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            creative_id: {
                type: string;
                description: string;
            };
            limit?: undefined;
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required: string[];
    };
} | {
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
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required?: undefined;
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            targeting: {
                type: string;
                description: string;
                properties: {
                    age_min: {
                        type: string;
                    };
                    age_max: {
                        type: string;
                    };
                    genders: {
                        type: string;
                        items: {
                            type: string;
                        };
                    };
                    geo_locations: {
                        type: string;
                        properties: {
                            countries: {
                                type: string;
                                items: {
                                    type: string;
                                };
                            };
                        };
                    };
                    interests: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                id: {
                                    type: string;
                                };
                                name: {
                                    type: string;
                                };
                            };
                            required: string[];
                        };
                    };
                    behaviors: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                id: {
                                    type: string;
                                };
                                name: {
                                    type: string;
                                };
                            };
                            required: string[];
                        };
                    };
                };
                required: string[];
            };
            daily_budget_usd: {
                type: string;
                description: string;
            };
            optimization_goal: {
                type: string;
                enum: string[];
                description: string;
            };
            limit?: undefined;
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            ids?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            ids: {
                type: string;
                items: {
                    type: string;
                };
                description: string;
                minItems: number;
                maxItems: number;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            limit?: undefined;
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ad_format?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            ad_id: {
                type: string;
                description: string;
            };
            ad_format: {
                type: string;
                enum: string[];
                description: string;
            };
            limit?: undefined;
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            adset_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            status?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_name?: undefined;
            image_hash?: undefined;
            page_id?: undefined;
            headline?: undefined;
            body?: undefined;
            link_url?: undefined;
            call_to_action?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            adset_id: {
                type: string;
                description: string;
            };
            ad_name: {
                type: string;
                description: string;
            };
            image_hash: {
                type: string;
                description: string;
            };
            page_id: {
                type: string;
                description: string;
            };
            headline: {
                type: string;
                description: string;
            };
            body: {
                type: string;
                description: string;
            };
            link_url: {
                type: string;
                description: string;
            };
            call_to_action: {
                type: string;
                enum: string[];
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            limit?: undefined;
            status_filter?: undefined;
            after?: undefined;
            response_format?: undefined;
            campaign_id?: undefined;
            time_range?: undefined;
            since?: undefined;
            until?: undefined;
            level?: undefined;
            type?: undefined;
            query?: undefined;
            class?: undefined;
            location_types?: undefined;
            interest_ids?: undefined;
            targeting?: undefined;
            optimization_goal?: undefined;
            ad_id?: undefined;
            creative_id?: undefined;
            daily_budget_usd?: undefined;
            ids?: undefined;
            ad_format?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleManagementTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=management.d.ts.map