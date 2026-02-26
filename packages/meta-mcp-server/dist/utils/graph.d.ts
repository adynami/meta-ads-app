import type { TenantContext } from '../tenant-context.js';
export declare function validateMetaId(id: string): void;
export declare function graphGet(ctx: TenantContext, objectPath: string, params?: Record<string, any>): Promise<any>;
export declare function graphPost(ctx: TenantContext, objectPath: string, params: Record<string, any>): Promise<any>;
export declare function graphDelete(ctx: TenantContext, objectPath: string): Promise<any>;
//# sourceMappingURL=graph.d.ts.map