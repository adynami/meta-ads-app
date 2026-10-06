# meta-ads-app

Conversational AI for Meta Ads management. Users chat with Claude to manage campaigns, audiences, creatives, and analytics across their Meta ad accounts using 75 Meta tools. Every account change is proposed by the agent and executed only after the user approves it.

**Stack**: Next.js 16, React 19, TypeScript, Drizzle ORM + Neon Postgres, Anthropic SDK, Stripe, NextAuth v5 (beta)
**Monorepo**: root app + `packages/meta-mcp-server` (local workspace dependency)

## Deployment

- **GitHub**: `https://github.com/adynami/meta-ads-app` (private, org: adynami)
- **Git push workaround**: `GH_TOKEN=$(gh auth token) git push https://aaronyarm:$(gh auth token)@github.com/adynami/meta-ads-app.git main`
- **Vercel team**: adynami
- **Vercel project**: meta-ads-app
- **Production domain**: adynami.ai

## Dev Commands

```bash
# App
npm run dev          # next dev --webpack (auto-builds MCP server via predev)
npm run build        # next build --webpack
npm run lint         # eslint
npm run format       # prettier --write
npm run format:check # prettier --check
npm test             # vitest run
npm run test:watch   # vitest (watch mode)

# Database
npx drizzle-kit push       # push schema to Neon
npx drizzle-kit generate   # generate migration files

# MCP server (must build before app can import; predev handles this automatically)
cd packages/meta-mcp-server
npm run build        # rm -rf dist && tsc
npm run dev          # tsx src/index.ts (stdio mode)
```

**CI:** GitHub Actions runs format:check → lint → typecheck → test → build on push/PR to main.

## Architecture

### Chat flow
`ChatWindow.tsx` sends ONLY the new message (+ conversationId, accountId, attachment refs) -> `POST /api/chat` -> `lib/chat.ts` (auth, trial, tenants, atomic credit reservation) -> `lib/agent/engine.ts` `runAgentTurn` (single streaming loop, max 12 rounds, per-turn cost cap) -> `tool-executor.ts` -> Meta Marketing API. History is loaded server-side from `conversations.transcript`; the client never supplies it.

### Agent (`src/lib/agent/`)
- `config.ts` — model (`CHAT_MODEL`, default `claude-opus-5-5`), effort, round/cost/token limits, betas. One model + one effort per conversation on purpose: changing either between requests breaks the prompt cache.
- `prompt.ts` — stable system prompt (cache prefix) + per-conversation account scope block.
- `tools.ts` — tool list: BM25 tool search + 5 core tools loaded; everything else `defer_loading`. Must be deterministic per conversation.
- `engine.ts` — the loop. Reads run immediately; writes become proposals (see below). Adaptive thinking, server-side compaction, `fallbacks: 'default'`, task budget.
- `actions.ts` — write approvals: propose -> user approves in UI (`POST /api/actions/:id`) -> snapshot -> execute -> undo (`decision: 'undo'`). Approval outcomes are appended to the transcript as `[Approval update]` user messages.
- `compact-result.ts` — every tool result is cleaned and size-capped before entering context.
- `conversation.ts` — append-only transcript + display-message persistence.

### Transcript rules (important)
`conversations.transcript` is the exact API message history including thinking, compaction and tool blocks. **Append only — never edit or delete earlier entries.** Thinking blocks are bound to the exact prefix that produced them (preserved thinking); edits cause 400s on new accounts and break the prompt cache. `conversations.messages` is a separate, trimmed display copy for the UI. Approvals are disabled in the UI while a reply streams so approval notes can't land mid-turn.

### Read/write policy
`lib/tool-policy.ts` classifies every tool as READ or WRITE (unknown = write). A test fails if any tool is unclassified. Writes never run inside the chat loop except `meta_upload_image/video` (`APPROVAL_EXEMPT`). In multi-account mode reads fan out to all accounts; writes must carry `target_account_id`.

