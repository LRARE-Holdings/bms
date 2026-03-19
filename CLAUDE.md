# CLAUDE.md — burn-public

## What this project is

The public-facing website and membership system for **Burn Mat Studio**, a Pilates and yoga studio owned by Lucy Healy, operating as a sole trader from TS16 0TA. This is the site visitors, members, and prospective clients interact with. Domain: **burnmatstudio.co.uk**

Burn Mat Studio is **tenant #1** on the Forma platform. This codebase is designed to be cloned per studio — Studio #2 gets the same repo deployed at their own domain with a different `STUDIO_ID`. All studio-specific data comes from the database, keyed by `STUDIO_ID`. The only things that change per clone are env vars, domain, and brand assets.

This is a paid client project — production quality is required throughout.

## Tech stack

- **Framework:** Next.js 16.2.0 (App Router, TypeScript, Tailwind CSS)
- **Database & Auth:** Supabase (PostgreSQL, Auth, Row-Level Security)
- **Payments:** Stripe (Checkout Sessions in payment mode, Webhooks, Customer Portal)
- **Email:** Resend (transactional email from burnmatstudio.co.uk)
- **Hosting:** Vercel (auto-deploy from GitHub)

## What this app handles

- Public marketing pages (homepage, classes, team, timetable, pricing, legal)
- Class browsing and weekly timetable with live spot counts
- Booking flow: browse → select class → Stripe Checkout or pack credit → booking confirmed
- Class pack purchasing via Stripe
- Member auth (signup/login), member dashboard (bookings, packs, profile)
- Stripe webhook handler (confirms payments, creates bookings, issues pack credits)
- Resend email triggers (booking confirmations, pack receipts, cancellations, welcome)
- Staff view: filtered timetable with attendee lists (read-only)
- Admin dashboard: class CRUD, schedule management, bookings, members, team, revenue

## Brand system

Exact colours sampled from logo files — configured as Tailwind custom colours:

| Token | Hex | Usage |
|---|---|---|
| Wheat | `#DFD0A5` | Primary brand, logo beige fill |
| Cocoa | `#473728` | Primary brand, logo brown fill |
| Gold | `#C4A95A` | CTAs, active states, primary buttons |
| Cream | `#F5F0E8` | Page background |
| Sand | `#E8DCC8` | Borders, dividers, card borders |
| Charcoal | `#1A1A1A` | Footer, dark surfaces |
| Slate | `#4A4A4A` | Body text |
| Warm Grey | `#8A8070` | Secondary text, captions |
| Ember | `#D4713A` | Live/active status, alerts, low availability |
| Blush | `#E8936A` | Soft highlights |

Typography:
- **Display/headings:** Cormorant Garamond (Google Fonts), fallback Georgia
- **Body/UI:** DM Sans (Google Fonts), fallback system-ui
- **Accent labels:** DM Sans uppercase, letter-spacing 0.1em+, gold on light backgrounds

Aesthetic: warm, earthy, premium but approachable. Generous whitespace. No harsh contrasts. Boutique wellness, not corporate gym.

Logo is custom lettering (not a font). Use the PNG assets as images. Beige logo on dark backgrounds, brown logo on light backgrounds. Do not regenerate or alter.

## Database schema (Supabase)

Shared multi-tenant DB with RLS. Every query scoped by `studio_id`.

### profiles (studio-agnostic)
`id` (uuid PK, = auth.users.id), `email` (text), `full_name` (text), `avatar_url` (text nullable), `created_at`, `updated_at`

This table has NO role or studio_id. It is a thin identity record — one row per human, shared across all studios. Roles are per-studio via studio_memberships.

### studio_memberships
`id` (uuid PK), `user_id` (uuid FK → profiles), `studio_id` (uuid FK → studios), `role` (enum: member | staff | admin), `created_at`

**UNIQUE constraint on (user_id, studio_id)** — one role per user per studio.

