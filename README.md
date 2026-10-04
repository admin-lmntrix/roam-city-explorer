# roam. — City Explorer

Full-stack city discovery app: search any city, filter hidden places / local food / history / nature, read and write reviews, save favourites, browse travel guides, and suggest new places that an admin moderates before they go public.

**Stack:** Next.js 15 (App Router) · TypeScript · Tailwind v4 · Prisma 6 + PostgreSQL · Auth.js v5 · zod

## Features
- Public: city search with category pills, place pages with OpenStreetMap embed, guides, suggest-a-place form
- Accounts: register / sign in (bcrypt + JWT), one review per user per place (re-posting edits it), save places → `/saved`
- Admin: `/admin` moderation queue — approve (creates the Place, and the City if new), reject, restore
- API: JSON REST under `/api/*` (see table below), `/api/health` for uptime checks

## Run locally
```bash
npm install
cp .env.example .env        # set DATABASE_URL, AUTH_SECRET (openssl rand -base64 32), ADMIN_EMAIL/ADMIN_PASSWORD
npx prisma db push          # creates tables from prisma/schema.prisma
npm run db:seed             # Kolkata + Jaipur data, guides, and your admin account
npm run dev                 # http://localhost:3000
```
No Postgres handy? `docker compose up db -d` and use `postgresql://roam:roam@localhost:5432/city_explorer`.

## Deploy (pick one)
**Vercel + Neon (≈5 min)**
1. Create a free Postgres at neon.tech and copy the **direct** (non-pooled) connection string.
2. Push this folder to GitHub → import in Vercel. Build command is picked up from `vercel-build` (runs `prisma db push` then `next build`).
3. Env vars: `DATABASE_URL`, `AUTH_SECRET`.
4. Seed once from your machine: `DATABASE_URL="<neon url>" ADMIN_EMAIL=you@x.com ADMIN_PASSWORD='<strong>' npm run db:seed`.

**Render:** New + → Blueprint → select the repo (`render.yaml` provisions web service + Postgres), then seed as above.

**Docker / any VPS:** `AUTH_SECRET=$(openssl rand -base64 32) docker compose up --build`, then `docker compose exec web npm run db:seed`.

> Change/remove the default admin password immediately. If `ADMIN_PASSWORD` is empty the seed prints a random one once.

## API
| Method & path | Auth | Purpose |
|---|---|---|
| `GET /api/places?city=&q=&type=` | – | Search (adds `avgRating`, `reviewCount`, `favorited`) |
| `GET /api/cities` | – | Cities + place counts |
| `POST /api/register` | – | Create account |
| `GET/POST /api/places/:slug/reviews` | POST: user | List / create-or-update own review |
| `PUT/DELETE /api/places/:slug/favorite` | user | Save / unsave |
| `POST /api/submissions` | optional | Suggest a place (status `PENDING`) |
| `GET/PATCH /api/admin/submissions` | admin | Queue / approve · reject (optional `latitude`,`longitude`,`country` for new cities) |
| `GET /api/health` | – | DB connectivity check |

## Using other tools
- **Cursor / Claude Code / Codex:** fully supported — `AGENTS.md` and `.cursor/rules/roam.mdc` give them the architecture, conventions and a verification loop (`npm run typecheck`, `npm run smoke`).
- **Figma:** `design/tokens.json` holds colours, radii, shadow, type and a component inventory (import with Tokens Studio or create Figma Variables from it). Rebuild the listed components in Figma, then hand frames back to Cursor.
- **Lovable / Bolt:** these builders are browser sandboxes, and Lovable's GitHub import is aimed at Vite + React projects, so a Next.js + Prisma repo may not import cleanly. The reliable pattern is to let them generate/redesign a *frontend* and point it at this app's REST API (you would need to add CORS headers to `app/api/*`). The Rust-free Prisma client was chosen so the backend has no native binary, but this has not been tested inside Bolt.

## Project layout
See `AGENTS.md`. Data contract: `prisma/schema.prisma`. Business logic: `lib/`. Thin API routes: `app/api/`. UI islands: `components/`.
