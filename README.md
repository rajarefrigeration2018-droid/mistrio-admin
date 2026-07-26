# Mistrio Console

Operations console for Mistrio — dispatch, technicians, catalogue and revenue.
Next.js 14 (App Router), Tailwind, TypeScript. Built mobile-first: the owner
runs this from a phone.

## Setup (GitHub Codespaces)

```bash
npm install
cp .env.example .env.local     # set NEXT_PUBLIC_API_URL
npm run dev
```

Open the forwarded port and sign in with the admin account seeded by the
backend schema.

## Deploy (Vercel)

1. Import the repo at vercel.com
2. Add the environment variable `NEXT_PUBLIC_API_URL`
   (e.g. `https://api.mistrio.in/api` — no trailing slash)
3. Deploy

## Design notes

**Needs you now comes first.** Revenue cards are the usual opener for an admin
dashboard, but they are a vanity read. The first block on this screen is the
list of things that lose money while they sit: unassigned bookings, technicians
waiting on approval, payouts to release, parts running low. Revenue is second.

**The status rail.** Every row that represents a job carries a solid colour bar
on its left edge, keyed to status. The board can be read at arm's length without
reading any words. Colours are defined once in `lib/format.ts` — change them
there and the whole console follows.

**Mono for data.** Booking codes, money and counts use IBM Plex Mono with
tabular figures so columns line up and `MST-260726-0001` stays legible. Prose
uses IBM Plex Sans. The pairing is deliberate: an engineering face for a trade.

**Language.** All interface text is English. Labels describe what the operator
sees, not what the database stores — "Needs technician", not "status=confirmed".

## Structure

```
app/
  layout.tsx           fonts, auth provider
  page.tsx             redirects to /dashboard or /login
  login/page.tsx
  (dash)/
    layout.tsx         auth guard + shell
    dashboard/page.tsx
components/
  Shell.tsx            sidebar (desktop) + bottom bar (mobile)
  ui.tsx               Button, Card, StatusChip, Rail, Empty, Skeleton
lib/
  api.ts               fetch wrapper, token, envelope unwrapping
  auth.tsx             session context, permission checks
  format.ts            money, dates, status vocabulary
```

## Adding a screen

1. Create `app/(dash)/<name>/page.tsx`
2. Add it to `GROUPS` in `components/Shell.tsx` with the matching permission key
3. Fetch with `api('/admin/<endpoint>')` — the token and error handling are automatic

Permission keys come from `GET /api/admin/permissions`.
