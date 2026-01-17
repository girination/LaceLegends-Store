## Purpose

This file gives AI coding agents the minimal, actionable knowledge to be productive in this repo (a Vite + React + TypeScript storefront using Supabase).

**Big Picture**:
- **Frontend:** React + Vite app in `src/` (pages in `src/pages`, UI primitives in `src/components/ui`).
- **Data layer:** Supabase (client in `src/lib/supabase.ts`, server-only admin client in `src/lib/supabaseServer.ts`).
- **Auth & Admin:** There are two admin flows: a lightweight app-based `admin_users` table (migrations in `migrations/`) and Supabase Auth + `admin_roles` migrations. See `migrations/20260110_create_admin_users.sql` and `migrations/20260110_admin_roles_and_policies.sql`.

**Key development commands** (see `package.json` scripts):
- **Dev server:** `npm run dev` (runs Vite).
- **Build:** `npm run build` or `npm run build:dev`.
- **Admin checks / scripts:** `npm run check:admin`, `npm run promote:admin`, `npm run check:auth` — these run Node scripts in `scripts/` and load `.env` via `-r dotenv/config`. Provide `SUPABASE_SERVICE_ROLE_KEY` in env for server-side checks.

**Security & environment**:
- Never commit Supabase keys. Local dev uses `.env.local`; README documents required env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` for server tasks.
- Do not import or bundle `supabaseServer.ts` into client code. Use `src/lib/supabase.ts` in browser code only.

**Patterns & conventions to follow (observable in code):**
- **Separation of client/server Supabase clients:** `src/lib/supabase.ts` (browser) vs `src/lib/supabaseServer.ts` (server-only). If a change needs service-role privileges, route it through a server script/API and `supabaseAdmin`.
- **LocalStorage keys:** Cart and admin session use `luxe_cart` and `luxe_admin` in `src/contexts/AppContext.tsx` — maintain these keys when modifying cart or admin logic.
- **UI primitives:** This repo uses a shadcn-like component set in `src/components/ui/*`. Reuse these patterns for new UI controls.
- **Routing & pages:** Pages live in `src/pages` (e.g., `Products.tsx`, `ProductDetail.tsx`, `AdminDashboard.tsx`). New pages follow that structure.

**Migrations & DB workflows:**
- SQL files are in `migrations/`. To reproduce local DB state run them in Supabase SQL editor. The README explains the admin bootstrap and seed steps.
- Avoid embedding service keys in client code; prefer server functions or CI-protected scripts for migration-related automation.

**Testing / debugging notes**:
- There are no automated tests in the repo. For quick runtime checks:
  - Start the app: `npm run dev`.
  - Verify server-check scripts: `npm run check:admin` (requires `SUPABASE_SERVICE_ROLE_KEY`).
  - Use browser console and network inspector for client-side Supabase queries.

**Examples (copy-paste friendly):**
- Start dev with env file: `VITE_SUPABASE_URL=... VITE_SUPABASE_ANON_KEY=... npm run dev`
- Run admin check (server key required): `SUPABASE_SERVICE_ROLE_KEY=... npm run check:admin`

**When editing code, watch for:**
- Do not leak `SUPABASE_SERVICE_ROLE_KEY` into client bundles.
- Keep `localStorage` keys and the cart shape compatible with `src/contexts/AppContext.tsx` if changing cart structure.
- Use `supabaseAdmin` only inside Node/script/server contexts (see `scripts/*.mjs` examples).

If anything here is unclear or you want additional examples (API route patterns, component templates, or sample migrations), tell me which area to expand.