This is the multi-tenancy junction table. A single auth.users account can be a member at Burn, an instructor at Studio #2, or an admin at both. The current studio is resolved from the domain (or STUDIO_ID env var). All role checks query this table filtered by the current studio_id.

### studios
`id` (uuid PK), `name` (text), `slug` (text unique), `domain` (text), `email_from` (text, e.g. hello@burnmatstudio.co.uk), `email_domain` (text, e.g. burnmatstudio.co.uk), `branding` (jsonb — theme tokens, colours, fonts), `created_at`

Platform-level table. One row per Forma tenant. Referenced by studio_memberships and all studio-scoped tables. Burn is row #1.

### classes
`id` (uuid PK), `studio_id` (uuid FK → studios), `name` (text), `slug` (text unique per studio), `description` (text), `duration_mins` (int), `price_pence` (int), `image_url` (text nullable), `created_at`

Seed data (price in pence):

| Class | Slug | Duration | Price |
|---|---|---|---|
| Hot Pilates | hot-pilates | 45 min | 1550 |
| Hot Yoga | hot-yoga | 60 min | 1200 |
| Pilates Sculpt | pilates-sculpt | 45 min | 1200 |
| Cardio Pilates | cardio-pilates | 45 min | 850 |
| Beginners Pilates | beginners-pilates | 45 min | 1000 |
| Baby & Me Yoga | baby-me-yoga | 60 min | 850 |

### instructors
`id` (uuid PK), `studio_id` (uuid FK → studios), `name` (text), `slug` (text unique per studio), `bio` (text), `photo_url` (text nullable), `user_id` (uuid FK → profiles, nullable), `created_at`

Seed data:
- **Lucy** (slug: lucy) — Founder & Lead Instructor. Bio TBC.
- **Amelia Bennett** (slug: amelia) — Fully qualified Pilates instructor. Trained in dance, graduated with a First in Performing Arts from Wilkes Academy. Qualified in Mat and Reformer Pilates April 2025. Known for creative flows and building personal connections.
- **Takkiya Mastoor** (slug: takkiya, IG: @pilateswithtak) — Accredited Mat Pilates instructor and registered Dietitian specialising in renal. 3+ years across mental health, private 1:1, and weight management.

### schedule
`id` (uuid PK), `studio_id` (uuid FK → studios), `class_id` (uuid FK), `instructor_id` (uuid FK), `day_of_week` (int, 0=Mon to 6=Sun), `start_time` (time), `end_time` (time), `is_active` (bool default true), `created_at`

Static weekly template — same schedule repeats. Lucy edits at start of each month. Seed with placeholder slots (awaiting real timetable from Lucy).

### bookings
`id` (uuid PK), `studio_id` (uuid FK → studios), `schedule_id` (uuid FK), `user_id` (uuid FK → profiles), `date` (date — the specific occurrence), `status` (enum: confirmed | cancelled), `payment_method` (enum: stripe | pack_credit), `stripe_session_id` (text nullable), `created_at`

**UNIQUE constraint on (schedule_id, user_id, date)** — prevents double-booking.

### class_packs
`id` (uuid PK), `studio_id` (uuid FK → studios), `user_id` (uuid FK → profiles), `pack_type` (enum: 5 | 10), `credits_total` (int), `credits_remaining` (int), `purchased_at` (timestamptz), `expires_at` (timestamptz), `stripe_session_id` (text), `created_at`

- 5-pack: £37.50, expires 4 weeks from purchase
- 10-pack: £75.00, expires 6 weeks from purchase

### Row-Level Security

All studio-scoped tables (classes, instructors, schedule, bookings, class_packs) have a `studio_id` column. RLS policies use `studio_memberships` to determine access.

Helper function (reusable in policies):
```sql
get_user_role(p_studio_id uuid) RETURNS text
-- Returns the user's role at the given studio, or NULL if no membership
SELECT role FROM studio_memberships WHERE user_id = auth.uid() AND studio_id = p_studio_id
```

