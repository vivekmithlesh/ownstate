# OwnState — Own Anything. Anywhere. On Earth.

A full-stack real-estate platform to **buy, sell, rent, and lease any property on the planet** — from a village plot to a private island — fully online, no agent required. Its signature feature is **Digital Land Fencing**: trace your land's boundary on satellite imagery and save it precisely as a PostGIS geo-polygon.

> Built brick-by-brick as a production-minded MNC engineering exercise. See [`AGENTS.md`](./AGENTS.md) for the team/standards and [`BUILD_GUIDE.md.txt`](./BUILD_GUIDE.md.txt) for the brick specs.

## Features

- 🌍 **Cinematic 3D Earth hero** — scroll-driven React Three Fiber globe with procedural Earth, atmosphere, and surface storytelling markers.
- 🔎 **Search + Map** — real listings on Leaflet/OpenStreetMap with PostGIS bounds queries.
- 🏠 **Property listings** — 7-step wizard with Supabase Storage image upload.
- 🛡️ **Digital Land Fencing** — Leaflet-Geoman polygon drawing → `geography(Polygon,4326)` in PostGIS, area in acres.
- 🤝 **Deal Room + Payments** — 5-stage deal lifecycle with real chat and Razorpay (TEST) booking-token payments, verified server-side.
- 👤 **Auth + Dashboard** — Supabase auth, my listings, saved, enquiries, fencing.
- ⌨️ **Cmd/Ctrl+K palette** — live search over real properties.
- 📱 Responsive (375px → 1280px), themed error/404, skeletons, SEO (sitemap, robots, OG).

## Tech stack

| Layer | Tech |
|------|------|
| Framework | Next.js 16 (App Router, Server Components, Server Actions) |
| Language | TypeScript |
| Database | Supabase Postgres + **PostGIS**, Row Level Security |
| Auth & Storage | Supabase Auth, Supabase Storage |
| Maps | Leaflet + OpenStreetMap, Esri World Imagery, Leaflet-Geoman, Turf |
| 3D | React Three Fiber, drei, postprocessing |
| Data | React Query, Zod, react-hook-form |
| Payments | Razorpay (TEST mode) |
| Styling | Tailwind CSS, Base UI, lucide-react, sonner |

## Prerequisites

- Node.js 20+ and npm
- A [Supabase](https://supabase.com) project (with the **PostGIS** extension enabled)
- A [Razorpay](https://razorpay.com) account (Test Mode) for the Deal Room

## Getting started

```bash
git clone https://github.com/vivekmithlesh/ownstate.git
cd ownstate
npm install
cp .env.example .env.local   # then fill in the values below
```

### Environment variables (`.env.local`)

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>   # server-only, never exposed to the client
DATABASE_URL=<pooled connection string>
DIRECT_URL=<direct connection string>

# Razorpay (Test Mode)
RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_test_xxxxxxxx

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000   # set to the live URL in production
```

> `.env.local` is gitignored — secrets never get committed.

### Database setup (Supabase → SQL Editor)

1. Enable the **postgis** extension (Database → Extensions).
2. Run these SQL files **in order** (paste each into the SQL Editor and run):

   | Order | File | Purpose |
   |------|------|---------|
   | 1 | `supabase/schema.sql` | Tables, RLS, PostGIS columns, indexes, new-user trigger |
   | 2 | `supabase/functions.sql` | Geo RPCs (bounds/nearby) + insert helpers |
   | 3 | `supabase/seed_functions.sql` | Seed RPC |
   | 4 | `supabase/storage.sql` | Storage buckets + policies |
   | 5 | `supabase/fencing_functions.sql` | `insert_boundary` + GeoJSON view |

3. Seed real demo data:

   ```bash
   npm run seed     # populates real listings
   # npm run reset  # clears seeded data
   ```

### Run

```bash
npm run dev      # http://localhost:3000
```

## Scripts

| Command | Description |
|--------|-------------|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build (runs the TypeScript check) |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |
| `npm run seed` | Seed real listings into Supabase |
| `npm run reset` | Remove seeded data |

## Deployment (Vercel)

1. Push to GitHub and import the repo at [vercel.com/new](https://vercel.com/new).
2. Add **all** the `.env.local` variables in the Vercel project settings — set `NEXT_PUBLIC_APP_URL` to the live URL.
3. Deploy.
4. In **Supabase → Authentication → URL Configuration**, add the Vercel URL to the Site URL and Redirect URLs so email auth works in production.

CI (`.github/workflows/ci.yml`) runs a typecheck (`tsc --noEmit`) and a production build on every push and PR to `main`.

## Project structure

```
src/
  app/                 # App Router routes
    (site)/            # Public pages: home, search, property, list, deal
    dashboard/         # Auth-gated dashboard + sub-pages
    api/payment/       # Razorpay create-order + verify routes
  components/
    earth/             # 3D Earth hero (R3F)
    fencing/           # Land fencing map + form
    deal/              # Deal Room UI
    search/ property/  # Maps, cards, panels
    ui/                # Design system primitives
  lib/
    actions/           # Server actions (properties, deals, fencing, …)
    supabase/          # Server/client/middleware clients
    auth.ts            # Auth helpers
  types/database.ts    # Domain types mirroring the schema
supabase/              # SQL: schema, functions, storage, fencing, seed
scripts/               # seed / reset
```

## Notes

- Money is stored as **BIGINT paise** (₹1 = 100 paise) to avoid float errors.
- Geography columns use **SRID 4326** (WGS84). RLS is enabled on every table.
- Payments run in Razorpay **TEST mode**; signatures are verified server-side only.

---

**OwnState — Own Anything. Anywhere. On Earth.**
