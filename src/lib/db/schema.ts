import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  bigint,
  serial,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').unique().notNull(),
  name: text('name'),
  image: text('image'),
  stripeCustomerId: text('stripe_customer_id'),
  plan: text('plan').default('trial').notNull(), // trial, basic, pro, agency
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  bonusCalls: integer('bonus_calls').default(0).notNull(),
  isAdmin: boolean('is_admin').default(false).notNull(),
  // Daily performance monitor (cron) — see src/lib/monitor.ts
  alertsEnabled: boolean('alerts_enabled').default(false).notNull(),
  slackWebhookEnc: text('slack_webhook_enc'), // AES-256-GCM encrypted
  alertsLastRunAt: timestamp('alerts_last_run_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const adAccounts = pgTable('ad_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  metaAdAccountId: text('meta_ad_account_id').notNull(), // act_xxxxx
  metaAccountName: text('meta_account_name'),
  accessTokenEnc: text('access_token_enc').notNull(), // AES-256-GCM encrypted
  tokenExpiresAt: timestamp('token_expires_at', { withTimezone: true }),
  scopes: text('scopes'),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const conversations = pgTable('conversations', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  adAccountId: uuid('ad_account_id').references(() => adAccounts.id, { onDelete: 'set null' }),
  title: text('title'),
  /** Display history for the UI: { role, content, timestamp, toolCalls? }[] */
  messages: jsonb('messages').default([]).notNull(),
  /**
   * Full Anthropic API transcript (tool_use, tool_result, thinking, compaction
   * blocks). Append-only — never edit earlier entries, or thinking-block
   * binding and the prompt cache both break.
   */
  transcript: jsonb('transcript').default([]).notNull(),
  /** Legacy rolling summary from the <context> block era. Read-only now. */
  context: text('context'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usage = pgTable(
  'usage',
  {
    id: serial('id').primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    month: text('month').notNull(), // '2026-02'
    apiCalls: integer('api_calls').default(0).notNull(),
    inputTokens: bigint('input_tokens', { mode: 'number' }).default(0).notNull(),
    outputTokens: bigint('output_tokens', { mode: 'number' }).default(0).notNull(),
    estimatedCostCents: integer('estimated_cost_cents').default(0).notNull(),
  },
  (table) => [uniqueIndex('usage_user_month_idx').on(table.userId, table.month)],
);

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  keyHash: text('key_hash').unique().notNull(), // SHA-256
  label: text('label'),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const webhookEvents = pgTable('webhook_events', {
  id: text('id').primaryKey(), // Stripe event ID
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
});

/**
 * Every write Claude proposes. Writes never execute inside the chat loop:
 * they wait here as `pending` until the user approves them in the UI.
 * `before` holds a snapshot of the touched objects so the change can be undone.
 */
export const agentActions = pgTable(
  'agent_actions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    conversationId: uuid('conversation_id').references(() => conversations.id, {
      onDelete: 'set null',
    }),
    adAccountId: uuid('ad_account_id').references(() => adAccounts.id, { onDelete: 'cascade' }),
    metaAdAccountId: text('meta_ad_account_id').notNull(),
    toolName: text('tool_name').notNull(),
    toolUseId: text('tool_use_id'),
    input: jsonb('input').notNull(),
    summary: text('summary'),
    // pending | rejected | executed | failed | rolled_back | expired
    status: text('status').default('pending').notNull(),
    before: jsonb('before'),
    result: jsonb('result'),
    error: text('error'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    decidedAt: timestamp('decided_at', { withTimezone: true }),
    rolledBackAt: timestamp('rolled_back_at', { withTimezone: true }),
  },
  (table) => [index('agent_actions_user_idx').on(table.userId, table.createdAt)],
);

/** Files the user attached in chat. Bytes live in Vercel Blob (or inline in dev). */
export const attachments = pgTable('attachments', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  conversationId: uuid('conversation_id').references(() => conversations.id, {
    onDelete: 'cascade',
  }),
  name: text('name').notNull(),
  mediaType: text('media_type').notNull(),
  size: integer('size').notNull(),
  url: text('url'), // Vercel Blob URL
  dataBase64: text('data_base64'), // dev fallback only (no BLOB_READ_WRITE_TOKEN)
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

/** User-saved prompt templates ("playbooks"). Built-ins live in src/lib/playbooks.ts. */
export const playbooks = pgTable('playbooks', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull(),
  name: text('name').notNull(),
  prompt: text('prompt').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const waitlist = pgTable('waitlist', {
  id: serial('id').primaryKey(),
  email: text('email').unique().notNull(),
  source: text('source').default('early-access'), // tracks which page they signed up from
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});