### Auth flow
Meta OAuth (`/api/auth/[...nextauth]`) -> short-lived token -> `exchangeForLongLivedToken()` (~60 days) -> AES-256-GCM encrypt -> store in `ad_accounts.access_token_enc`. `lib/tenants.ts` decrypts into a `TenantContext` with `appsecret_proof`. All Graph calls go through `metaFetch` (`packages/meta-mcp-server/src/utils/graph.ts`): token in the Authorization header, per-ad-account throttling from usage headers, `graphGetAll` pagination.

### Billing / credits
Stripe Checkout (`/api/billing/checkout`) -> webhook (`/api/billing/webhook`) -> update `users.plan` + `bonusCalls`. Each turn reserves 1 credit BEFORE running via `lib/credits.ts` (single conditional SQL statements — no check-then-act race); refunded if the turn fails or the model produced nothing.

### Attachments
Browser uploads directly to Vercel Blob (`/api/attachments/upload` issues a client token scoped to `attachments/<userId>/`); chat receives only `{url,name,media_type,size}`, validated by `isTrustedBlobUrl`. Rows persist in `attachments`, so later turns can still upload them to Meta. Without `BLOB_READ_WRITE_TOKEN` (dev) small images go inline.

### Multi-account mode
`accountId === 'all'`: read tools run against every connected account and results are labeled by account; write tools require `target_account_id`. Conversations in this mode have `adAccountId = null`. The dashboard also supports it (adds an Account column).

### Daily alerts
Vercel Cron (`vercel.json`, 07:00 UTC) -> `/api/cron/monitor` (Bearer `CRON_SECRET`) -> `lib/monitor.ts`: deterministic yesterday-vs-7-day checks per campaign (spend spike, CPA up, CTR down, delivery drop) -> user's Slack webhook (encrypted in `users.slack_webhook_enc`). No LLM, no credits.

### Playbooks
Built-ins in `lib/playbooks.ts`, user-saved in the `playbooks` table, run from the book icon in the chat input.

## Directory Map

```
src/
├── app/
│   ├── (app)/              # Authenticated layout group (admin, billing, settings)
│   ├── api/
│   │   ├── auth/           # NextAuth + Meta OAuth connect
│   │   ├── billing/        # Stripe checkout, portal, webhook
│   │   ├── chat/route.ts   # Main chat endpoint (thin controller, delegates to lib/chat.ts)
│   │   ├── keys/route.ts   # API key CRUD (Agency plan)
│   │   ├── accounts/       # Ad account management
│   │   ├── conversations/  # Conversation history
│   │   ├── dashboard/      # Dashboard data
│   │   └── admin/          # Admin user management
│   ├── chat/page.tsx       # Main chat page
│   ├── login/, onboarding/, docs/, about/, privacy/, terms/
│   └── layout.tsx          # Root layout
├── components/
│   ├── chat/               # ChatWindow, MessageBubble, ToolCallCard
│   ├── dashboard/          # DashboardPanel, DashboardTable, DashboardToolbar
│   ├── errors/             # NoAccount, TokenExpired, TrialExpired
│   └── ui/                 # shadcn/ui components
├── lib/
│   ├── anthropic.ts        # Anthropic client init
│   ├── auth.ts             # NextAuth config (Meta OAuth provider)
│   ├── agent/              # engine, prompt, tools, actions (approvals/undo), compaction, persistence
│   ├── chat.ts             # Chat request orchestration (auth, credits, tenants, SSE)
│   ├── credits.ts          # Atomic credit reservation / refund
│   ├── tenants.ts          # Ad account -> TenantContext (+ appsecret_proof), dev env tenant
│   ├── tool-policy.ts      # READ/WRITE classification for every tool
│   ├── attachment-store.ts # Blob attachment validation + persistence
│   ├── monitor.ts          # Daily anomaly checks -> Slack
│   ├── playbooks.ts        # Built-in playbooks
│   ├── crypto.ts           # AES-256-GCM encrypt/decrypt
│   ├── db/                 # Drizzle client + schema
│   ├── meta-auth.ts        # Token exchange, ad account discovery, META_API_VERSION
│   ├── plans.ts            # Plan limits, trial expiry check
│   ├── stripe.ts           # Stripe client
│   ├── tool-executor.ts    # Bridge: Claude tool_use -> MCP handlers
│   ├── tools-schema.ts     # McpToolDef type
│   └── attachments.ts      # Attachment type helpers
├── middleware.ts            # Auth middleware
└── types/next-auth.d.ts    # Session type augmentation

packages/meta-mcp-server/
├── src/
│   ├── tools/              # 20 tool categories (76+ tools total)
│   ├── exports.ts          # Re-exports all tool categories
│   ├── tenant-context.ts   # Per-user API context type
│   ├── meta-client.ts      # Meta API HTTP client
│   ├── config.ts           # MCP server config
│   └── index.ts            # stdio MCP server entrypoint
└── dist/                   # Built output (must exist for app imports)
```

