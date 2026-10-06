import { createHmac } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { TenantContext } from 'meta-mcp-server/tenant-context';
import { db } from '@/lib/db';
import { adAccounts, users } from '@/lib/db/schema';
import { decrypt } from '@/lib/crypto';
import { META_API_VERSION, refreshAccountTokenIfNeeded } from '@/lib/meta-auth';

export type AdAccountRow = typeof adAccounts.$inferSelect;
export type UserRow = typeof users.$inferSelect;

/** A Meta ad account the agent can act on, with its decrypted context. */
export interface Tenant {
  /** Internal ad_accounts.id (uuid). */
  id: string;
  /** act_xxx */
  metaAdAccountId: string;
  name: string;
  ctx: TenantContext;
}

export function appSecretProof(accessToken: string): string | undefined {
  const secret = process.env.META_APP_SECRET;
  if (!secret) return undefined;
  return createHmac('sha256', secret).update(accessToken).digest('hex');
}

export function buildTenantContext(accessToken: string, adAccountId: string): TenantContext {
  return {
    accessToken,
    adAccountId,
    apiVersion: META_API_VERSION,
    dryRun: process.env.DRY_RUN === 'true',
    appSecretProof: appSecretProof(accessToken),
  };
}

/** Throws if the stored token can't be decrypted. */
export function toTenant(account: AdAccountRow): Tenant {
  return {
    id: account.id,
    metaAdAccountId: account.metaAdAccountId,
    name: account.metaAccountName || account.metaAdAccountId,
    ctx: buildTenantContext(decrypt(account.accessTokenEnc), account.metaAdAccountId),
  };
}

export async function getUserByEmail(email: string): Promise<UserRow | undefined> {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user;
}

/**
 * Resolve the tenants for a request.
 *  - accountId 'all'  → every active account
 *  - accountId uuid   → that account (must belong to the user)
 *  - accountId absent → the user's first active account
 * Accounts whose token fails to decrypt are reported in `failed`, not thrown.
 */
export async function loadTenants(
  userId: string,
  accountId: string | null | undefined,
): Promise<{ tenants: Tenant[]; failed: string[] }> {
  const base = and(eq(adAccounts.userId, userId), eq(adAccounts.isActive, true));
  const rows =
    accountId === 'all'
      ? await db.select().from(adAccounts).where(base)
      : await db
          .select()
          .from(adAccounts)
          .where(accountId ? and(base, eq(adAccounts.id, accountId)) : base)
          .limit(1);

  const tenants: Tenant[] = [];
  const failed: string[] = [];
  for (const row of rows) {
    // In "all" mode an expired account would fail every fanned-out call; skip it.
    if (accountId === 'all' && row.tokenExpiresAt && row.tokenExpiresAt < new Date()) {
      failed.push(row.metaAccountName || row.metaAdAccountId);
      continue;
    }
    if (row.tokenExpiresAt) refreshAccountTokenIfNeeded(row.id, 7).catch(() => {});
    try {
      tenants.push(toTenant(row));
    } catch {
      failed.push(row.metaAccountName || row.metaAdAccountId);
    }
  }
  return { tenants, failed };
}

/**
 * Env-var tenant for local development only (skips OAuth). Never enabled in
 * production builds, regardless of what env vars are set.
 */
export function devEnvTenant(): Tenant | null {
  if (process.env.NODE_ENV !== 'development') return null;
  const token = process.env.META_ACCESS_TOKEN;
  const account = process.env.META_AD_ACCOUNT_ID;
  if (!token || !account) return null;
  const ctx = buildTenantContext(token, account);
  if (process.env.META_API_VERSION) ctx.apiVersion = process.env.META_API_VERSION;
  return { id: 'dev', metaAdAccountId: account, name: account, ctx };
}
