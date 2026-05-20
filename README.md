# idbetonthat

Social pool-betting site for friend groups. Pari-mutuel pools, honor-code payouts, Venmo deep-links. We don't touch money.

See [PRD.md](./PRD.md) for the full product spec, [SETUP.md](./SETUP.md) to run locally.

## What's built (PRD Sprints 1–5)

**End-to-end working:**

- Next.js 15 (App Router) + TypeScript + Tailwind, Vercel-ready
- Postgres schema (Prisma) for every PRD model — User, Wager, Outcome, Bet, Payout, Dispute, JoinRequest, Report
- Auth.js v5 with Resend magic-link sign-in + Prisma adapter
- **Create wager** (`/start`) with dynamic outcomes, pari-mutuel/equal-split modes, timed/manual close, approval-required access mode
- **Wager detail** (`/[slug]`) with live pool, implied odds, recent bets, share link, status-aware action bar
- **Bet placement** with first-bet Venmo capture and approval-required join flow
- **Close + Resolve + Void** UI for creators; resolution engine atomically creates payouts and updates reputation counters
- **Payment dashboard** (`/dashboard`) with Venmo deep-link buttons, "I paid" / "Confirm received" flow
- **Dispute flow** — 48h window post-resolution, public badge on wager + creator profile counter
- **Public profiles** (`/u/:username`) with W/L record, paid-up rate, lifetime won/lost, welch/ghost/dispute flags
- **18+ welcome gate** + **account deletion** (wipes PII, retains anonymized bets) + **profile editing**
- **Geo interstitial** for WA / HI / ID / UT (Vercel geo headers)
- **Vercel Cron** routes: timed-close (5min), finalize-payouts (hourly), welch-flag (daily), auto-void (daily)
- **Payout math library** (`lib/payouts.ts`) — pari-mutuel resolution, largest-remainder cent rounding, greedy transaction netting, implied-odds display
- **32 unit tests passing**: 23 math + 9 resolution-engine integration tests, including the PRD's canonical rain wager and a 17×13 stress test

**Not built — Sprint 6+ / post-launch:**

- Public feed (`/feed`)
- Email notifications (Resend templates for "your wager closes in 24h", payment reminders, etc.)
- Report/flag system + admin moderation dashboard (schema is there, UI is not)
- AdSense application + integration (requires content + traffic first)

The PRD's "Build Order" section remains the canonical sprint list.

## Stack

- Next.js 15 / React 19
- TypeScript (strict)
- Prisma + Postgres (Neon recommended)
- Auth.js v5 (next-auth@beta) + @auth/prisma-adapter
- Resend (transactional email)
- Tailwind CSS
- nanoid (slugs), zod (validation), vitest (tests)

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Local dev server on :3000 |
| `npm run build` | Prisma generate + Next build |
| `npm run start` | Production server |
| `npm test` | Run all vitest tests |
| `npm run db:push` | Push schema to DB without migration history |
| `npm run db:migrate` | Create + apply a named migration |
| `npm run db:studio` | Prisma Studio (browser DB GUI) |

## Verifying locally

```bash
npm install
cp .env.example .env   # fill in DATABASE_URL, RESEND_API_KEY, AUTH_SECRET
npm run db:push
npm test               # 32 tests should pass
npm run dev            # http://localhost:3000
```

## Deploying

See [SETUP.md](./SETUP.md) for the Vercel + Porkbun + Neon walkthrough.

## License

TBD — source-available, not yet licensed for redistribution.
