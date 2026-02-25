/**
 * Meta OAuth utilities — token exchange, long-lived tokens, ad account discovery.
 */

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
    `${GRAPH_BASE}/v25.0/oauth/access_token?${params}`,
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? `Token exchange failed: ${res.status}`);
  }

  return res.json();
}

/**
 * Fetch all ad accounts the user has access to.
 */
export async function fetchAdAccounts(
  accessToken: string,
): Promise<AdAccountInfo[]> {
  const params = new URLSearchParams({
    access_token: accessToken,
    fields: 'id,name,account_status,currency',
    limit: '100',
  });

  const res = await fetch(
    `${GRAPH_BASE}/v25.0/me/adaccounts?${params}`,
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? `Failed to fetch ad accounts: ${res.status}`);
  }

  const data = await res.json();
  return data.data ?? [];
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
