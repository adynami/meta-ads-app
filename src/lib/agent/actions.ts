/**
 * Write approvals + undo.
 *
 * Claude never mutates an ad account directly. A write tool call becomes an
 * `agent_actions` row in `pending` state; the user approves (or rejects) it
 * in the UI. On approval we snapshot the objects the call will touch, run
 * the tool, and keep the snapshot so the change can be rolled back.
 */
import { and, eq, sql } from 'drizzle-orm';
import { graphGet, graphPost } from 'meta-mcp-server/utils/graph';
import type { TenantContext } from 'meta-mcp-server/tenant-context';
import { db } from '@/lib/db';
import { adAccounts, agentActions, conversations } from '@/lib/db/schema';
import { runTool, toolError } from '@/lib/tool-executor';
import { devEnvTenant, toTenant, type Tenant } from '@/lib/tenants';
import { loadAttachmentStore } from '@/lib/attachment-store';

export type ActionRow = typeof agentActions.$inferSelect;

/** Pending actions older than this can no longer be approved. */
const PENDING_TTL_MS = 24 * 60 * 60 * 1000;

/** Writes that run immediately without approval (they only add media to the library). */
export const APPROVAL_EXEMPT = new Set(['meta_upload_image', 'meta_upload_video']);

// ── Snapshot specs: which objects a tool touches and how to restore them ──

interface Target {
  id: string;
  fields: string[];
}

const CAMPAIGN_FIELDS = ['name', 'status', 'daily_budget', 'lifetime_budget', 'bid_strategy'];
const ADSET_FIELDS = [
  'name',
  'status',
  'daily_budget',
  'lifetime_budget',
  'bid_strategy',
  'bid_amount',
  'end_time',
  'targeting',
];
const AD_FIELDS = ['name', 'status'];

/** Objects whose current state we capture before a reversible update. */
export function snapshotTargets(toolName: string, input: Record<string, any>): Target[] | null {
  switch (toolName) {
    case 'meta_update_campaign':
      return [{ id: input.campaign_id, fields: CAMPAIGN_FIELDS }];
    case 'meta_update_campaign_status':
      return [{ id: input.campaign_id, fields: ['status'] }];
    case 'meta_update_adset':
      return [{ id: input.adset_id, fields: ADSET_FIELDS }];
    case 'meta_update_ad':
      return [{ id: input.ad_id, fields: AD_FIELDS }];
    case 'meta_bulk_update_status':
      return (input.ids ?? []).map((id: string) => ({ id, fields: ['status'] }));
    default:
      return null;
  }
}

/** Tools whose undo is "pause what was created". */
const CREATE_TOOLS = new Set([
  'meta_deploy_campaign',
  'meta_deploy_dco_campaign',
  'meta_duplicate_campaign',
  'meta_duplicate_adset',
  'meta_add_ad',
]);

/** IDs of newly created delivery objects, most specific top-level object first. */
export function createdObjectIds(toolName: string, result: any): string[] {
  if (!result || typeof result !== 'object') return [];
  if (toolName === 'meta_duplicate_campaign') return [result.new_campaign_id].filter(Boolean);
  if (toolName === 'meta_duplicate_adset') return [result.new_adset_id].filter(Boolean);
  if (toolName === 'meta_add_ad') return [result.ad_id ?? result.id].filter(Boolean);
  // deploy: if injected into an existing campaign, never pause that campaign.
  if (result.injected) return [result.adset_id].filter(Boolean);
  return [result.campaign_id ?? result.adset_id].filter(Boolean);
}

export function isReversible(toolName: string): boolean {
  return snapshotTargets(toolName, {}) !== null || CREATE_TOOLS.has(toolName);
}

/** One-line human summary of a proposed write, for the approval card. */
export function summarizeAction(toolName: string, input: Record<string, any>): string {
  const label = toolName.replace(/^meta_/, '').replaceAll('_', ' ');
  const parts = Object.entries(input)
    .filter(([, v]) => v !== undefined && v !== null && typeof v !== 'object')
    .slice(0, 6)
    .map(([k, v]) => `${k}=${String(v).slice(0, 60)}`);
  const arrays = Object.entries(input)
    .filter(([, v]) => Array.isArray(v))
    .map(([k, v]) => `${k}: ${(v as unknown[]).length} item(s)`);
  return [label, [...parts, ...arrays].join(', ')].filter(Boolean).join(' — ');
}