## Database Schema (Neon Postgres)

Tables in `src/lib/db/schema.ts` (hand-written migrations in `drizzle/`, latest `0004_agent_v2.sql`):

| Table | Key columns | Notes |
|---|---|---|
| `users` | id (uuid), email, plan, trialEndsAt, bonusCalls, isAdmin | plan: trial/basic/pro/agency |
| `ad_accounts` | userId (FK), metaAdAccountId, accessTokenEnc, isActive | Token is AES-256-GCM encrypted |
| `conversations` | userId (FK), adAccountId (FK), messages (jsonb), context | Messages array + extracted context |
| `usage` | userId (FK), month, apiCalls, inputTokens, outputTokens | Unique on (userId, month) |
| `api_keys` | userId (FK), keyHash (SHA-256), label | Agency plan only |
| `webhook_events` | id (text PK = Stripe event ID), processedAt | Idempotency dedup for webhooks |
| `agent_actions` | userId, conversationId, adAccountId, toolName, input, status, before, result | Write approvals + undo log |
| `attachments` | userId, conversationId, url (Blob) / dataBase64 (dev) | Chat attachments |
| `playbooks` | userId, name, prompt | User-saved prompt templates |

`conversations` also has `transcript` (jsonb, append-only API history). `users` also has `alertsEnabled`, `slackWebhookEnc`, `alertsLastRunAt`.

All child table FKs use `onDelete: 'cascade'` except `conversations.adAccountId` which uses `onDelete: 'set null'`.

## Conventions

- **Imports**: `@/*` maps to `./src/*`
- **API routes**: Use `Response.json()`, call `await auth()` at top for session
- **Single-row queries**: `const [result] = await db.select()...limit(1)`
- **UI**: shadcn/ui (new-york style), dark theme, lucide-react icons
- **MCP tool registration**: Add tool file in `packages/meta-mcp-server/src/tools/`, export from `exports.ts`, register handler in `tool-executor.ts`, and classify it in `lib/tool-policy.ts` (READ or WRITE). If it's a reversible write, add a snapshot spec in `lib/agent/actions.ts`.
- **Meta HTTP calls**: always via `metaFetch`/`graphGet`/`graphGetAll`/`graphPost` — never raw `fetch` to graph.facebook.com.
- **Rate limiting**: `await rateLimit(...)` (Upstash in prod, in-memory fallback in dev/tests).
- **Meta API version**: Single constant `META_API_VERSION` in `src/lib/meta-auth.ts` — update there only
- **Commits**: Imperative present tense, descriptive
- **Removals**: When intentionally removing a feature, route, component, or pattern, document it in the "Deliberately Removed" section below with a brief reason. Always check that section before building something that sounds like it may have existed before.

## Environment Variables

### Required
```
DATABASE_URL=              # Neon Postgres connection string
AUTH_SECRET=               # openssl rand -base64 32
ENCRYPTION_KEY=            # openssl rand -hex 32
META_APP_ID=               # Meta developer app ID
META_APP_SECRET=           # Meta developer app secret
ANTHROPIC_API_KEY=         # Anthropic API key
STRIPE_SECRET_KEY=         # Stripe secret key
STRIPE_WEBHOOK_SECRET=     # Stripe webhook signing secret
NEXT_PUBLIC_STRIPE_BASIC_PRICE_ID=
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=
NEXT_PUBLIC_STRIPE_AGENCY_PRICE_ID=
STRIPE_CREDIT_PACK_12_PRICE_ID=
STRIPE_CREDIT_PACK_45_PRICE_ID=
STRIPE_CREDIT_PACK_120_PRICE_ID=
```

