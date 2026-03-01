# meta-ads-app

Conversational AI for Meta Ads management. Users chat with Claude to manage campaigns, audiences, creatives, and analytics across their Meta ad accounts using 76+ MCP tools.

**Stack**: Next.js 16, React 19, TypeScript, Drizzle ORM + Neon Postgres, Anthropic SDK, Stripe, NextAuth v5 (beta)
**Monorepo**: root app + `packages/meta-mcp-server` (local workspace dependency)

## Dev Commands

```bash
# App
npm run dev          # next dev --webpack
npm run build        # next build --webpack
npm run lint         # eslint

# Database
npx drizzle-kit push       # push schema to Neon
npx drizzle-kit generate   # generate migration files

# MCP server (must build before app can import)
cd packages/meta-mcp-server
npm run build        # rm -rf dist && tsc
npm run dev          # tsx src/index.ts (stdio mode)
```

## Architecture

### Chat flow
`ChatWindow.tsx` -> `POST /api/chat` -> Claude agentic loop (max 10 tool rounds) -> `tool-executor.ts` dispatches to MCP tool handlers -> Meta Marketing API

### Auth flow
Meta OAuth (`/api/auth/[...nextauth]`) -> short-lived token -> `exchangeForLongLivedToken()` (~60 days) -> AES-256-GCM encrypt -> store in `ad_accounts.access_token_enc`

### Billing
Stripe Checkout (`/api/billing/checkout`) -> webhook (`/api/billing/webhook`) -> update `users.plan` + `bonusCalls`

### Context persistence
Claude appends `<context>` blocks in responses. These are extracted via regex, stripped from the user-facing text, and persisted in `conversations.context` for continuity across messages.

### Multi-account mode
When `accountId === 'all'`, each tool call executes against all connected accounts in parallel, results aggregated and labeled by account name.

## Directory Map