// ── Lifecycle ─────────────────────────────────────────────────────────────

export interface ActionView {
  id: string;
  toolName: string;
  summary: string;
  input: Record<string, unknown>;
  status: string;
  reversible: boolean;
  metaAdAccountId: string;
  result?: unknown;
  error?: string | null;
  createdAt: string;
}

export function toView(row: ActionRow): ActionView {
  return {
    id: row.id,
    toolName: row.toolName,
    summary: row.summary ?? row.toolName,
    input: row.input as Record<string, unknown>,
    status: row.status,
    reversible: isReversible(row.toolName),
    metaAdAccountId: row.metaAdAccountId,
    result: row.result ?? undefined,
    error: row.error,
    createdAt: row.createdAt.toISOString(),
  };
}

export async function proposeAction(opts: {
  userId: string;
  conversationId: string | null;
  tenant: Tenant;
  toolName: string;
  toolUseId: string;
  input: Record<string, any>;
}): Promise<ActionRow> {
  const [row] = await db
    .insert(agentActions)
    .values({
      userId: opts.userId,
      conversationId: opts.conversationId,
      adAccountId: opts.tenant.id === 'dev' ? null : opts.tenant.id,
      metaAdAccountId: opts.tenant.metaAdAccountId,
      toolName: opts.toolName,
      toolUseId: opts.toolUseId,
      input: opts.input,
      summary: summarizeAction(opts.toolName, opts.input),
    })
    .returning();
  return row;
}

async function tenantFor(action: ActionRow): Promise<Tenant> {
  if (!action.adAccountId) {
    const dev = devEnvTenant();
    if (!dev) throw new Error('Ad account for this action no longer exists');
    return dev;
  }
  const [account] = await db
    .select()
    .from(adAccounts)
    .where(and(eq(adAccounts.id, action.adAccountId), eq(adAccounts.userId, action.userId)))
    .limit(1);
  if (!account || !account.isActive) throw new Error('Ad account is no longer connected');
  return toTenant(account);
}

async function snapshot(ctx: TenantContext, targets: Target[]): Promise<Record<string, any>> {
  const out: Record<string, any> = {};
  await Promise.all(
    targets.map(async (t) => {
      out[t.id] = await graphGet(ctx, t.id, { fields: t.fields.join(',') });
    }),
  );
  return out;
}

/**
 * Claim a pending action atomically so double-clicks or two tabs can't run
 * the same write twice.
 */
async function claim(actionId: string, userId: string, to: string): Promise<ActionRow | null> {
  const [row] = await db
    .update(agentActions)
    .set({ status: to, decidedAt: new Date() })
    .where(
      and(
        eq(agentActions.id, actionId),
        eq(agentActions.userId, userId),
        eq(agentActions.status, 'pending'),
      ),
    )
    .returning();
  return row ?? null;
}

export async function getAction(actionId: string, userId: string): Promise<ActionRow | null> {
  const [row] = await db
    .select()
    .from(agentActions)
    .where(and(eq(agentActions.id, actionId), eq(agentActions.userId, userId)))
    .limit(1);
  return row ?? null;
}