- **Public (anon):** SELECT on classes, instructors, schedule (filtered by studio_id — resolved from app context, not from auth)
- **Members:** Must have a studio_memberships row for the studio. SELECT/INSERT on bookings WHERE user_id = auth.uid() AND studio_id matches. SELECT on class_packs WHERE user_id = auth.uid() AND studio_id matches. SELECT/UPDATE on profiles WHERE id = auth.uid() (profiles is studio-agnostic, no studio_id filter needed)
- **Staff:** Member permissions PLUS SELECT on bookings WHERE studio_id matches AND schedule_id IN (schedules assigned to their instructor record at this studio)
- **Admin (role = admin at this studio):** Full SELECT/INSERT/UPDATE/DELETE on all tables WHERE studio_id matches
- **studio_memberships itself:** Users can SELECT their own rows. Admins can SELECT/INSERT/UPDATE/DELETE for their studio.

## Auth

Supabase Auth with email/password (magic link sign-in planned as a future addition). Single auth pool shared across all Forma tenants.

**Sign-up flow:**
1. User signs up on burnmatstudio.co.uk (or any studio domain)
2. Supabase creates `auth.users` row
3. Database trigger creates `profiles` row (studio-agnostic — just name + email)
4. The studio-specific signup page creates a `studio_memberships` row linking the user to the current studio with role = member

**Staff/admin accounts:** Created by the studio admin via the dashboard. The admin creates the Supabase Auth account (or invites via email), then creates a `studio_memberships` row with role = staff or admin.

**Role resolution at runtime:** Middleware reads the user's role from `studio_memberships` filtered by the current `STUDIO_ID`. A user could be admin at Burn and member at Studio #2 — the role depends on which domain they're on.

Middleware protects routes:
- `/account/*` — requires auth + membership at current studio (any role)
- `/staff/*` — requires auth + role = staff or admin at current studio
- `/dashboard/*` — requires auth + role = admin at current studio

Role-based redirect after login: admin → /dashboard, staff → /staff, member → /account.

**Cross-studio identity:** A user who already has an auth account (e.g. a Burn member) and signs up at Studio #2 doesn't create a new account — they get a new `studio_memberships` row. One login, multiple studios. For Burn as tenant #1, users will never see this complexity.

## Email strategy (Resend)

Single Resend account for all of Forma, with multiple verified sending domains.

**Transactional emails** (booking confirmations, pack receipts, cancellations, welcome): Sent via Resend from the studio's own domain. The `studios` table stores `email_from` and `email_domain` per tenant. API routes look up the current studio's sending config and pass it to Resend. Burn emails come from hello@burnmatstudio.co.uk.

**Auth emails** (confirmation links, password resets, magic links): Supabase sends these itself using a project-wide SMTP sender. Configured as auth@useforma.co.uk (Forma-branded). This is acceptable for launch — auth emails are functional, not brand-critical. When the Partner tier (white-label) launches, these can be moved to custom per-studio sending by disabling Supabase's built-in auth emails and handling them via Resend + edge functions.

React Email components with brand palette (cocoa header + wheat logo, cream body, gold CTA buttons, charcoal footer).

Templates:
- **Booking confirmation:** class name, date, time, instructor. "See you on the mat."
- **Pack purchase confirmation:** pack type, credits, expiry date
- **Booking cancellation:** confirmation + credit refunded note if applicable
- **Welcome:** sent on sign-up (from the studio domain, not the Forma auth domain)

## Pages

### Public (no auth)

**`/` (Homepage):** Full-viewport hero (cocoa bg, beige logo, headline "Move, breathe, burn.", tagline "Pilates · Yoga · Heat · Sculpt", gold CTA → /timetable). About preview section (photo placeholder + stats: 6 class types, 10 max per class, 3 instructors). Class highlights grid. Final CTA banner.

**`/classes`:** 6 class cards, responsive grid (3/2/1 col). Each: photo placeholder with gradient bg, price badge (cocoa pill), class name (Cormorant Garamond), duration label (gold uppercase), description. Data from classes table.

