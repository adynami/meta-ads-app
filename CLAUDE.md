# meta-ads-app

Conversational AI for Meta Ads management. Users chat with Claude to manage campaigns, audiences, creatives, and analytics across their Meta ad accounts using 76+ MCP tools.

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
│   ├── anthropic.ts        # Client init + SYSTEM_PROMPT
│   ├── auth.ts             # NextAuth config (Meta OAuth provider)
│   ├── chat.ts             # runChat agentic loop, message helpers, persistence
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

Trial expires 3 days after signup. Bonus calls can be added by admin.

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
- [ ] Attachment store uses in-memory Map -> won't work across serverless invocations in production

## Deliberately Removed

> **IMPORTANT**: Before building any new feature or re-adding code, check this list first. These items were intentionally removed and should NOT be rebuilt unless explicitly discussed and approved.

(None yet — add entries here as things are removed)

<!-- Format: - **What was removed** — Why it was removed (YYYY-MM-DD) -->
