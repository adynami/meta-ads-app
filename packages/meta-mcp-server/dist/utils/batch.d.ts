import type { TenantContext } from '../tenant-context.js';
export interface BatchOperation {
    method: 'GET' | 'POST' | 'DELETE';
    relative_url: string;
    body?: string;
    name?: string;
    depends_on?: string;
}
/**
 * Execute up to 50 Graph API operations in a single HTTP request.
 * Each item in the returned array corresponds to the matching input operation.
 * Items with API errors return { error, code } rather than throwing.
 */
export declare function graphBatch(ctx: TenantContext, operations: BatchOperation[]): Promise<any[]>;
/**
 * Split a large list of operations into chunks and execute each chunk as a batch.
 * Useful when you have > 50 operations — it fires batches sequentially.
 */
export declare function graphBatchAll(ctx: TenantContext, operations: BatchOperation[]): Promise<any[]>;
//# sourceMappingURL=batch.d.ts.map