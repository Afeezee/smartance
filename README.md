# Smartance

A QR code-based smart attendance system for **The Polytechnic Ile-Ife**,
Department of Computer Engineering.

Final year project by **Bolarinwa Adeyemi Ogheneochuko** (H/24/CS/0023), supervised
by Miss Oluyemi Sadare.

---

## What it does

Traditional printed roll calls and static-QR classroom attendance are trivially
proxied — one student scans for absent friends. Smartance defends against this
by combining three signals:

1. **Rotating, HMAC-signed QR tokens** that expire every 10–15 seconds, so a
   screenshot of "the code" is useless a moment later.
2. **Geofencing** to a lecturer-defined lat/lng + radius.
3. **Device fingerprinting** to flag the same phone marking attendance for
   multiple different students in a short window.

Geofence gating is best-effort — GPS is spoofable on rooted/jailbroken devices
— and this limitation is called out in the code and in the project write-up.

## Tech stack

| Layer            | Choice                                                        |
| ---------------- | ------------------------------------------------------------- |
| Framework        | Next.js 14 (App Router) + TypeScript                          |
| Database         | [Neon](https://neon.tech) serverless Postgres                 |
| ORM              | [Drizzle](https://orm.drizzle.team) — schema-first, plain SQL migrations |
| Auth             | [Auth.js v5](https://authjs.dev) credentials + role-based JWT |
| Styling          | Tailwind CSS with CSS-variable-driven palette                 |
| QR generation    | `qrcode` npm package                                          |
| Realtime feed    | Polling via SWR (short intervals on the live dashboard)       |
| AI insights      | Groq API (Llama 3.3 70B) for weekly narrative summaries       |
| Deployment       | Vercel                                                        |

## Branding

The palette lives in `src/app/globals.css` as CSS variables that Tailwind
consumes through `tailwind.config.ts`. It was derived programmatically from
a source logo (originally the OUI shield; the school affiliation later
changed to The Polytechnic Ile-Ife but the palette was retained) — the
dominant crimson, ribbon yellow, and shield orange became `--color-primary`,
`--color-secondary`, and `--color-accent` respectively. The current
institutional logo lives at `public/tpi-logo.png`.

To retune the palette, edit `src/app/globals.css` — no component code needs
to change.

## Getting started

### 1. Prerequisites

- Node.js **20+** (npm ships with it).
- A free [Neon](https://console.neon.tech/) account for the Postgres database.
- Optionally, a [Groq](https://console.groq.com/keys) API key for AI insights
  (Phase 6). Leave the env var blank until then.

### 2. Install

```bash
npm install
```

### 3. Configure environment

```bash
cp .env.example .env.local
```

Then fill in `.env.local`:

- `DATABASE_URL` — copy the pooled connection string from your Neon project.
- `NEXTAUTH_SECRET` — generate with `openssl rand -base64 32`.
- `QR_TOKEN_SECRET` — generate the same way; must differ from `NEXTAUTH_SECRET`.
- `GROQ_API_KEY` — optional until Phase 6.

### 4. Migrate the database

Generate SQL migrations from the Drizzle schema:

```bash
npm run db:generate     # writes SQL to ./drizzle
npm run db:migrate      # applies pending migrations to Neon
```

For quick prototyping you can also do `npm run db:push` to sync the schema
without generating migration files — not recommended once real data exists.

### 5. Bootstrap the first admin

The admin creates lecturers and courses. Set `ADMIN_EMAIL` / `ADMIN_PASSWORD`
in `.env.local`, then:

```bash
npm run seed:admin
```

The script is idempotent — running it again resets the admin password.

### 6. Run

```bash
npm run dev
```

Open http://localhost:3000.

**Demo flow for the panel:**

1. Sign in as the admin → `/admin` → create a lecturer, then a course.
2. Sign out; sign in as the lecturer → `/lecturer` → open the course → start a
   session (optionally tick "geofence" to pin the classroom location).
3. On a phone (or a second browser), sign in as a student who is enrolled →
   scan the rotating QR displayed on the lecturer screen.
4. Watch the lecturer's live feed populate.
5. Click **Generate insights** to see a Groq narrative summary of the past 7
   days, or **Export CSV** for the raw attendance data.

> **HTTPS note**: The `/attend` scan page (Phase 3+) uses the browser camera,
> which browsers only expose on `https://` or `http://localhost`. Vercel
> handles HTTPS automatically in production; local development on
> `localhost` also works.

## Scripts

| Script             | What it does                                            |
| ------------------ | ------------------------------------------------------- |
| `npm run dev`      | Start Next.js in development mode                       |
| `npm run build`    | Production build                                        |
| `npm run start`    | Serve the production build                              |
| `npm run typecheck`| Run TypeScript in `--noEmit` mode                       |
| `npm run db:generate` | Generate SQL migration files from `schema.ts`        |
| `npm run db:migrate`  | Apply pending migrations to `DATABASE_URL`           |
| `npm run db:push`     | Push schema directly (dev/prototype only)            |
| `npm run db:studio`   | Open Drizzle Studio to browse the DB                 |

## Project structure

```
src/
├── app/
│   ├── (auth)/            login and register pages
│   ├── (dashboard)/       role-gated shell + admin/lecturer/student pages
│   ├── api/               route handlers (auth, register, sessions, attendance)
│   ├── layout.tsx         root html shell
│   └── globals.css        palette + Tailwind directives
├── auth.ts                Auth.js v5 config (Node runtime)
├── auth.config.ts         Auth.js callbacks (edge-safe, used by middleware)
├── middleware.ts          Route guarding — enforces "must be signed in"
├── components/            Logo, Button, Input, plus later dashboard widgets
├── lib/
│   ├── db/                Drizzle client and schema
│   └── access.ts          Server-side role check helpers
└── types/                 TypeScript module augmentations
```

## Build phases

- **Phase 1** ✅ Scaffold, Neon + Drizzle, Auth.js v5 with roles, palette.
- **Phase 2** ✅ Course and enrollment CRUD.
- **Phase 3** ✅ Session creation + rotating signed QR + scan-to-mark happy path.
- **Phase 4** ✅ Anti-spoofing: token expiry (HMAC + expiry in `src/lib/tokens.ts`),
  geofencing (haversine, `src/lib/geo.ts`), device fingerprint flagging
  (`src/lib/fingerprint.ts` + `src/app/api/attendance/route.ts`).
- **Phase 5** ✅ Live lecturer dashboard with 3-second SWR polling.
- **Phase 6** ✅ Groq (Llama 3.3 70B) weekly narrative + CSV export.
- **Phase 7** ✅ Loading skeletons, empty states, mobile viewport,
  descriptive error text for expired/invalid tokens.

## For the panel: how it defeats proxy attendance

| Attack                                             | What stops it                                                                                                     |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| "Screenshot the QR and send it to my friend."      | Tokens rotate every ~9s with a 12s TTL — screenshot is dead by the time it arrives.                               |
| "Print the QR and paste it on a wall."             | Same as above; new QR renders continuously.                                                                       |
| "Sign in as my friend."                            | Registration requires unique email and unique matric number; sessions are JWT-scoped to the user.                 |
| "Mark my friend from home during class."           | If the lecturer enables the geofence, out-of-radius attendance is flagged for review.                             |
| "Use one phone to scan for many friends."          | Device fingerprint is hashed client-side; the server flags any fingerprint that marks a *different* student in the last 10 minutes. |
| "Replay a captured token to mark twice."           | `attendance_session_student_uq` unique index in Postgres — one row per (session, student), full stop.             |

Geofence gating is a deterrent, not a guarantee. GPS is spoofable on rooted
or jailbroken devices — this limitation is noted in `src/lib/geo.ts` and
should be mentioned in the write-up's Limitations section.
