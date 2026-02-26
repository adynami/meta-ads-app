import { NextRequest } from 'next/server';
import { executeTool } from '@/lib/tool-executor';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { users, adAccounts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { decrypt } from '@/lib/crypto';
import { isTrialExpired } from '@/lib/plans';
import type { TenantContext } from 'meta-mcp-server/tenant-context';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();

    const body = await req.json();
    const { accountId, level, timeRange, statusFilter, limit } = body as {
      accountId: string;
      level: 'campaign' | 'adset' | 'ad';
      timeRange: 'last_7d' | 'last_14d' | 'last_30d' | 'last_90d' | 'this_month' | 'last_month';
      statusFilter?: string[];
      limit?: number;
    };

    if (!accountId || !level || !timeRange) {
      return Response.json({ error: 'accountId, level, and timeRange are required' }, { status: 400 });
    }

    if (accountId === 'all') {
      return Response.json({ error: 'Dashboard does not support "All Accounts" mode' }, { status: 400 });
    }

    let ctx: TenantContext;

    if (session?.user?.email) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.email, session.user.email))
        .limit(1);

      if (!user) {
        return Response.json({ error: 'User not found' }, { status: 404 });
      }

      if (isTrialExpired(user.plan, user.trialEndsAt)) {
        return Response.json({
          error: 'Your trial has expired. Please subscribe to continue.',
          code: 'TRIAL_EXPIRED',
        }, { status: 403 });
      }

      const [account] = await db
        .select()
        .from(adAccounts)
        .where(
          and(
            eq(adAccounts.userId, user.id),
            eq(adAccounts.id, accountId),
            eq(adAccounts.isActive, true),
          ),
        )
        .limit(1);

      if (!account) {
        return Response.json({ error: 'Ad account not found' }, { status: 400 });
      }

      ctx = {
        accessToken: decrypt(account.accessTokenEnc),
        adAccountId: account.metaAdAccountId,
        apiVersion: 'v25.0',
        dryRun: false,
      };
    } else {
      // Fallback: env var credentials (dev/demo mode)
      const envToken = process.env.META_ACCESS_TOKEN;
      const envAccount = process.env.META_AD_ACCOUNT_ID;

      if (!envToken || !envAccount) {
        return Response.json({ error: 'Not authenticated' }, { status: 401 });
      }

      ctx = {
        accessToken: envToken,
        adAccountId: envAccount,
        apiVersion: process.env.META_API_VERSION ?? 'v25.0',
        dryRun: process.env.DRY_RUN === 'true',
      };
    }

    // Build tool args
    const entityLimit = limit ?? 50;

    const listToolName =
      level === 'campaign' ? 'meta_list_campaigns'
        : level === 'adset' ? 'meta_list_adsets'
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

    // Execute both tools in parallel
    const [entitiesRaw, insightsRaw] = await Promise.all([
      executeTool(ctx, listToolName, listArgs),
      executeTool(ctx, 'meta_get_insights', insightsArgs),
    ]);

    const entities = JSON.parse(entitiesRaw);
    const insights = JSON.parse(insightsRaw);

    if (entities.error) {
      return Response.json({ error: entities.error }, { status: 502 });
    }

    // Build entity map by name
    const entityList: any[] =
      entities.campaigns ?? entities.adsets ?? entities.ads ?? [];

    const entityMap = new Map<string, any>();
    for (const e of entityList) {
      entityMap.set(e.name, e);
    }

    // Normalize insights to array
    const insightRows: any[] = Array.isArray(insights)
      ? insights
      : insights.error
        ? []
        : [insights];

    // Merge: enrich insight rows with entity metadata
    const rows = insightRows.map((row: any) => {
      const entity = entityMap.get(row.name);
      return {
        name: row.name ?? '—',
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
        cpa: row.cpa ?? 0,
        roas: row.roas ?? 0,
      };
    });

    // Also add entities that had no insights data
    for (const e of entityList) {
      if (!insightRows.some((r: any) => r.name === e.name)) {
        rows.push({
          name: e.name,
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
          cpa: 0,
          roas: 0,
        });
      }
    }

    return Response.json({ rows });
  } catch (error: any) {
    console.error('[dashboard/route] Error:', error);
    return Response.json(
      { error: error?.message ?? 'Internal server error' },
      { status: 500 },
    );
  }
}
