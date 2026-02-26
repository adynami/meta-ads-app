#!/usr/bin/env node
/**
 * HTTP MCP Server — Agency tier only.
 * Accepts connections from Claude Desktop with API key authentication.
 *
 * Usage: node dist/server-http.js
 * Claude Desktop config:
 *   { "url": "https://api.meta-ads.ai/mcp", "headers": { "Authorization": "Bearer sk-..." } }
 */
import type { TenantContext } from './tenant-context.js';
type AuthCallback = (apiKey: string) => Promise<TenantContext | null>;
export declare function setAuthCallback(cb: AuthCallback): void;
export {};
//# sourceMappingURL=server-http.d.ts.map