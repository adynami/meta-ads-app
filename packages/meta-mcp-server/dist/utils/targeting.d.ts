/**
 * Shared targeting spec builder.
 * Converts the tool-facing `targeting` input shape into the Meta API `targeting_spec` format.
 * Used by meta_deploy_campaign (creator.ts) and meta_estimate_audience_size (management.ts).
 */
export declare function buildTargetingSpec(t: any, useAdvantageAudience?: boolean): Record<string, any>;
//# sourceMappingURL=targeting.d.ts.map