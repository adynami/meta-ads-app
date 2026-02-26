import type { TenantContext } from '../tenant-context.js';
export declare const rulesTools: ({
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
            name?: undefined;
            entity_type?: undefined;
            action?: undefined;
            action_value?: undefined;
            schedule?: undefined;
            evaluation_window?: undefined;
            conditions?: undefined;
            rule_id?: undefined;
            status?: undefined;
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
            entity_type: {
                type: string;
                enum: string[];
                description: string;
            };
            action: {
                type: string;
                enum: string[];
                description: string;
            };
            action_value: {
                type: string;
                description: string;
            };
            schedule: {
                type: string;
                enum: string[];
                description: string;
            };
            evaluation_window: {
                type: string;
                enum: string[];
                description: string;
            };
            conditions: {
                type: string;
                description: string;
                minItems: number;
                items: {
                    type: string;
                    properties: {
                        field: {
                            type: string;
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
            limit?: undefined;
            response_format?: undefined;
            rule_id?: undefined;
            status?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            rule_id: {
                type: string;
                description: string;
            };
            status: {
                type: string;
                enum: string[];
                description: string;
            };
            name: {
                type: string;
                description: string;
            };
            limit?: undefined;
            response_format?: undefined;
            entity_type?: undefined;
            action?: undefined;
            action_value?: undefined;
            schedule?: undefined;
            evaluation_window?: undefined;
            conditions?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            rule_id: {
                type: string;
                description: string;
            };
            limit?: undefined;
            response_format?: undefined;
            name?: undefined;
            entity_type?: undefined;
            action?: undefined;
            action_value?: undefined;
            schedule?: undefined;
            evaluation_window?: undefined;
            conditions?: undefined;
            status?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleRulesTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=rules.d.ts.map