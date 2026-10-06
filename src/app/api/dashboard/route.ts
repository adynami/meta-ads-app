import { NextRequest } from 'next/server';
import { runTool, toolError } from '@/lib/tool-executor';
import { auth } from '@/lib/auth';
import { isTrialExpired } from '@/lib/plans';
import { devEnvTenant, getUserByEmail, loadTenants, type Tenant } from '@/lib/tenants';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    const body = await req.json();
    const { accountId, level, timeRange, statusFilter, limit, since, until } = body as {
      accountId: string;
      level: 'campaign' | 'adset' | 'ad';
      timeRange:
        | 'last_7d'
        | 'last_14d'
        | 'last_30d'
        | 'last_90d'
        | 'this_month'
        | 'last_month'
        | 'today'
        | 'yesterday'
        | 'custom';
      statusFilter?: string[];
      limit?: number;
      since?: string;
      until?: string;
    };

    if (!accountId || !level || !timeRange) {
      return Response.json(
        { error: 'accountId, level, and timeRange are required' },
        { status: 400 },
      );
    }

    let tenants: Tenant[];
    if (session?.user?.email) {
      const user = await getUserByEmail(session.user.email);
      if (!user) return Response.json({ error: 'User not found' }, { status: 404 });
      if (isTrialExpired(user.plan, user.trialEndsAt)) {
        return Response.json(
          { error: 'Your trial has expired. Please subscribe to continue.', code: 'TRIAL_EXPIRED' },
          { status: 403 },
        );
      }
      ({ tenants } = await loadTenants(user.id, accountId));
      if (tenants.length === 0) {
        return Response.json({ error: 'Ad account not found' }, { status: 400 });
      }
    } else {
      const dev = devEnvTenant();
      if (!dev) return Response.json({ error: 'Not authenticated' }, { status: 401 });
      tenants = [dev];
    }

    const results = await Promise.all(
      tenants.map((t) =>
        accountRows(t, { level, timeRange, statusFilter, limit, since, until }).then((rows) =>
          accountId === 'all' ? rows.map((r) => ({ account: t.name, ...r })) : rows,
        ),
      ),
    );
    return Response.json({ rows: results.flat() });
  } catch (error: any) {
    console.error('[dashboard/route] Error:', error);
    const status = error instanceof DashboardError ? 502 : 500;
    return Response.json({ error: error?.message ?? 'Internal server error' }, { status });
  }
}

class DashboardError extends Error {}

interface RowQuery {
  level: 'campaign' | 'adset' | 'ad';
  timeRange: string;
  statusFilter?: string[];
  limit?: number;
  since?: string;
  until?: string;
}

/** Entities merged with their insights for one ad account. */
async function accountRows(
  tenant: Tenant,
  { level, timeRange, statusFilter, limit, since, until }: RowQuery,
): Promise<any[]> {
  const ctx = tenant.ctx;
  // Build tool args
  const entityLimit = limit ?? 50;

  const listToolName =
    level === 'campaign'
      ? 'meta_list_campaigns'
      : level === 'adset'
        ? 'meta_list_adsets'
        : 'meta_list_ads';

  const listArgs: Record<string, any> = {
    limit: entityLimit,
    response_format: 'detailed',
  };
  if (statusFilter?.length) {
    listArgs.status_filter = statusFilter;
  }

  const insightsArgs: Record<string, any> = {
    level,
    time_range: timeRange,
    limit: 25,
    response_format: 'detailed',
  };
  if (timeRange === 'custom' && since && until) {
    insightsArgs.since = since;
    insightsArgs.until = until;
  }

  // Raw (uncompacted) results: the dashboard needs every row.
  const [entities, insights] = await Promise.all([
    runTool(ctx, listToolName, listArgs).catch((e) => {
      throw new DashboardError(toolError(e).error);
    }),
    runTool(ctx, 'meta_get_insights', insightsArgs).catch((e) => toolError(e)),
  ]);

  // Build entity map by name
  const entityList: any[] = entities.campaigns ?? entities.adsets ?? entities.ads ?? [];

  const entityMap = new Map<string, any>();
  for (const e of entityList) {
    entityMap.set(e.name, e);
  }

  // Normalize insights to array and filter out "Account" fallback rows
  const insightRows: any[] = (
    Array.isArray(insights) ? insights : insights.error ? [] : [insights]
  ).filter((row: any) => row.name && row.name !== 'Account');

  // Merge: enrich insight rows with entity metadata
  const rows = insightRows.map((row: any) => {
    const entity = entityMap.get(row.name);
    return {
      name: row.name ?? '—',
      campaign_name: row.campaign_name ?? null,
      adset_name: row.adset_name ?? null,
      id: entity?.id ?? null,
      status: entity?.status ?? null,
      objective: entity?.objective ?? null,
      daily_budget: entity?.daily_budget ?? entity?.lifetime_budget ?? null,
      spend: row.spend ?? 0,
      impressions: row.impressions ?? 0,
      clicks: row.clicks ?? 0,
      ctr: row.ctr ?? 0,
      cpc: row.cpc ?? 0,
      cpm: row.cpm ?? 0,
      conversions: row.conversions ?? 0,
      conversion_breakdown: row.conversion_breakdown ?? null,
      cpa: row.cpa ?? 0,
      roas: row.roas ?? 0,
    };
  });

  // Also add entities that had no insights data
  for (const e of entityList) {
    if (!insightRows.some((r: any) => r.name === e.name)) {
      rows.push({
        name: e.name,
        campaign_name: null,
        adset_name: null,
        id: e.id,
        status: e.status,
        objective: e.objective ?? null,
        daily_budget: e.daily_budget ?? e.lifetime_budget ?? null,
        spend: 0,
        impressions: 0,
        clicks: 0,
        ctr: 0,
        cpc: 0,
        cpm: 0,
        conversions: 0,
        conversion_breakdown: null,
        cpa: 0,
        roas: 0,
      });
    }
  }

  return rows;
}
