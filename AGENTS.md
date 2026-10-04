# roam. — guide for AI coding tools (Cursor, Claude Code, Codex, Bolt, Lovable…)

Full-stack city-discovery app. **Next.js 15 (App Router) · TypeScript · Tailwind v4 · Prisma 6 (Rust-free client + `@prisma/adapter-pg`) · PostgreSQL · Auth.js v5 (credentials, JWT).**

## Map of the code
| Concern | Where |
|---|---|
| DB schema (the contract) | `prisma/schema.prisma` · seed: `prisma/seed.ts` |
| DB client | `lib/db.ts` (only place that builds `PrismaClient`) |
| Input validation (zod) | `lib/validators.ts` — every API route parses with these |
| Business logic | `lib/places.ts` (search), `lib/moderation.ts` (approve → create Place/City) |
| API routes | `app/api/**/route.ts` — thin: auth check → validate → call lib → `json()` |
| Route helpers | `lib/http.ts` — `handle()`, `json()`, `fail()`, `readJson()`, `getCurrentUser()`, `HttpError` |
| Auth | `auth.config.ts` (edge-safe) · `auth.ts` (Credentials + bcrypt) · `middleware.ts` (route guard) |
| Pages | `app/**/page.tsx` — server components query the DB directly; client islands live in `components/` |
| UI | `components/*` · tokens in `app/globals.css` + `design/tokens.json` |

## Conventions
- **Server components by default**; add `"use client"` only for interactivity (forms, favorite button).
- **Pages that read the DB export `dynamic = "force-dynamic"`** so builds never need a database.
- **Every API handler is wrapped in `handle()`**; throw `HttpError(status, msg)` for expected failures.
- **Authorization is checked twice**: middleware, then `getCurrentUser()` (re-reads role from DB). Never trust the JWT role alone for writes.
- Validate with zod before touching the DB. Never return `passwordHash`.
- Schema change → edit `schema.prisma` → `npx prisma db push` (dev) or `npx prisma migrate dev --name <x>` (when you want migration history) → `npx prisma generate`.
- Use Tailwind utilities with the palette in `design/tokens.json` (ink `#17221d`, paper `#f7f5ef`, accent `#d96c3d`, muted `#68736d`, line `#e6e1d7`).
- Place types are an enum: add new ones in `schema.prisma` **and** `lib/place-types.ts`.

## Verify changes
```bash
npm run typecheck && npm run build
npm run dev   # then in another shell:  npm run smoke   (35 end-to-end API checks)
```
`npm run smoke` expects the seeded admin (`ADMIN_EMAIL`/`ADMIN_PASSWORD` env, defaults in the script).

## Known gaps / good next tasks
- No rate limiting on `/api/register` and `/api/submissions` (add Upstash/Redis or Vercel WAF before real traffic).
- No email verification / password reset; no OAuth providers (add to `auth.ts` `providers`).
- Place images: `imageUrl` is supported but there is no upload flow (add S3/Cloudinary/UploadThing).
- Collections tables exist in the schema but have no UI/API yet.
- Seed coordinates are approximate.
