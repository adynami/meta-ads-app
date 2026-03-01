/**
 * Meta OAuth utilities — token exchange, long-lived tokens, ad account discovery.
 */

export const META_API_VERSION = 'v25.0';

const GRAPH_BASE = 'https://graph.facebook.com';

interface TokenExchangeResult {
  access_token: string;
  token_type: string;
  expires_in?: number;
}

interface AdAccountInfo {
  id: string;       // act_xxxxx
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

  const res = await fetch(
    `${GRAPH_BASE}/${META_API_VERSION}/oauth/access_token?${params}`,
    { signal: AbortSignal.timeout(15_000) },
  );

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
export async function fetchAdAccounts(
  accessToken: string,
): Promise<AdAccountInfo[]> {
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

  const bizRes = await fetch(
    `${GRAPH_BASE}/${META_API_VERSION}/me/businesses?${bizParams}`,
    { signal: AbortSignal.timeout(15_000) },
  );

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
export async function refreshLongLivedToken(
  currentToken: string,
): Promise<TokenExchangeResult> {
  return exchangeForLongLivedToken(currentToken);
}