### Required in production (new)
```
UPSTASH_REDIS_REST_URL=    # Shared rate limiting across serverless instances
UPSTASH_REDIS_REST_TOKEN=
BLOB_READ_WRITE_TOKEN=     # Vercel Blob for attachments
CRON_SECRET=               # Auth for /api/cron/monitor
```

### Optional
```
CHAT_MODEL=claude-opus-5-5 # Must support adaptive thinking, tool search, compaction
CHAT_EFFORT=medium         # low|medium|high|xhigh|max
MAX_TURN_COST_CENTS=60     # Hard model-spend ceiling per credit
META_ACCESS_TOKEN=         # Dev-only fallback (NODE_ENV=development; ignored in prod)
META_AD_ACCOUNT_ID=        # Dev-only fallback
META_API_VERSION=          # Override default (currently v25.0)
DRY_RUN=true              # Skip actual Meta API writes
NEXT_PUBLIC_APP_URL=       # Base URL for OAuth redirects
STRIPE_BASIC_ANNUAL_PRICE_ID=   # Annual billing price IDs (optional)
STRIPE_PRO_ANNUAL_PRICE_ID=
STRIPE_AGENCY_ANNUAL_PRICE_ID=
```

## Plan Tiers (Credit-Based Model)

| Plan | Ad Accounts | Monthly Credits | Overage Rate | MCP Access |
|---|---|---|---|---|
| trial | 1 | 25 | $0.90/credit | No |
| basic | 1 | 75 | $0.90/credit | No |
| pro | 5 | 250 | $0.75/credit | No |
| agency | Unlimited | 650 | $0.60/credit | Yes |

1 credit = 1 conversation turn (one message sent, one response received). Overage kicks in after monthly credits are exhausted — users are never hard-blocked. Bonus credits (from credit packs) never expire and are consumed after monthly credits run out.

**Credit packs**: 12 credits ($9), 45 credits ($29), 120 credits ($69)

**Annual pricing**: 20% discount — Starter $39/mo, Pro $119/mo, Agency $279/mo

Trial expires 3 days after signup. Bonus credits can be added by admin.

## Improvement Backlog

### P0 — Reliability
- [x] ~~Chat agent gets stuck narrating actions without executing tool calls~~ -> fixed break condition dropping tool_use blocks on `end_turn`, increased `max_tokens` to 16384, `MAX_TOOL_ROUNDS` to 10, added `stop_reason` logging (`src/app/api/chat/route.ts`)

### P0 — Security
- [x] ~~API key DELETE missing userId ownership check~~ (`src/app/api/keys/route.ts`)
- [x] ~~Hardcoded Meta API version `v25.0` in 6+ locations~~ -> extracted to `META_API_VERSION`
- [x] ~~Admin PATCH accepts negative bonusCalls without validation~~ -> validated integer in [0, 100000] (`src/app/api/admin/users/route.ts`)
- [x] ~~No input validation on chat message structure/length~~ -> `validateMessages()` checks array, max 100, valid roles, non-null content (`src/app/api/chat/route.ts`)
- [x] ~~No CSP headers configured~~ -> security headers middleware (CSP, HSTS, X-Frame-Options, nosniff, Referrer-Policy) (`src/middleware.ts`)
- [x] ~~Crypto: no key length or ciphertext bounds validation~~ -> validates 32-byte key + minimum buffer length (`src/lib/crypto.ts`)
- [x] ~~decrypt() call sites unwrapped in chat route~~ -> try-catch at both paths, multi-account skips failed accounts (`src/app/api/chat/route.ts`)
- [x] ~~Meta token exchange returns unvalidated response~~ -> validates access_token is non-empty string (`src/lib/meta-auth.ts`)
- [x] ~~Meta API fetch calls have no timeout~~ -> `AbortSignal.timeout(15_000)` on all 4 calls (`src/lib/meta-auth.ts`)
- [x] ~~Webhook STRIPE_WEBHOOK_SECRET used with ! assertion~~ -> null check before constructEvent (`src/app/api/billing/webhook/route.ts`)
- [x] ~~Webhook credits parseInt with no NaN/negative check~~ -> guards against invalid values (`src/app/api/billing/webhook/route.ts`)
- [x] ~~Webhook has no idempotency dedup~~ -> `webhook_events` table, check before processing, record after (`src/app/api/billing/webhook/route.ts`)
- [x] ~~Conversations JSONB grows unbounded~~ -> MAX_STORED_MESSAGES (200) trim in persistChatData (`src/app/api/chat/route.ts`)
- [x] ~~FK references have no onDelete~~ -> cascade on all child tables, set null on conversations.adAccountId (`src/lib/db/schema.ts`)
- [x] ~~No rate limiting on auth or billing checkout endpoints~~ -> sliding-window rate limiter (`src/lib/rate-limit.ts`), applied to checkout (5/60s), webhook (30/60s), auth POST (15/300s)

