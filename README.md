# meta-ads-app

Conversational AI for Meta Ads management. Chat with Claude to manage campaigns, audiences, creatives, and analytics across your Meta ad accounts.

**Stack:** Next.js 16, React 19, TypeScript, Drizzle ORM + Neon Postgres, Anthropic SDK, Stripe, NextAuth v5

## Prerequisites

- Node.js 22+
- npm
- A Neon Postgres database
- Meta Developer App (for OAuth + Marketing API)
- Stripe account (for billing)
- Anthropic API key

## Getting Started

```bash
# Install dependencies
npm install

# Build the MCP server (required before app can import)
cd packages/meta-mcp-server && npm run build && cd ../..

# Copy env template and fill in values
cp .env.example .env.local

# Push DB schema to Neon
npx drizzle-kit push

# Start dev server (auto-builds MCP server via predev script)
npm run dev
```

## Dev Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server (auto-builds MCP server) |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run format` | Format with Prettier |
| `npm run format:check` | Check formatting |
| `npm test` | Run tests (Vitest) |
| `npm run test:watch` | Run tests in watch mode |
| `npx drizzle-kit push` | Push schema changes to DB |
| `npx drizzle-kit generate` | Generate migration files |

## Architecture

```
src/
├── app/api/          # Next.js API routes
│   ├── auth/         # NextAuth + Meta OAuth
│   ├── billing/      # Stripe checkout + webhooks
│   ├── chat/         # Main chat endpoint → Claude agentic loop
│   └── keys/         # API key management (Agency plan)
├── components/       # React components (shadcn/ui)
├── lib/              # Shared logic
│   ├── chat.ts       # runChat agentic loop + message helpers
│   ├── crypto.ts     # AES-256-GCM encrypt/decrypt
│   ├── db/           # Drizzle ORM client + schema
│   ├── plans.ts      # Plan limits + trial expiry
│   ├── stripe.ts     # Stripe client + price IDs
│   └── tool-executor.ts  # Claude tool_use → MCP handler bridge
└── middleware.ts     # Auth + security headers

packages/meta-mcp-server/   # MCP server (76+ Meta API tools)
```

**Chat flow:** User message → `POST /api/chat` → Claude agentic loop (max 10 tool rounds) → MCP tool handlers → Meta Marketing API

**Auth flow:** Meta OAuth → short-lived token → long-lived token (~60 days) → AES-256-GCM encrypted → stored in DB

## Environment Variables

See `CLAUDE.md` for full list. Required:

- `DATABASE_URL` — Neon Postgres connection string
- `AUTH_SECRET` — NextAuth secret
- `ENCRYPTION_KEY` — 32-byte hex key for AES-256-GCM
- `META_APP_ID` / `META_APP_SECRET` — Meta developer app
- `ANTHROPIC_API_KEY` — Anthropic API key
- `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` — Stripe billing
- `NEXT_PUBLIC_STRIPE_*_PRICE_ID` — Stripe price IDs

## CI

GitHub Actions runs on push/PR to `main`: format check → lint → typecheck → test → build.
