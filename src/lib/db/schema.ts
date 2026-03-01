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
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const adAccounts = pgTable('ad_accounts', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
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
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  adAccountId: uuid('ad_account_id').references(() => adAccounts.id, { onDelete: 'set null' }),
  title: text('title'),
  messages: jsonb('messages').default([]).notNull(),
  context: text('context'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
});

export const usage = pgTable('usage', {
  id: serial('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  month: text('month').notNull(), // '2026-02'
  apiCalls: integer('api_calls').default(0).notNull(),
  inputTokens: bigint('input_tokens', { mode: 'number' }).default(0).notNull(),
  outputTokens: bigint('output_tokens', { mode: 'number' }).default(0).notNull(),
  estimatedCostCents: integer('estimated_cost_cents').default(0).notNull(),
}, (table) => [
  uniqueIndex('usage_user_month_idx').on(table.userId, table.month),
]);

export const apiKeys = pgTable('api_keys', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
  keyHash: text('key_hash').unique().notNull(), // SHA-256
  label: text('label'),
  lastUsedAt: timestamp('last_used_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const webhookEvents = pgTable('webhook_events', {
  id: text('id').primaryKey(), // Stripe event ID
  processedAt: timestamp('processed_at', { withTimezone: true }).defaultNow().notNull(),
});
