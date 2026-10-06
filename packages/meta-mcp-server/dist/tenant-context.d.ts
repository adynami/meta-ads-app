export interface TenantContext {
    accessToken: string;
    adAccountId: string;
    apiVersion: string;
    dryRun: boolean;
    /** HMAC-SHA256(accessToken, appSecret), hex. Sent as appsecret_proof when present. */
    appSecretProof?: string;
}
//# sourceMappingURL=tenant-context.d.ts.map