**`/team`:** 3 instructor cards. Photo placeholder, name, role label (gold uppercase), bio, class tags (pills). Responsive grid.

**`/timetable` (core page):** Weekly timetable from schedule joined to classes + instructors. Week header with date range and prev/next nav. Day tabs (Mon–Sun). Each slot: time, duration, colour-coded bar (Ember = hot classes, Gold = sculpt, Blush = cardio, Sand = beginners, Cocoa = baby & me), class name, instructor, price, spots remaining (10 minus confirmed bookings for that date), Book button.

Book button logic:
- Spots = 0 → disabled, shows "Full"
- Not logged in → prompt to log in / sign up
- Logged in with valid pack credits → modal: "1 credit will be used", confirm → POST /api/bookings/create, credit deducted, email sent
- Logged in without credits → modal: drop-in price, "Pay with Stripe" → redirect to Stripe Checkout via /api/checkout/session

**`/pricing`:** Left: pricing table (all 6 classes, name, duration, drop-in price). Right: two stacked pack cards. Top (cocoa bg, wheat text): 10 Class Pack, £75, £7.50/class, 6 weeks, "Best value" badge. Bottom (white, bordered): 5 Class Pack, £37.50, £7.50/class, 4 weeks. Buy buttons → /api/checkout/pack.

**`/privacy`, `/terms`, `/cookies`:** Legal pages covering data collected, purpose, third parties (Stripe, Resend, Supabase), retention, subject rights, booking terms, cancellation, pack terms, liability, session cookies. Lucy is data controller as sole trader.

### Member (auth required)

**`/account`:** Upcoming bookings (with cancel), past bookings, pack balance (credits remaining + expiry, or "No active pack" + buy link), link to Stripe Customer Portal.

**`/account/profile`:** Edit name and email.

### Staff (auth required, role = staff)

**`/staff`:** Filtered timetable — only classes where logged-in user is the assigned instructor. Each upcoming class: date, time, class name, expandable attendee list (names + emails). Read-only.

### Admin (auth required, role = admin)

**`/dashboard`:** Today's classes with booking counts, quick stats (total members, bookings this week, revenue this month).

**`/dashboard/classes`:** CRUD for class types. List, add, edit (name, description, duration, price, photo), delete.

**`/dashboard/timetable`:** Visual weekly grid. Add/edit/remove slots. Assign instructor. Duplicate week template.

**`/dashboard/bookings`:** View by day/week. Click slot → attendee list. Cancel booking on behalf of member.

**`/dashboard/members`:** List all members with search/filter. Click → profile, booking history, pack balance.

**`/dashboard/team`:** List instructors. Add/edit (name, bio, photo). Create a Supabase Auth account for a new instructor and create a `studio_memberships` row with role = staff.

## API routes

**POST `/api/checkout/session`** — Creates Stripe Checkout Session for drop-in booking. Receives: schedule_id, date. Looks up class for correct price. Metadata: { schedule_id, date, user_id }. Returns checkout URL.

**POST `/api/checkout/pack`** — Creates Stripe Checkout Session for pack purchase. Receives: pack_type (5 | 10). Metadata: { pack_type, user_id }. Returns checkout URL.

**POST `/api/webhooks/stripe`** — Handles Stripe webhooks. Verify signature. On checkout.session.completed:
- Metadata has schedule_id → drop-in booking. Create booking row (confirmed, stripe, session_id). Send confirmation email.
- Metadata has pack_type → pack purchase. Create class_packs row (correct credits, expiry). Send confirmation email.
- **Idempotency:** check if booking/pack already exists for this stripe_session_id before writing.

**POST `/api/bookings/create`** — Pack credit booking (no Stripe). Receives: schedule_id, date. Validates: user has valid non-expired pack with credits > 0, class not full (< 10 confirmed bookings), no duplicate booking. Decrements credits_remaining. Creates booking (pack_credit). Sends email.

**POST `/api/bookings/cancel`** — Receives: booking_id. Sets status = cancelled. If pack_credit → re-increment credits_remaining. If stripe → no auto refund (policy TBC). Sends cancellation email.

