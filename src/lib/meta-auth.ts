/**
 * Meta OAuth utilities — token exchange, long-lived tokens, ad account discovery,
 * and ad-account connection/storage.
 */

import { db } from '@/lib/db';
import { adAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { encrypt, decrypt } from '@/lib/crypto';
import { canAddAccount, type Plan } from '@/lib/plans';

export const META_API_VERSION = 'v25.0';

const GRAPH_BASE = 'https://graph.facebook.com';

interface TokenExchangeResult {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface AdAccountInfo {
  id: string; // act_xxxxx
  name: string;
  account_status: number;
  currency: string;
}

/**
 * Exchange a short-lived token for a long-lived token (~60 days).
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string,
): Promise<TokenExchangeResult> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: process.env.META_APP_ID!,
    client_secret: process.env.META_APP_SECRET!,
    fb_exchange_token: shortLivedToken,
  });

  const res = await fetch(`${GRAPH_BASE}/${META_API_VERSION}/oauth/access_token?${params}`, {
    signal: AbortSignal.timeout(15_000),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? `Token exchange failed: ${res.status}`);
  }

  const data: TokenExchangeResult = await res.json();
  if (!data.access_token || typeof data.access_token !== 'string') {
    throw new Error('Token exchange returned invalid or missing access_token');
  }
  return data;
}

/**
 * Fetch all ad accounts the user has access to.
 * Queries personal accounts via `me/adaccounts` and also discovers accounts
 * through all business managers the user belongs to (owned + client accounts).
 */
export async function fetchAdAccounts(accessToken: string): Promise<AdAccountInfo[]> {
  const fields = 'id,name,account_status,currency';
  const seen = new Map<string, AdAccountInfo>();

  // 1. Personal ad accounts (me/adaccounts)
  const personalParams = new URLSearchParams({
    access_token: accessToken,
    fields,
    limit: '100',
  });

  const personalRes = await fetch(
    `${GRAPH_BASE}/${META_API_VERSION}/me/adaccounts?${personalParams}`,
    { signal: AbortSignal.timeout(15_000) },
  );

  if (personalRes.ok) {
    const personalData = await personalRes.json();
    for (const acct of personalData.data ?? []) {
      seen.set(acct.id, acct);
    }
  }

  // 2. Discover business managers the user belongs to
  const bizParams = new URLSearchParams({
    access_token: accessToken,
    fields: 'id,name',
    limit: '100',
  });

  const bizRes = await fetch(`${GRAPH_BASE}/${META_API_VERSION}/me/businesses?${bizParams}`, {
    signal: AbortSignal.timeout(15_000),
  });

  if (bizRes.ok) {
    const bizData = await bizRes.json();
    const businesses: { id: string }[] = bizData.data ?? [];

    // For each business, fetch owned and client ad accounts in parallel
    await Promise.all(
      businesses.map(async (biz) => {
        const endpoints = [
          `${GRAPH_BASE}/${META_API_VERSION}/${biz.id}/owned_ad_accounts`,
          `${GRAPH_BASE}/${META_API_VERSION}/${biz.id}/client_ad_accounts`,
        ];

        await Promise.all(
          endpoints.map(async (endpoint) => {
            const p = new URLSearchParams({
              access_token: accessToken,
              fields,
              limit: '100',
            });

            try {
              const r = await fetch(`${endpoint}?${p}`, { signal: AbortSignal.timeout(15_000) });
              if (r.ok) {
                const d = await r.json();
                for (const acct of d.data ?? []) {
                  if (!seen.has(acct.id)) {
                    seen.set(acct.id, acct);
                  }
                }
              }
            } catch {
              // Ignore individual business endpoint failures
            }
          }),
        );
      }),
    );
  }

  return Array.from(seen.values());
}

/**
 * Refresh a long-lived token (extend expiry).
 * Works only if the token has not expired yet.
 */
export async function refreshLongLivedToken(currentToken: string): Promise<TokenExchangeResult> {
  return exchangeForLongLivedToken(currentToken);
}

/**
 * Refresh an account's long-lived token if it expires within `withinDays`.
 * Non-throwing: catches errors, logs, and returns false.
 */
export async function refreshAccountTokenIfNeeded(
  accountId: string,
  withinDays = 7,
): Promise<boolean> {
  try {
    const [account] = await db
      .select({
        tokenExpiresAt: adAccounts.tokenExpiresAt,
        accessTokenEnc: adAccounts.accessTokenEnc,
      })
      .from(adAccounts)
      .where(eq(adAccounts.id, accountId))
      .limit(1);

    if (!account?.tokenExpiresAt) return false;

    const expiresAt = new Date(account.tokenExpiresAt).getTime();
    const threshold = Date.now() + withinDays * 24 * 60 * 60 * 1000;

    // Not within threshold or already expired
    if (expiresAt > threshold || expiresAt <= Date.now()) return false;

    const currentToken = decrypt(account.accessTokenEnc);
    const result = await exchangeForLongLivedToken(currentToken);
    const newExpiresAt = result.expires_in
      ? new Date(Date.now() + result.expires_in * 1000)
      : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    await db
      .update(adAccounts)
      .set({
        accessTokenEnc: encrypt(result.access_token),
        tokenExpiresAt: newExpiresAt,
      })
      .where(eq(adAccounts.id, accountId));

    console.log(
      `[meta-auth] Refreshed token for account ${accountId}, new expiry: ${newExpiresAt.toISOString()}`,
    );
    return true;
  } catch (err) {
    console.error(`[meta-auth] Token refresh failed for account ${accountId}:`, err);
    return false;
  }
}

// ── Ad-account connection ─────────────────────────────────────────────

export class AdAccountLimitError extends Error {
  constructor(plan: string) {
    super(`Your ${plan} plan has reached its ad account limit. Upgrade to add more.`);
    this.name = 'AdAccountLimitError';
  }
}

/**
 * Validate plan limits, encrypt token, and upsert an ad-account row.
 * Handles both new connections and reconnections (token refresh / reactivation).
 */
export async function connectAdAccount(opts: {
  userId: string;
  plan: string;
  metaAdAccountId: string;
  longLivedToken: string;
  expiresIn?: number;
  accountName: string;
}): Promise<{ accountId: string; reconnected: boolean }> {
  const { userId, plan, metaAdAccountId, longLivedToken, expiresIn, accountName } = opts;

  // Check for existing row first (reconnect bypasses limit check)
  const [existing] = await db
    .select({ id: adAccounts.id })
    .from(adAccounts)
    .where(and(eq(adAccounts.userId, userId), eq(adAccounts.metaAdAccountId, metaAdAccountId)))
    .limit(1);

  if (!existing) {
    // New connection — enforce plan limits
    const activeCount = await db
      .select({ id: adAccounts.id })
      .from(adAccounts)
      .where(and(eq(adAccounts.userId, userId), eq(adAccounts.isActive, true)));

    if (!canAddAccount(plan as Plan, activeCount.length)) {
      throw new AdAccountLimitError(plan);
    }
  }

  const tokenExpiresAt = expiresIn
    ? new Date(Date.now() + expiresIn * 1000)
    : new Date(Date.now() + 60 * 24 * 60 * 60 * 1000); // 60-day fallback

  const encryptedToken = encrypt(longLivedToken);

  if (existing) {
    await db
      .update(adAccounts)
      .set({
        accessTokenEnc: encryptedToken,
        tokenExpiresAt,
        metaAccountName: accountName,
        isActive: true,
      })
      .where(eq(adAccounts.id, existing.id));

    return { accountId: existing.id, reconnected: true };
  }

  const [newAccount] = await db
    .insert(adAccounts)
    .values({
      userId,
      metaAdAccountId,
      metaAccountName: accountName,
      accessTokenEnc: encryptedToken,
      tokenExpiresAt,
    })
    .returning({ id: adAccounts.id });

  return { accountId: newAccount.id, reconnected: false };
}
