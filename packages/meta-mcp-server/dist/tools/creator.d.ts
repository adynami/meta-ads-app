import type { TenantContext } from '../tenant-context.js';
export declare const creatorTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            campaign_name: {
                type: string;
                description: string;
            };
            objective: {
                type: string;
                enum: string[];
                description: string;
            };
            budget_level: {
                type: string;
                enum: string[];
                description: string;
            };
            budget_type: {
                type: string;
                enum: string[];
                description: string;
            };
            daily_budget: {
                type: string;
                minimum: number;
                description: string;
            };
            end_time: {
                type: string;
                description: string;
            };
            bid_strategy: {
                type: string;
                enum: string[];
                description: string;
            };
            bid_amount: {
                type: string;
                minimum: number;
                description: string;
            };
            min_roas: {
                type: string;
                minimum: number;
                description: string;
            };
            targeting: {
                type: string;
                description: string;
                properties: {
                    age_min: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        description: string;
                    };
                    age_max: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        description: string;
                    };
                    genders: {
                        type: string;
                        items: {
                            type: string;
                            enum: number[];
                        };
                        description: string;
                    };
                    geo_locations: {
                        type: string;
                        properties: {
                            countries: {
                                type: string;
                                items: {
                                    type: string;
                                    minLength: number;
                                    maxLength: number;
                                };
                                description: string;
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
                        };
                        description: string;
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
                        };
                        description: string;
                    };
                    custom_audiences: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                id: {
                                    type: string;
                                };
                            };
                        };
                        description: string;
                    };
                    excluded_custom_audiences: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                id: {
                                    type: string;
                                };
                            };
                        };
                        description: string;
                    };
                    placements: {
                        type: string;
                        description: string;
                        properties: {
                            publisher_platforms: {
                                type: string;
                                items: {
                                    type: string;
                                    enum: string[];
                                };
                                description: string;
                            };
                            facebook_positions: {
                                type: string;
                                items: {
                                    type: string;
                                    enum: string[];
                                };
                                description: string;
                            };
                            instagram_positions: {
                                type: string;
                                items: {
                                    type: string;
                                    enum: string[];
                                };
                                description: string;
                            };
                            audience_network_positions: {
                                type: string;
                                items: {
                                    type: string;
                                    enum: string[];
                                };
                                description: string;
                            };
                            messenger_positions: {
                                type: string;
                                items: {
                                    type: string;
                                    enum: string[];
                                };
                                description: string;
                            };
                            threads_positions: {
                                type: string;
                                items: {
                                    type: string;
                                    enum: string[];
                                };
                                description: string;
                            };
                        };
                    };
                };
            };
            start_time: {
                type: string;
                description: string;
            };
            ad_schedule: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        days: {
                            type: string;
                            items: {
                                type: string;
                                enum: number[];
                            };
                            description: string;
                        };
                        start_minute: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            description: string;
                        };
                        end_minute: {
                            type: string;
                            minimum: number;
                            maximum: number;
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            creative_type: {
                type: string;
                enum: string[];
                description: string;
            };
            image_hash: {
                type: string;
                description: string;
            };
            video_id: {
                type: string;
                description: string;
            };
            cards: {
                type: string;
                description: string;
                minItems: number;
                maxItems: number;
                items: {
                    type: string;
                    properties: {
                        image_hash: {
                            type: string;
                            description: string;
                        };
                        headline: {
                            type: string;
                            description: string;
                        };
                        link_url: {
                            type: string;
                            description: string;
                        };
                        description: {
                            type: string;
                            description: string;
                        };
                        call_to_action: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            page_id: {
                type: string;
                description: string;
            };
            ad_copy: {
                type: string;
                description: string;
                properties: {
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
                };
                required: string[];
            };
            pixel_id: {
                type: string;
                description: string;
            };
            custom_event_type: {
                type: string;
                enum: string[];
                description: string;
            };
            destination_type: {
                type: string;
                enum: string[];
                description: string;
            };
            url_tags: {
                type: string;
                description: string;
            };
            special_ad_categories: {
                type: string;
                items: {
                    type: string;
                    enum: string[];
                };
                description: string;
            };
            use_advantage_audience: {
                type: string;
                description: string;
            };
            start_immediately: {
                type: string;
                description: string;
            };
            image_hashes?: undefined;
            headlines?: undefined;
            bodies?: undefined;
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
            campaign_name: {
                type: string;
                description: string;
            };
            objective: {
                type: string;
                enum: string[];
                description: string;
            };
            daily_budget: {
                type: string;
                minimum: number;
                description: string;
            };
            image_hashes: {
                type: string;
                items: {
                    type: string;
                };
                minItems: number;
                maxItems: number;
                description: string;
            };
            headlines: {
                type: string;
                items: {
                    type: string;
                };
                minItems: number;
                maxItems: number;
                description: string;
            };
            bodies: {
                type: string;
                items: {
                    type: string;
                };
                minItems: number;
                maxItems: number;
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
            page_id: {
                type: string;
                description: string;
            };
            targeting: {
                type: string;
                description: string;
                properties: {
                    age_min: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        description?: undefined;
                    };
                    age_max: {
                        type: string;
                        minimum: number;
                        maximum: number;
                        description?: undefined;
                    };
                    genders: {
                        type: string;
                        items: {
                            type: string;
                            enum: number[];
                        };
                        description?: undefined;
                    };
                    geo_locations: {
                        type: string;
                        properties: {
                            countries: {
                                type: string;
                                items: {
                                    type: string;
                                    minLength?: undefined;
                                    maxLength?: undefined;
                                };
                                description?: undefined;
                            };
                        };
                    };
                    custom_audiences: {
                        type: string;
                        items: {
                            type: string;
                            properties: {
                                id: {
                                    type: string;
                                };
                            };
                        };
                        description?: undefined;
                    };
                    interests?: undefined;
                    behaviors?: undefined;
                    excluded_custom_audiences?: undefined;
                    placements?: undefined;
                };
            };
            pixel_id: {
                type: string;
                description: string;
            };
            start_immediately: {
                type: string;
                description: string;
            };
            budget_level?: undefined;
            budget_type?: undefined;
            end_time?: undefined;
            bid_strategy?: undefined;
            bid_amount?: undefined;
            min_roas?: undefined;
            start_time?: undefined;
            ad_schedule?: undefined;
            creative_type?: undefined;
            image_hash?: undefined;
            video_id?: undefined;
            cards?: undefined;
            ad_copy?: undefined;
            custom_event_type?: undefined;
            destination_type?: undefined;
            url_tags?: undefined;
            special_ad_categories?: undefined;
            use_advantage_audience?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleCreatorTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=creator.d.ts.map