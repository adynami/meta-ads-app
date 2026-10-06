/**
 * Daily performance monitor.
 *
 * Deterministic (no LLM call, no credits): compares each campaign's
 * yesterday against its trailing 7-day average and posts anomalies to the
 * user's Slack incoming webhook. Triggered by Vercel Cron → /api/cron/monitor.
 */
import { and, eq, isNotNull } from 'drizzle-orm';
import { graphGetAll } from 'meta-mcp-server/utils/graph';
import { db } from '@/lib/db';
import { adAccounts, users } from '@/lib/db/schema';
import { decrypt } from '@/lib/crypto';
import { toTenant, type Tenant } from '@/lib/tenants';

/** Conversion action types, most valuable first. The first one present is used. */
const CONVERSION_TYPES = [
  'purchase',
  'offsite_conversion.fb_pixel_purchase',
  'lead',
  'offsite_conversion.fb_pixel_lead',
  'complete_registration',
  'offsite_conversion.fb_pixel_complete_registration',
];

const MIN_SPEND = 20; // account currency units; ignore tiny campaigns

export interface DayRow {
  campaign_id: string;
  campaign_name: string;
  date_start: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

export interface Anomaly {
  campaignId: string;
  campaignName: string;
  kind: 'spend_spike' | 'cpa_spike' | 'delivery_drop' | 'ctr_drop';
  detail: string;
}

export function conversionsOf(actions: Array<{ action_type: string; value: string }> | undefined) {
  if (!actions) return 0;
  for (const type of CONVERSION_TYPES) {
    const a = actions.find((x) => x.action_type === type);
    if (a) return Number(a.value) || 0;
  }
  return 0;
}

/** Pure anomaly rules over one campaign's daily rows (any order). */
export function detectAnomalies(rows: DayRow[], yesterday: string): Anomaly[] {
  const y = rows.find((r) => r.date_start === yesterday);
  const base = rows.filter((r) => r.date_start < yesterday);
  if (!y || base.length < 3) return [];

  const sum = (k: keyof DayRow) => base.reduce((s, r) => s + (r[k] as number), 0);
  const days = base.length;
  const avgSpend = sum('spend') / days;
  const baseConv = sum('conversions');
  const baseCpa = baseConv > 0 ? sum('spend') / baseConv : null;
  const baseCtr = sum('impressions') > 0 ? sum('clicks') / sum('impressions') : null;
  const yCpa = y.conversions > 0 ? y.spend / y.conversions : null;
  const yCtr = y.impressions > 0 ? y.clicks / y.impressions : null;

  const out: Anomaly[] = [];
  const push = (kind: Anomaly['kind'], detail: string) =>
    out.push({ campaignId: y.campaign_id, campaignName: y.campaign_name, kind, detail });
  const money = (n: number) => n.toFixed(2);

  if (y.spend >= MIN_SPEND && avgSpend > 0 && y.spend > 2 * avgSpend) {
    push('spend_spike', `spent ${money(y.spend)} vs ${money(avgSpend)}/day average`);
  }
  if (avgSpend >= MIN_SPEND && y.spend < 0.2 * avgSpend) {
    push('delivery_drop', `spent ${money(y.spend)} vs ${money(avgSpend)}/day average`);
  }
  if (baseCpa !== null && baseConv >= 3 && y.spend >= MIN_SPEND) {
    if (yCpa === null && y.spend > 2 * baseCpa) {
      push('cpa_spike', `spent ${money(y.spend)} with no conversions (avg CPA ${money(baseCpa)})`);
    } else if (yCpa !== null && yCpa > 1.5 * baseCpa) {
      push('cpa_spike', `CPA ${money(yCpa)} vs ${money(baseCpa)} average`);
    }
  }
  if (baseCtr !== null && yCtr !== null && y.impressions >= 1000 && yCtr < 0.6 * baseCtr) {
    push('ctr_drop', `CTR ${(yCtr * 100).toFixed(2)}% vs ${(baseCtr * 100).toFixed(2)}% average`);
  }
  return out;
}

async function accountAnomalies(
  tenant: Tenant,
): Promise<{ anomalies: Anomaly[]; currency: string }> {
  const { data } = await graphGetAll(
    tenant.ctx,
    `${tenant.metaAdAccountId}/insights`,
    {
      level: 'campaign',
      date_preset: 'last_7d', // ends yesterday
      time_increment: 1,
      fields: 'campaign_id,campaign_name,spend,impressions,clicks,actions,account_currency',
    },
    { maxRows: 2000 },
  );
  const rows: DayRow[] = data.map((r: any) => ({
    campaign_id: r.campaign_id,
    campaign_name: r.campaign_name,
    date_start: r.date_start,
    spend: Number(r.spend) || 0,
    impressions: Number(r.impressions) || 0,
    clicks: Number(r.clicks) || 0,
    conversions: conversionsOf(r.actions),
  }));
  const yesterday = rows.reduce((max, r) => (r.date_start > max ? r.date_start : max), '');
  const byCampaign = new Map<string, DayRow[]>();
  for (const r of rows)
    byCampaign.set(r.campaign_id, [...(byCampaign.get(r.campaign_id) ?? []), r]);
  const anomalies = [...byCampaign.values()].flatMap((rs) => detectAnomalies(rs, yesterday));
  return { anomalies, currency: data[0]?.account_currency ?? '' };
}

const KIND_LABEL: Record<Anomaly['kind'], string> = {
  spend_spike: 'Spend spike',
  cpa_spike: 'CPA up',
  delivery_drop: 'Delivery dropped',
  ctr_drop: 'CTR down',
};

export function formatSlackMessage(
  sections: { account: string; currency: string; anomalies: Anomaly[] }[],
  appUrl: string,
): { text: string } {
  const lines = ['*Adynami daily check* — yesterday vs the previous 6 days'];
  for (const s of sections) {
    lines.push(`\n*${s.account}*${s.currency ? ` (${s.currency})` : ''}`);
    for (const a of s.anomalies) {
      lines.push(`• ${KIND_LABEL[a.kind]}: _${a.campaignName}_ — ${a.detail}`);
    }
  }
  lines.push(`\n<${appUrl}/chat|Ask Adynami what happened>`);
  return { text: lines.join('\n') };
}

export function isValidSlackWebhook(url: string): boolean {
  try {
    const u = new URL(url);
    return (
      u.protocol === 'https:' &&
      u.hostname === 'hooks.slack.com' &&
      u.pathname.startsWith('/services/')
    );
  } catch {
    return false;
  }
}

/** Run the monitor for every opted-in user. Returns a per-user summary. */
export async function runDailyMonitor(): Promise<{
  users: number;
  alerts: number;
  errors: number;
}> {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://adynami.ai';
  const subscribers = await db
    .select()
    .from(users)
    .where(and(eq(users.alertsEnabled, true), isNotNull(users.slackWebhookEnc)));

  let alerts = 0;
  let errors = 0;
  for (const user of subscribers) {
    try {
      const accounts = await db
        .select()
        .from(adAccounts)
        .where(and(eq(adAccounts.userId, user.id), eq(adAccounts.isActive, true)));

      const sections: { account: string; currency: string; anomalies: Anomaly[] }[] = [];
      for (const account of accounts) {
        try {
          const tenant = toTenant(account);
          const { anomalies, currency } = await accountAnomalies(tenant);
          if (anomalies.length) sections.push({ account: tenant.name, currency, anomalies });
        } catch (err) {
          errors++;
          console.error(`[monitor] account ${account.metaAdAccountId} failed:`, err);
        }
      }

      if (sections.length) {
        const webhook = decrypt(user.slackWebhookEnc!);
        const res = await fetch(webhook, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formatSlackMessage(sections, appUrl)),
          signal: AbortSignal.timeout(10_000),
        });
        if (!res.ok) throw new Error(`Slack webhook HTTP ${res.status}`);
        alerts += sections.reduce((n, s) => n + s.anomalies.length, 0);
      }
      await db.update(users).set({ alertsLastRunAt: new Date() }).where(eq(users.id, user.id));
    } catch (err) {
      errors++;
      console.error(`[monitor] user ${user.id} failed:`, err);
    }
  }
  return { users: subscribers.length, alerts, errors };
}