**GET `/api/timetable`** — Receives: week_start (date). Returns schedule slots for that week with booking counts per slot/date, joined with class + instructor data. Powers the spots-remaining display.

## Stripe products (8 total, all one-time payment mode)

| Product | Price | Metadata |
|---|---|---|
| Hot Pilates | £15.50 | class_slug: hot-pilates |
| Hot Yoga | £12.00 | class_slug: hot-yoga |
| Pilates Sculpt | £12.00 | class_slug: pilates-sculpt |
| Cardio Pilates | £8.50 | class_slug: cardio-pilates |
| Beginners Pilates | £10.00 | class_slug: beginners-pilates |
| Baby & Me Yoga | £8.50 | class_slug: baby-me-yoga |
| 5 Class Pack | £37.50 | pack_type: 5 |
| 10 Class Pack | £75.00 | pack_type: 10 |

Stripe Customer Portal enabled for payment method management.

## Environment variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
RESEND_API_KEY=
NEXT_PUBLIC_STUDIO_ID=
```

## Build order

1. Scaffold Next.js with Tailwind config (brand colours + fonts)
2. Supabase migration: all tables, RLS, seed data
3. Supabase Auth with profiles trigger
4. Public layout (nav with brown logo, footer with beige logo, cream bg)
5. Homepage
6. /classes
7. /team
8. /timetable (read-only first — display schedule + spot counts)
9. /pricing
10. Stripe products + checkout session API route
11. Stripe webhook handler
12. Booking flow on timetable (drop-in Stripe checkout)
13. Class pack purchase flow
14. Pack credit booking flow (deduct credit, no Stripe)
15. Auth pages (login, signup)
16. Member account pages (/account, /account/profile)
17. Staff view (/staff)
18. Admin dashboard (/dashboard + all sub-pages)
19. Resend email templates + integration
20. Legal pages (/privacy, /terms, /cookies)
21. Testing and polish
22. Deploy to Vercel, configure DNS, switch Stripe to live

## Conventions

- App Router file structure: `app/(public)/`, `app/(member)/`, `app/(staff)/`, `app/(admin)/`, `app/api/`
- Server Components by default; `"use client"` only when needed for interactivity
- All DB queries via Supabase client with RLS — never bypass with service role unless in API routes/webhooks
- Tailwind CSS with brand tokens as custom colours
- Components in `components/` with feature subdirectories (e.g. `components/booking/`, `components/timetable/`, `components/dashboard/`)
- API routes in `app/api/` for Stripe sessions, webhooks, server-side mutations
- Shared utilities in `lib/`: `lib/supabase.ts`, `lib/stripe.ts`, `lib/resend.ts`, `lib/auth.ts` (helper to resolve current user's role at current studio)
- All prices stored in pence in the database. Convert to pounds for display (`price_pence / 100`).
- Mobile-first responsive design. Many members book from their phones.

## Key rules

1. **Always scope queries by `studio_id`** — never fetch unscoped data.
2. **Webhook-driven payments** — bookings and pack credits only confirmed after Stripe webhook, never optimistically on the client.
3. **Double-booking prevention** — relies on the UNIQUE constraint on (schedule_id, user_id, date). Do not circumvent.
4. **Pack expiry enforced at query time** — always check validity before allowing a credit booking.
5. **Spots remaining = 10 - COUNT(confirmed bookings for that slot + date).** All classes capped at 10.
6. **Credits not cash** — class packs grant credits. No partial refunds on packs.
7. **Payment mode only** — Stripe Checkout Sessions in payment mode. No subscriptions. No Stripe Connect (that's a Forma platform concern, not a per-studio concern).
8. **Idempotent webhooks** — always check if a record already exists for a stripe_session_id before writing.
9. **Roles are per-studio, not per-user** — a user's role comes from `studio_memberships` filtered by the current `STUDIO_ID`. Middleware AND RLS enforce access. Not just UI hiding.