import type { TenantContext } from '../tenant-context.js';
export declare const budgetScheduleTools: ({
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            campaign_id: {
                type: string;
                description: string;
            };
            budget_value?: undefined;
            budget_value_type?: undefined;
            time_start?: undefined;
            time_end?: undefined;
            budget_schedule_id?: undefined;
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
            budget_value: {
                type: string;
                description: string;
            };
            budget_value_type: {
                type: string;
                enum: string[];
                description: string;
            };
            time_start: {
                type: string;
                description: string;
            };
            time_end: {
                type: string;
                description: string;
            };
            budget_schedule_id?: undefined;
        };
        required: string[];
    };
} | {
    name: string;
    description: string;
    inputSchema: {
        type: "object";
        properties: {
            budget_schedule_id: {
                type: string;
                description: string;
            };
            campaign_id?: undefined;
            budget_value?: undefined;
            budget_value_type?: undefined;
            time_start?: undefined;
            time_end?: undefined;
        };
        required: string[];
    };
})[];
export declare function handleBudgetScheduleTool(ctx: TenantContext, name: string, args: any): Promise<any>;
//# sourceMappingURL=budget-schedules.d.ts.map