### P1 — Code Quality
- [x] ~~Duplicated `Message`/`ToolCall` interfaces in `ChatWindow.tsx` and `MessageBubble.tsx`~~ -> extracted to `src/types/chat.ts`
- [x] ~~Duplicated `Level`/`TimeRange`/`SortDir` in dashboard components~~ -> extracted to `src/types/dashboard.ts`
- [x] ~~Inconsistent `Response.json()` vs `NextResponse.json()` across API routes~~ -> standardized on `Response.json()` in 5 routes
- [x] ~~Cost estimation uses hardcoded Sonnet pricing~~ -> extracted to `src/lib/pricing.ts` with `MODEL_PRICING` config
- [x] ~~Tool executor `String(error)` produces `[object Object]`~~ -> instanceof check + JSON.stringify fallback + error code propagation (`src/lib/tool-executor.ts`)
- [x] ~~Webhook retrieves same subscription twice~~ -> single retrieve, reuse for userId and plan (`src/app/api/billing/webhook/route.ts`)
- [x] ~~Unhandled webhook events silently return 200~~ -> logs event type (`src/app/api/billing/webhook/route.ts`)
- [x] ~~`src/app/api/chat/route.ts` is 580+ lines~~ -> extracted `runChat()`, `injectAttachmentBlocks()`, `validateMessages()`, `persistChatData()`, context logic into `src/lib/chat.ts`; route.ts is now a thin controller (~190 lines)
- [x] ~~Duplicated ad-account connection logic across `POST /api/accounts`, `POST /api/auth/meta/connect`, and `POST /api/meta/ad-accounts`~~ -> consolidated into `connectAdAccount()` in `lib/meta-auth.ts`; fixes missing upsert in `auth/meta/connect`, hardcoded plan limits, missing try/catch in `accounts`, inconsistent expiry fallback
- [x] ~~`tools-schema.ts` MCP-to-Anthropic conversion called at module load~~ -> lazy-initialized via `getAnthropicTools()` in `lib/chat.ts`

### P2 — Testing (zero test files exist)
Priority targets for first test suite:
- [x] ~~`src/lib/crypto.ts` — encrypt/decrypt roundtrip, invalid key handling~~
- [x] ~~`src/lib/plans.ts` — trial expiry edge cases, plan limit checks~~
- [x] ~~`src/lib/tools-schema.ts` — MCP-to-Anthropic tool format conversion~~
- [x] ~~`src/app/api/billing/webhook/route.ts` — Stripe event handling (mocked)~~
- [x] ~~`src/app/api/chat/route.ts` — auth checks, rate limiting, trial expiry~~
- [x] ~~`src/app/api/keys/route.ts` — ownership isolation~~

### P3 — DevEx
- [x] ~~No CI/CD pipeline~~ -> `.github/workflows/ci.yml` (format:check, lint, typecheck, test, build)
- [x] ~~No Prettier config~~ -> `.prettierrc` + `npm run format` / `format:check`
- [x] ~~No pre-commit hooks~~ -> Husky + lint-staged (prettier + eslint on staged .ts/.tsx)
- [x] ~~Default Next.js README.md~~ -> replaced with real project docs
- [x] ~~MCP server `dist/` build dependency undocumented~~ -> `predev` script auto-builds, documented in README + CI

