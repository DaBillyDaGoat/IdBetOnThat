# Deploy scripts — idbetonthat to production

These are Windows batch files. Run them by double-clicking, in order:

| Script | Phase | When to run |
|---|---|---|
| `1-git-setup.bat` | A1 | First — initializes git, commits everything |
| `2-push-to-github.bat` | A2 | After creating the GitHub repo at github.com/new |
| `3-prod-db-push.bat` | E  | After Neon project is created and you have the DATABASE_URL |

In between scripts you'll be doing browser work (creating accounts, pasting env vars). Claude is watching your screen and will guide you.

## Manual phases (no script needed)

- **Phase B (Neon)**: Sign up at https://neon.tech → create project "idbetonthat" → copy connection string
- **Phase C (Resend)**: Sign up at https://resend.com → API Keys → create new key
- **Phase D (Vercel)**: Sign up at https://vercel.com → New Project → import GitHub repo → paste env vars → Deploy
- **Phase F (Domain)**: In Vercel → Settings → Domains → add `idbetonthat.com` → Vercel gives you DNS records → enter them in Porkbun's DNS tab
- **Phase G (Resend domain)**: After deploy works, verify `idbetonthat.com` in Resend so emails come from `noreply@idbetonthat.com`
- **Phase H (Smoke test)**: Open the live site, sign up, create a wager, place a bet from a 2nd account, resolve, check payout

## Env vars for Vercel

Have these handy when you're on the Vercel "Import" page:

```
DATABASE_URL    = (pooled Neon URL)
DIRECT_URL      = (same as DATABASE_URL for now; can switch to non-pooled later)
AUTH_SECRET     = OSuI6wmsTcD60PDc8k11vKFuyX1VR6L8jg4Z/ZO06DA=
AUTH_URL        = https://idbetonthat.com  (or leave blank initially, set after domain is attached)
RESEND_API_KEY  = re_... (from Resend)
EMAIL_FROM      = onboarding@resend.dev   (for now; switch to noreply@idbetonthat.com after Phase G)
CRON_SECRET     = ylp9jnm1sZjo+1CZnZR278ONZVGHreHH4YLPiR9bExg=
```

Vercel will use these for both build and runtime.
