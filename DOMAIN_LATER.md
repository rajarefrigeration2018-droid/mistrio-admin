# Running without a domain (and adding one later)

You do not need a domain to build, test or even run a closed Play Store test.
Everything works on the free subdomains Railway and Vercel give you.

## What you use now

| Piece | URL you get free | Where you set it |
|---|---|---|
| Backend API | `https://mistrio-backend-production.up.railway.app` | Railway → Settings → Networking → Generate Domain |
| Admin console | `https://mistrio-admin.vercel.app` | Vercel gives this automatically |
| Marketing site | not needed yet | — |

Set these three variables and everything connects:

**Railway (backend):**
```
CORS_ORIGINS=https://mistrio-admin.vercel.app
```
Use `*` while you are still developing, then narrow it to the line above.

**Vercel (admin console):**
```
NEXT_PUBLIC_API_URL=https://mistrio-backend-production.up.railway.app/api
```

**Flutter apps** — put the same URL in `lib/core/constants/app_constants.dart`:
```dart
static const String apiBaseUrl =
    'https://mistrio-backend-production.up.railway.app/api';
```

## Important: keep the base URL in ONE place

In each Flutter app, the API URL must appear exactly once, in
`app_constants.dart`. Every other file reads it from there. When you buy the
domain you change one line and rebuild — not twenty files.

Same rule for the admin console: only `lib/api.ts` reads
`NEXT_PUBLIC_API_URL`. Nothing else should mention a host.

## What a Railway URL does NOT block

- Firebase Phone Auth — works fine, it never sees your backend URL
- Razorpay — test and live both work; the webhook just points at Railway
- Supabase Storage — public file URLs come from Supabase, not from you
- Play Store closed testing — no domain required
- Google Sign-In — not used here; you are on phone OTP

## What a Railway URL DOES block

Only two things, and both come at public launch:

1. **Play Store production listing** wants a privacy policy URL on a page you
   control. A free option works for testing, but a real domain looks credible.
2. **Trust.** Customers who see a `railway.app` address in a payment flow
   hesitate. This matters for conversion, not for function.

## When you buy the domain — the whole checklist

Say you buy `mistrio.in`. Plan for two hostnames:

- `mistrio.in` → marketing site (later) or redirect to the app
- `api.mistrio.in` → the backend
- `admin.mistrio.in` → the console

**Step 1 — Backend (Railway)**
1. Railway → Settings → Networking → Custom Domain → `api.mistrio.in`
2. Railway shows a CNAME target; add it at your registrar
3. Wait for the green tick, then confirm `https://api.mistrio.in/health` responds

**Step 2 — Console (Vercel)**
1. Vercel → Project → Settings → Domains → add `admin.mistrio.in`
2. Add the CNAME the panel gives you
3. Change the Vercel env var to `https://api.mistrio.in/api` and redeploy

**Step 3 — Backend CORS**
```
CORS_ORIGINS=https://admin.mistrio.in,https://mistrio.in
```
Redeploy.

**Step 4 — Razorpay webhook**
Dashboard → Settings → Webhooks → edit the URL to
`https://api.mistrio.in/api/payments/webhook`. Keep the old one active for a
day so nothing in flight is lost.

**Step 5 — Flutter apps**
Change the one line in `app_constants.dart`, bump `versionCode`, rebuild, and
push a new build to the Play Store.

**Step 6 — Legal URLs in the database**
These are stored in `app_config`, so no deploy is needed. Update from the
console under Settings, or run:
```sql
update app_config set value = '"https://mistrio.in/terms"'   where key = 'terms_url';
update app_config set value = '"https://mistrio.in/privacy"' where key = 'privacy_url';
update app_config set value = '"https://mistrio.in/refund"'  where key = 'refund_policy_url';
```

**Step 7 — Support details**
Also in `app_config`: `support_phone`, `support_whatsapp`, `support_email`.
Set the real values before you take a single live booking.

## Before you buy, check these three

1. `.in` and `.com` both available at your registrar
2. `@mistrio` free on Instagram and YouTube
3. Nothing conflicting in the trademark search at ipindia.gov.in,
   classes 37 (repair services) and 35 (retail)

Buy the domain, the social handles and the Google Workspace email on the same
day. Handles get taken by people watching new registrations.