### P4 — Feature Enhancements
- [x] ~~Streaming responses (SSE) for chat~~ -> `runChatStreaming()` in `src/lib/chat-streaming.ts`, SSE reader in ChatWindow, `stream: true` flag in chat route
- [x] ~~Auto-refresh expiring Meta tokens~~ -> `refreshAccountTokenIfNeeded()` in `src/lib/meta-auth.ts`, fire-and-forget in chat route, manual `POST /api/accounts/refresh` endpoint
- [x] ~~Conversation history sidebar~~ -> `ConversationList` component, `DELETE /api/conversations`, load-by-id in ChatWindow, sidebar integration in chat page
- [x] ~~React error boundaries~~ -> `error.tsx` in root, chat, and (app) route groups with consistent dark styling
- [x] ~~Attachment store uses in-memory Map~~ -> Vercel Blob direct uploads + `attachments` table (`lib/attachment-store.ts`)

### P5 — Agent v2 (2026-10-07)
- [x] Multi-account mode ran write tools on every account -> read/write policy, writes need `target_account_id` (`lib/tool-policy.ts`)
- [x] Writes executed with only a prompt-level "confirm first" -> server-side approval queue + snapshot undo (`lib/agent/actions.ts`, `/api/actions`)
- [x] Credit check-then-act race, bonus could go negative, unbounded per-turn spend -> atomic `reserveCredit`, refunds, `MAX_TURN_COST_CENTS`
- [x] In-memory rate limiter on serverless; global Meta throttle across tenants; usage headers only read on errors -> Upstash + per-account `metaFetch` throttle
- [x] Client-supplied history + `<context>` regex memory -> server-side append-only transcript + server-side compaction
- [x] All 75 tool schemas sent every request -> tool search with deferred loading
- [x] Hardcoded `claude-sonnet-4-6` in two duplicated loops -> single engine, Opus 5.5 config, adaptive thinking, refusal fallbacks
- [x] Raw Graph JSON into context -> `compactResult`
- [x] List fetchers returned only the first page -> `graphGetAll` pagination
- [x] Token in GET query strings, no appsecret_proof -> Authorization header + proof
- [x] Env-token fallback reachable in prod builds -> `devEnvTenant()` dev-only
- [x] Dashboard cross-account view; daily Slack alerts; playbooks; tool calls persisted with display messages
- [ ] Run migration `drizzle/0004_agent_v2.sql` on Neon before deploying
- [ ] Verify against a live ad account: approval -> execute -> undo for budget/status changes
- [ ] Pre-existing: `npm run lint` fails on ~660 `no-explicit-any` errors (the CI lint step was already red before v2)

## Deliberately Removed

> **IMPORTANT**: Before building any new feature or re-adding code, check this list first. These items were intentionally removed and should NOT be rebuilt unless explicitly discussed and approved.

- **Settings "Upload photo" button** — No photo upload infrastructure exists; avatar uses initials (2026-03-05)
- **Settings Preferences section (Theme, Email Summaries, Default Time Range)** — Saved to localStorage but nothing reads the values; app is hardcoded dark, no email system, dashboard ignores stored time range (2026-03-05)
- **Chat route `export const config` (Pages Router body size config)** — Silently ignored in App Router; not needed (2026-03-05)
- **`<context>` block memory + client-sent message history** — Replaced by the server-side transcript; the regex hack lost tool results and let clients forge history (2026-10-07)
- **`lib/chat-streaming.ts` / duplicated non-streaming loop** — One engine (`lib/agent/engine.ts`) serves both (2026-10-07)
- **Per-turn model/effort routing** — Deliberately not built: switching model or effort mid-conversation invalidates the prompt cache and drops thinking blocks (2026-10-07)

<!-- Format: - **What was removed** — Why it was removed (YYYY-MM-DD) -->