export async function approveAction(actionId: string, userId: string): Promise<ActionRow> {
  const existing = await getAction(actionId, userId);
  if (!existing) throw new ActionError('Action not found', 404);
  if (existing.status !== 'pending')
    throw new ActionError(`Action is already ${existing.status}`, 409);
  if (Date.now() - existing.createdAt.getTime() > PENDING_TTL_MS) {
    await claim(actionId, userId, 'expired');
    throw new ActionError('This proposal expired. Ask again to get a fresh one.', 410);
  }

  const action = await claim(actionId, userId, 'executing');
  if (!action) throw new ActionError('Action was already handled', 409);

  let before: Record<string, any> | null = null;
  try {
    const tenant = await tenantFor(action);
    const input = action.input as Record<string, any>;
    const targets = snapshotTargets(action.toolName, input);
    if (targets?.length) before = await snapshot(tenant.ctx, targets);

    const store = action.conversationId
      ? await loadAttachmentStore(userId, action.conversationId)
      : new Map();
    const result = await runTool(tenant.ctx, action.toolName, input, store);

    const [done] = await db
      .update(agentActions)
      .set({ status: 'executed', before, result })
      .where(eq(agentActions.id, actionId))
      .returning();
    await appendApprovalNote(done, `was approved and executed. Result: ${clip(result)}`);
    return done;
  } catch (err) {
    const { error } = toolError(err);
    const [failed] = await db
      .update(agentActions)
      .set({ status: 'failed', before, error })
      .where(eq(agentActions.id, actionId))
      .returning();
    await appendApprovalNote(failed, `was approved but FAILED: ${error}`);
    return failed;
  }
}

export async function rejectAction(actionId: string, userId: string): Promise<ActionRow> {
  const row = await claim(actionId, userId, 'rejected');
  if (!row) throw new ActionError('Action is not pending', 409);
  await appendApprovalNote(row, 'was rejected by the user. Do not retry it unless asked.');
  return row;
}

export async function rollbackAction(actionId: string, userId: string): Promise<ActionRow> {
  // Claim executed → rolling_back atomically.
  const [action] = await db
    .update(agentActions)
    .set({ status: 'rolling_back' })
    .where(
      and(
        eq(agentActions.id, actionId),
        eq(agentActions.userId, userId),
        eq(agentActions.status, 'executed'),
      ),
    )
    .returning();
  if (!action) throw new ActionError('Only executed actions can be undone', 409);
  if (!isReversible(action.toolName)) {
    await db.update(agentActions).set({ status: 'executed' }).where(eq(agentActions.id, actionId));
    throw new ActionError('This kind of change cannot be undone automatically', 400);
  }

  try {
    const tenant = await tenantFor(action);
    const input = action.input as Record<string, any>;

    if (action.before) {
      const touched = new Set(Object.keys(input));
      for (const [id, prev] of Object.entries(action.before as Record<string, any>)) {
        const restore: Record<string, any> = {};
        for (const [k, v] of Object.entries(prev)) {
          // Restore only the fields this action set (budgets come back in
          // minor units from the GET, which is what the POST expects).
          if (k !== 'id' && touched.has(k)) restore[k] = v;
        }
        if (Object.keys(restore).length) await graphPost(tenant.ctx, id, restore);
      }
    } else {
      for (const id of createdObjectIds(action.toolName, action.result)) {
        await graphPost(tenant.ctx, id, { status: 'PAUSED' });
      }
    }

    const [done] = await db
      .update(agentActions)
      .set({ status: 'rolled_back', rolledBackAt: new Date() })
      .where(eq(agentActions.id, actionId))
      .returning();
    await appendApprovalNote(
      done,
      action.before
        ? 'was undone by the user; the previous values were restored.'
        : 'was undone by the user; the objects it created were paused.',
    );
    return done;
  } catch (err) {
    await db.update(agentActions).set({ status: 'executed' }).where(eq(agentActions.id, actionId));
    throw new ActionError(`Undo failed: ${toolError(err).error}`, 502);
  }
}

export class ActionError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

function clip(v: unknown, max = 1500): string {
  const s = JSON.stringify(v) ?? '';
  return s.length > max ? `${s.slice(0, max)}…` : s;
}

/**
 * Tell the model what happened to its proposal. Appended (never inserted) to
 * the transcript as a user message; the next user turn merges with it.
 */
async function appendApprovalNote(action: ActionRow, what: string): Promise<void> {
  if (!action.conversationId) return;
  const note = {
    role: 'user',
    content: [
      {
        type: 'text',
        text: `[Approval update] Proposed action ${action.id} (${action.summary ?? action.toolName}) ${what}`,
      },
    ],
  };
  await db
    .update(conversations)
    .set({ transcript: sql`${conversations.transcript} || ${JSON.stringify([note])}::jsonb` })
    .where(eq(conversations.id, action.conversationId));
}