```
src/
├── app/
│   ├── (app)/              # Authenticated layout group (admin, billing, settings)
│   ├── api/
│   │   ├── auth/           # NextAuth + Meta OAuth connect
│   │   ├── billing/        # Stripe checkout, portal, webhook
│   │   ├── chat/route.ts   # Main chat endpoint (557 lines, agentic loop)
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
│   ├── anthropic.ts        # Client init + SYSTEM_PROMPT
│   ├── auth.ts             # NextAuth config (Meta OAuth provider)
│   ├── crypto.ts           # AES-256-GCM encrypt/decrypt
│   ├── db/                 # Drizzle client + schema
│   ├── meta-auth.ts        # Token exchange, ad account discovery, META_API_VERSION
│   ├── plans.ts            # Plan limits, trial expiry check
│   ├── stripe.ts           # Stripe client
│   ├── tool-executor.ts    # Bridge: Claude tool_use -> MCP handlers
│   ├── tools-schema.ts     # MCP-to-Anthropic tool format conversion
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

5 tables in `src/lib/db/schema.ts`:

| Table | Key columns | Notes |
|---|---|---|
| `users` | id (uuid), email, plan, trialEndsAt, bonusCalls, isAdmin | plan: trial/basic/pro/agency |
| `ad_accounts` | userId (FK), metaAdAccountId, accessTokenEnc, isActive | Token is AES-256-GCM encrypted |
| `conversations` | userId (FK), adAccountId (FK), messages (jsonb), context | Messages array + extracted context |
| `usage` | userId (FK), month, apiCalls, inputTokens, outputTokens | Unique on (userId, month) |
| `api_keys` | userId (FK), keyHash (SHA-256), label | Agency plan only |
| `webhook_events` | id (text PK = Stripe event ID), processedAt | Idempotency dedup for webhooks |

All child table FKs use `onDelete: 'cascade'` except `conversations.adAccountId` which uses `onDelete: 'set null'`.

## Conventions

- **Imports**: `@/*` maps to `./src/*`
- **API routes**: Use `Response.json()`, call `await auth()` at top for session
- **Single-row queries**: `const [result] = await db.select()...limit(1)`
- **UI**: shadcn/ui (new-york style), dark theme, lucide-react icons
- **MCP tool registration**: Add tool file in `packages/meta-mcp-server/src/tools/`, export from `exports.ts`, register handler in `tool-executor.ts`
- **Meta API version**: Single constant `META_API_VERSION` in `src/lib/meta-auth.ts` — update there only
- **Commits**: Imperative present tense, descriptive

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
```

### Optional
```
META_ACCESS_TOKEN=         # Dev/demo fallback (skip OAuth)
META_AD_ACCOUNT_ID=        # Dev/demo fallback
META_API_VERSION=          # Override default (currently v25.0)
DRY_RUN=true              # Skip actual Meta API writes
NEXT_PUBLIC_APP_URL=       # Base URL for OAuth redirects
```

## Plan Tiers

| Plan | Ad Accounts | Monthly API Calls | MCP Access |
|---|---|---|---|
| trial | 1 | 25 | No |
| basic | 1 | 100 | No |
| pro | 5 | 400 | No |
| agency | Unlimited | 1,000 | Yes |

Trial expires 7 days after signup. Bonus calls can be added by admin.

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
- [ ] No rate limiting on auth or billing checkout endpoints

### P1 — Code Quality
- [x] ~~Duplicated `Message`/`ToolCall` interfaces in `ChatWindow.tsx` and `MessageBubble.tsx`~~ -> extracted to `src/types/chat.ts`
- [x] ~~Duplicated `Level`/`TimeRange`/`SortDir` in dashboard components~~ -> extracted to `src/types/dashboard.ts`
- [x] ~~Inconsistent `Response.json()` vs `NextResponse.json()` across API routes~~ -> standardized on `Response.json()` in 5 routes
- [x] ~~Cost estimation uses hardcoded Sonnet pricing~~ -> extracted to `src/lib/pricing.ts` with `MODEL_PRICING` config
- [x] ~~Tool executor `String(error)` produces `[object Object]`~~ -> instanceof check + JSON.stringify fallback + error code propagation (`src/lib/tool-executor.ts`)
- [x] ~~Webhook retrieves same subscription twice~~ -> single retrieve, reuse for userId and plan (`src/app/api/billing/webhook/route.ts`)
- [x] ~~Unhandled webhook events silently return 200~~ -> logs event type (`src/app/api/billing/webhook/route.ts`)
- [ ] `src/app/api/chat/route.ts` is 580+ lines -> extract `runChat()`, `injectAttachmentBlocks()`, context logic into `src/lib/chat.ts`
- [ ] Duplicated ad-account connection logic across `POST /api/accounts`, `POST /api/auth/meta/connect`, and `POST /api/meta/ad-accounts` -> consolidate into `lib/meta-auth.ts`
- [ ] `tools-schema.ts` MCP-to-Anthropic conversion called at module load -> consider lazy initialization

### P2 — Testing (zero test files exist)
Priority targets for first test suite:
- [ ] `src/lib/crypto.ts` — encrypt/decrypt roundtrip, invalid key handling
- [ ] `src/lib/plans.ts` — trial expiry edge cases, plan limit checks
- [ ] `src/lib/tools-schema.ts` — MCP-to-Anthropic tool format conversion
- [ ] `src/app/api/billing/webhook/route.ts` — Stripe event handling (mocked)
- [ ] `src/app/api/chat/route.ts` — auth checks, rate limiting, trial expiry
- [ ] `src/app/api/keys/route.ts` — ownership isolation

### P3 — DevEx
- [ ] No CI/CD pipeline -> add GitHub Actions for lint + typecheck + build
- [ ] No Prettier config -> add `.prettierrc` and format codebase
- [ ] No pre-commit hooks -> add Husky + lint-staged
- [ ] Default Next.js README.md -> replace with real project docs
- [ ] MCP server `dist/` build dependency undocumented -> add to dev setup instructions

### P4 — Feature Enhancements
- [ ] Streaming responses (SSE) for chat -> improve perceived latency on multi-tool rounds
- [ ] Auto-refresh expiring Meta tokens (`lib/meta-auth.ts:refreshLongLivedToken()` exists but is never called)
- [ ] Conversation history sidebar (backend `GET /api/conversations` exists, no UI)
- [ ] React error boundaries for graceful crash recovery
- [ ] Attachment store uses in-memory Map -> won't work across serverless invocations in production
