# OwnState — Production Operations Guide

This document covers what's hardened, what's automated, and the **external setup
that only you can do** (accounts/keys I can't create). Work top-to-bottom before a
public launch.

---

## 1. Required database step (do this first)
Run these in the Supabase SQL Editor, in order:
1. `supabase/schema.sql`
2. `supabase/functions.sql`
3. `supabase/seed_functions.sql`
4. `supabase/fencing_functions.sql`
5. `supabase/storage.sql`
6. **`supabase/security_hardening.sql`** ← enforces all security rules in the DB
7. `supabase/verify_hardening.sql` ← should return 3 rows

The app calls `create_my_property` and `deal_advance`, which step 6 creates.
Without it, listing a property and advancing a deal will fail.

---

## 2. Environment variables
See `.env.example`. Mirror every one of these in **Vercel → Settings → Environment
Variables** (Production + Preview). Never commit `.env.local`.

| Var | Purpose | Where |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `_ANON_KEY` | Browser + server Supabase | Supabase → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only trusted writes (payments) | Supabase → API |
| `RAZORPAY_KEY_ID` / `_KEY_SECRET` | Create + verify payments (server) | Razorpay |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Opens Checkout (browser) | Razorpay |
| `RAZORPAY_WEBHOOK_SECRET` | Verifies the payment webhook | Razorpay → Webhooks |
| `NEXT_PUBLIC_APP_URL` | Absolute URLs / OG | your domain |

---

## 3. Payment webhook (REQUIRED for reliable payments) — your action
Without this, a buyer who pays then closes the tab before the browser `verify`
call leaves money taken but the deal stuck. The webhook reconciles it server-side.

1. Razorpay Dashboard → **Settings → Webhooks → Add New Webhook**
2. URL: `https://YOUR_DOMAIN/api/payment/webhook`
3. Active events: **`payment.captured`** and **`order.paid`**
4. Set a secret; put the same value in `RAZORPAY_WEBHOOK_SECRET`.

The endpoint is already built (`src/app/api/payment/webhook/route.ts`): it verifies
the signature over the raw body, finds the deal from the order notes, and marks it
`token_paid` **idempotently** (safe if both the webhook and the browser verify fire).

---

## 4. What's already done in code
- **Security:** DB-enforced (no self-verify / review-skip / cross-user writes /
  payment-skip), server-side zod validation on every write, secrets server-only.
- **Payments:** signature verified server-side; token amount computed server-side;
  idempotent `token_paid`; webhook recovery; per-IP rate limits on order/verify.
- **Rate limiting:** best-effort per-IP throttles on payment + enquiry endpoints
  (`src/lib/rate-limit.ts`) plus a DB per-user enquiry cap.
- **Observability:** structured JSON logger (`src/lib/logger.ts`) used in payments.
- **Tests:** 42 unit tests, 100% coverage of critical business logic
  (`tests/unit/`), run in CI.
- **CI gates:** typecheck + lint + tests + build must pass (`.github/workflows/ci.yml`).
- **Performance:** `next/image` for property images; hero video gated off
  mobile/data-saver.

---

## 5. Still needs YOUR accounts (not yet active)

### Error tracking (Sentry) — recommended
1. Create a Sentry project, copy the DSN.
2. `npm i @sentry/nextjs` and run `npx @sentry/wizard@latest -i nextjs`.
3. Set `NEXT_PUBLIC_SENTRY_DSN`. The logger already gives you structured events to
   attach as breadcrumbs.

### Bot protection (Cloudflare Turnstile) — recommended for public launch
1. Create a Turnstile widget; get site + secret keys.
2. Add the widget to the auth form and the enquiry form; verify the token
   server-side before `signUp` / `createEnquiry`. Env vars are stubbed in
   `.env.example` (`NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`).

### Shared-store rate limiting (Upstash / Vercel KV) — needed at scale
The in-memory limiter resets per serverless instance. For hard limits, back
`hit()` in `src/lib/rate-limit.ts` with Upstash Redis (`@upstash/ratelimit`). Call
sites don't change.

### End-to-end tests (Playwright) — the remaining test gap
Unit tests cover business logic; integration + E2E need a live seeded DB. Plan:
1. `npm i -D @playwright/test && npx playwright install`.
2. Add a `test:e2e` script and a separate CI job that:
   - spins up a disposable Supabase (or a seeded test project),
   - runs `npm run build && npm start`,
   - runs the journeys: signup→list→publish, search→save→enquire,
     pay-token (Razorpay test), fencing draw→save→reload, full buyer↔seller deal.
3. Use Razorpay **test** keys and the test card so payments don't charge.

---

## 6. Pre-launch checklist
- [ ] All 7 SQL files run; `verify_hardening.sql` returns 3 rows
- [ ] All env vars set in Vercel (Production + Preview)
- [ ] Razorpay webhook added + `RAZORPAY_WEBHOOK_SECRET` set
- [ ] Supabase Auth → URL config: production redirect URLs added
- [ ] One real run-through on a fresh account: signup → list → search → save →
      enquire → start deal → pay token (test) → fence land
- [ ] Sentry DSN set (or accept no error tracking for v1)
- [ ] Shrink `public/earth-hero.mp4` (37 MB) and host on a CDN before heavy traffic
