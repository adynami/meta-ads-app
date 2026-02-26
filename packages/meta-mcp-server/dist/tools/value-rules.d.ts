import type { TenantContext } from '../tenant-context.js';
export declare const valueRulesTools: ({
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
            name?: undefined;
            conditions?: undefined;
            multiplier?: undefined;
            priority?: undefined;
            status?: undefined;
            campaign_id?: undefined;
            value_rule_id?: undefined;
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
            conditions: {
                type: string;
                description: string;
                minItems: number;
                maxItems: number;
                items: {
                    type: string;
                    properties: {
                        field: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                        operator: {
                            type: string;
                            enum: string[];
                            description: string;
                        };
                        values: {
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
            multiplier: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            priority: {
                type: string;
                minimum: number;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            campaign_id: {
                type: string;
                description: string;
            };
            limit?: undefined;
            value_rule_id?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            value_rule_id: {
                type: string;
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            multiplier: {
                type: string;
                minimum: number;
                maximum: number;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            priority: {
                type: string;
                minimum: number;
                description: string;
            };
            conditions: {
                type: string;
                description: string;
                minItems: number;
                maxItems: number;
                items: {
                    type: string;
                    properties: {
                        field: {
                            type: string;
                            enum?: undefined;
                            description?: undefined;
                        };
                        operator: {
                            type: string;
                            enum: string[];
                            description?: undefined;
                        };
                        values: {
                            type: string;
                            items: {
                                type: string;
                            };
                            description?: undefined;
                        };
                    };
                    required: string[];
                };
            };
            limit?: undefined;
            campaign_id?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            value_rule_id: {
                type: string;
                description: string;
            };
            limit?: undefined;
            name?: undefined;
            conditions?: undefined;
            multiplier?: undefined;
            priority?: undefined;
            status?: undefined;
            campaign_id?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleValueRulesTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=value-rules.d.ts.map