export type TimeRangeKey = 'today' | 'yesterday' | 'last_3d' | 'last_7d' | 'last_14d' | 'last_30d' | 'last_90d' | 'this_month' | 'last_month' | 'custom';
interface DateRange {
    since: string;
    until: string;
}
export declare function resolveRange(key: TimeRangeKey): DateRange;
export declare function resolvePreviousPeriod(key: TimeRangeKey): DateRange;
export {};
//# sourceMappingURL=date-ranges.d.ts.map