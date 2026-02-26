import type { TenantContext } from './tenant-context.js';
export declare const config: {
    readonly accessToken: string;
    readonly adAccountId: string;
    readonly appId: string;
    readonly appSecret: string;
    readonly apiVersion: string;
    readonly dryRun: boolean;
};
export declare function validateConfig(): void;
/** Build a TenantContext from environment variables (for stdio/MCP mode). */
export declare function tenantContextFromEnv(): TenantContext;
//# sourceMappingURL=config.d.ts.map