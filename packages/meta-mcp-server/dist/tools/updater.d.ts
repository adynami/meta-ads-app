import type { TenantContext } from '../tenant-context.js';
export declare const updaterTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            campaign_id: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            daily_budget: {
                type: string;
                minimum: number;
                description: string;
            };
            lifetime_budget: {
                type: string;
                minimum: number;
                description: string;
            };
            bid_strategy: {
                type: string;
                enum: string[];
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
            adset_id?: undefined;
            bid_amount?: undefined;
            end_time?: undefined;
            targeting?: undefined;
            ad_schedule?: undefined;
            destination_type?: undefined;
            attribution_spec?: undefined;
            use_advantage_audience?: undefined;
            ad_id?: undefined;
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
            name: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            daily_budget: {
                type: string;
                minimum: number;
                description: string;
            };
            lifetime_budget: {
                type: string;
                minimum: number;
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
            end_time: {
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
                    };
                    age_max: {
                        type: string;
                        minimum: number;
                        maximum: number;
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
                                };
                                description: string;
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
                                    description: string;
                                };
                                exclusion: {
                                    type: string;
                                    description: string;
                                };
                            };
                        };
                        description: string;
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
                            };
                            facebook_positions: {
                                type: string;
                                items: {
                                    type: string;
                                    enum: string[];
                                };
                            };
                            instagram_positions: {
                                type: string;
                                items: {
                                    type: string;
                                    enum: string[];
                                };
                            };
                            audience_network_positions: {
                                type: string;
                                items: {
                                    type: string;
                                    enum: string[];
                                };
                            };
                            messenger_positions: {
                                type: string;
                                items: {
                                    type: string;
                                    enum: string[];
                                };
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
                        };
                        start_minute: {
                            type: string;
                            minimum: number;
                            maximum: number;
                        };
                        end_minute: {
                            type: string;
                            minimum: number;
                            maximum: number;
                        };
                    };
                    required: string[];
                };
            };
            destination_type: {
                type: string;
                enum: string[];
                description: string;
            };
            attribution_spec: {
                type: string;
                description: string;
                items: {
                    type: string;
                    properties: {
                        event_type: {
                            type: string;
                            enum: string[];
                        };
                        window_days: {
                            type: string;
                            enum: number[];
                            description: string;
                        };
                    };
                    required: string[];
                };
            };
            use_advantage_audience: {
                type: string;
                description: string;
            };
            campaign_id?: undefined;
            special_ad_categories?: undefined;
            ad_id?: undefined;
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
            name: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            campaign_id?: undefined;
            daily_budget?: undefined;
            lifetime_budget?: undefined;
            bid_strategy?: undefined;
            special_ad_categories?: undefined;
            adset_id?: undefined;
            bid_amount?: undefined;
            end_time?: undefined;
            targeting?: undefined;
            ad_schedule?: undefined;
            destination_type?: undefined;
            attribution_spec?: undefined;
            use_advantage_audience?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleUpdaterTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=updater.d.ts.map