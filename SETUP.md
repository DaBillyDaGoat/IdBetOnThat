# Setup: idbetonthat → running on localhost (and deploying to Vercel)

Goal: from fresh clone to a working dev server in ~15 minutes. Then a deploy guide.

## Part 1 — Local dev

### 1. Prerequisites

- **Node.js 20+** — install from <https://nodejs.org> or use `nvm install 20`
- **A Postgres database** — easiest is Neon (free tier, no credit card)
- **A Resend account** — for magic-link sign-in emails (free dev tier)

Open a terminal in this folder (`Superdev/idbetonthat`).

### 2. Install dependencies

```bash
npm install
```

This installs everything in `package.json` and auto-runs `prisma generate`.

### 3. Create your Postgres database (Neon)

1. Sign up at <https://neon.tech> (free, no credit card)
2. Create a new project — name it `idbetonthat-dev`
3. Click **Connect** on the project dashboard
4. Copy **two** connection strings:
   - **Pooled** (the default) — for app runtime → `DATABASE_URL`
   - **Direct** (sometimes labeled "unpooled") — for Prisma migrations → `DIRECT_URL`

### 4. Set up Resend (sign-in emails)

1. Sign up at <https://resend.com>
2. **API Keys** → create one, copy it (starts with `re_`)
3. For dev, you can send from `onboarding@resend.dev`. For production, verify the `idbetonthat.com` domain in Resend later.

### 5. Create `.env`

```bash
cp .env.example .env
```

Edit and fill in:

```env
DATABASE_URL="postgresql://...your pooled url..."
DIRECT_URL="postgresql://...your direct url..."
AUTH_SECRET="paste-a-random-32-byte-string-here"
AUTH_URL="http://localhost:3000"
RESEND_API_KEY="re_your_actual_key"
EMAIL_FROM="onboarding@resend.dev"

# Optional in dev (required in production for cron security)
CRON_SECRET=""
```

Generate `AUTH_SECRET` with:

```bash
# Mac/Linux
openssl rand -base64 32

# Windows PowerShell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

### 6. Push the schema

```bash
npm run db:push
```

### 7. Run the dev server

```bash
npm run dev
```

Open <http://localhost:3000>.

### 8. End-to-end smoke test

1. Click **Sign in** → enter your email → check inbox for the magic link
2. Follow the link → land on the **welcome page**: confirm 18+, agree to ToS, set display name + Venmo username
3. Land on dashboard → click **Start a wager**
4. Fill in question + 2+ outcomes → submit
5. Copy your share link, open it in a second browser (or incognito) and sign in as a different email
6. Place a bet from the second account
7. From your first account, **Close wager now** then **Lock in winner**
8. Both accounts now see payout entries on `/dashboard` with a working Venmo button

### 9. Run tests

```bash
npm test
```

32 tests should pass — pari-mutuel math, transaction netting, implied odds, formatting, plus the resolution engine integration tests (PRD's canonical rain wager, hedger case, no-winners auto-void).

### 10. Useful commands

```bash
npm run db:studio    # Browser GUI for your DB
npm run db:push      # Schema → DB (no migration history)
npm run db:migrate   # Create + apply a named migration
npm run db:generate  # Regenerate Prisma Client after schema changes
npm run typecheck    # TS strict typecheck
```

---

## Part 2 — Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/idbetonthat.git
git push -u origin main
```

### 2. Import to Vercel

1. <https://vercel.com/new> → import the repo
2. Vercel will auto-detect Next.js
3. **Environment variables** — paste in all of these:
   - `DATABASE_URL` (Neon prod branch's pooled URL)
   - `DIRECT_URL` (Neon prod branch's direct URL)
   - `AUTH_SECRET` (generate a new one for prod — don't reuse dev)
   - `AUTH_URL` = `https://idbetonthat.com` (or your Vercel preview URL initially)
   - `RESEND_API_KEY`
   - `EMAIL_FROM` = `noreply@idbetonthat.com` (once you've verified the domain in Resend)
   - `CRON_SECRET` = random 32-byte string (Vercel will pass this in cron requests)
4. Deploy

### 3. Connect Porkbun domain

In Vercel project → **Settings** → **Domains** → add `idbetonthat.com`.

Vercel gives you nameserver records. In Porkbun:
- **DNS** tab → either set the nameservers Vercel provides, OR
- Add an `A` record for `@` pointing to `76.76.21.21` and a `CNAME` for `www` → `cname.vercel-dns.com`

(Nameservers are simpler if you don't use Porkbun email forwarding.)

### 4. Verify the cron jobs are set up

After deploy, in Vercel project → **Cron Jobs** tab you should see four schedules (defined in `vercel.json`):

| Path | Schedule | What it does |
|---|---|---|
| `/api/cron/close-timed` | `*/5 * * * *` | Flips OPEN wagers past their closeAt to AWAITING_RESOLUTION |
| `/api/cron/finalize-payouts` | `17 * * * *` | Finalizes payouts where one side confirmed >7 days ago |
| `/api/cron/welch-flag` | `23 7 * * *` | Welch-flags losers who didn't pay within 14 days post-resolve |
| `/api/cron/auto-void` | `37 7 * * *` | Auto-voids wagers stuck >30 days past closeAt |

All four endpoints require the `Authorization: Bearer $CRON_SECRET` header, which Vercel sets automatically when invoking your cron routes.

### 5. Verify Resend domain (production sending)

In Resend → **Domains** → add `idbetonthat.com` → add the DNS records Resend gives you to Porkbun's DNS tab. Once verified (usually <10 min), update `EMAIL_FROM` env var in Vercel to `noreply@idbetonthat.com` and redeploy.

---

## Troubleshooting

**"Can't reach database server"** — `DATABASE_URL` is stale (Neon resets it sometimes). Re-copy from the Neon dashboard.

**"Module '@prisma/client' did not initialize"** — `npm run db:generate`.

**Magic link works locally but link goes to wrong domain in production** — `AUTH_URL` env var must match the actual production URL.

**Login redirects in a loop** — usually `AUTH_SECRET` missing or `AUTH_URL` doesn't match where you're browsing.

**Cron returns 401 in dev** — set `CRON_SECRET=""` in your local `.env`. In dev mode the cron routes skip auth if no secret is configured.

**Cron returns 401 in prod** — Vercel only sets the auth header on routes listed in `vercel.json`'s `crons` array. If you hit them manually from your browser, you'll get 401 (correct behavior).

**Geo interstitial loops** — the `geo-ack` cookie should set on click. Check browser dev tools → Application → Cookies that the cookie was written.

**Auth.js types complain** — make sure `types/next-auth.d.ts` is being included by tsc. Run `npm run typecheck` to see the actual error.

---

## What to build next (post-launch)

The PRD's "Build Order" → Post-launch (v1.1) section. Likely priority order:

1. **Email notifications** (Resend templates for closing soon, resolution needed, you owe money, you've been paid)
2. **Public feed** (`/feed`) — shows wagers where `isPublic = true`, ordered by recent activity
3. **Report/flag system** — schema exists; needs UI + admin dashboard at `/admin`
4. **AdSense** — apply once you have ~50 wagers and steady traffic; integrate via a layout-level conditional script
5. **Pro tier** — Stripe + paid features per PRD §3
