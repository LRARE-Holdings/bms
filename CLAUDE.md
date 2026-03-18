You are building a complete membership management system and website for a Pilates studio called Burn Mat Studio. The domain is burnmatstudio.co.uk. The client is Lucy, a sole trader. This is a paid client project — production quality is required throughout.

## Tech Stack
- Next.js 16.2.0 (App Router, TypeScript, Tailwind CSS)
- Supabase (PostgreSQL database, Auth, Row-Level Security)
- Stripe (Checkout Sessions in payment mode, Webhooks, Customer Portal)
- Resend (transactional email from burnmatstudio.co.uk)
- Vercel (hosting, auto-deploy from GitHub)

## Brand System
Exact colours sampled from logo files — use these as Tailwind CSS custom colours:
- Wheat: #DFD0A5 (primary brand, logo beige fill)
- Cocoa: #473728 (primary brand, logo brown fill)
- Gold: #C4A95A (CTAs, active states, primary buttons)
- Cream: #F5F0E8 (page background)
- Sand: #E8DCC8 (borders, dividers, card borders)
- Charcoal: #1A1A1A (footer, dark surfaces)
- Slate: #4A4A4A (body text)
- Warm Grey: #8A8070 (secondary text, captions)
- Ember: #D4713A (live/active status, alerts, low availability)
- Blush: #E8936A (soft highlights)

Typography:
- Display/headings: Cormorant Garamond (Google Fonts), fallback Georgia
- Body/UI: DM Sans (Google Fonts), fallback system-ui
- Accent labels: DM Sans uppercase, letter-spacing 0.1em+, gold on light backgrounds

The overall aesthetic is warm, earthy, premium but approachable. Generous whitespace. No harsh contrasts. Think boutique wellness, not corporate gym.

## Database Schema (Supabase)

### profiles
id (uuid PK, = auth.users.id), email (text), full_name (text), role (text enum: 'member'|'staff'|'admin'), created_at (timestamptz), updated_at (timestamptz)

### classes
id (uuid PK), name (text), slug (text unique), description (text), duration_mins (int), price_pence (int), image_url (text nullable), created_at (timestamptz)

Seed data (price in pence):
- Hot Pilates, hot-pilates, 45 min, 1550
- Hot Yoga, hot-yoga, 60 min, 1200
- Pilates Sculpt, pilates-sculpt, 45 min, 1200
- Cardio Pilates, cardio-pilates, 45 min, 850
- Beginners Pilates, beginners-pilates, 45 min, 1000
- Baby & Me Yoga, baby-me-yoga, 60 min, 850

### instructors
id (uuid PK), name (text), slug (text unique), bio (text), photo_url (text nullable), user_id (uuid FK to profiles, nullable — links to auth for staff login), created_at (timestamptz)

Seed data:
- Lucy (slug: lucy) — Founder & Lead Instructor. Bio TBC.
- Amelia Bennett (slug: amelia) — Fully qualified Pilates instructor. Trained in dance, graduated with a First in Performing Arts from Wilkes Academy. Qualified in Mat and Reformer Pilates April 2025. Known for creative flows and building personal connections with clients.
- Takkiya Mastoor (slug: takkiya, Instagram: @pilateswithtak) — Accredited Mat Pilates instructor and registered Dietitian specialising in renal. 3+ years as a Dietitian across mental health, private 1:1, and weight management.

### schedule
id (uuid PK), class_id (uuid FK), instructor_id (uuid FK), day_of_week (int, 0=Mon to 6=Sun), start_time (time), end_time (time), is_active (bool default true), created_at (timestamptz)

The timetable is static weekly — same schedule repeats. Lucy edits it occasionally at the start of each month. Seed with placeholder slots across the week for now (we're awaiting the real timetable from Lucy).

### bookings
id (uuid PK), schedule_id (uuid FK), user_id (uuid FK to profiles), date (date — the specific occurrence), status (text enum: 'confirmed'|'cancelled'), payment_method (text enum: 'stripe'|'pack_credit'), stripe_session_id (text nullable), created_at (timestamptz)

UNIQUE constraint on (schedule_id, user_id, date) to prevent double-booking.

### class_packs
id (uuid PK), user_id (uuid FK to profiles), pack_type (text enum: '5'|'10'), credits_total (int), credits_remaining (int), purchased_at (timestamptz), expires_at (timestamptz), stripe_session_id (text), created_at (timestamptz)

5-pack: £37.50, expires 4 weeks from purchase. 10-pack: £75.00, expires 6 weeks from purchase.

### Row-Level Security
- Public (anon): SELECT on classes, instructors, schedule
- Members: SELECT/INSERT on bookings WHERE user_id = auth.uid(). SELECT on class_packs WHERE user_id = auth.uid(). SELECT/UPDATE on profiles WHERE id = auth.uid()
- Staff: same as member, PLUS SELECT on bookings WHERE schedule_id IN (SELECT id FROM schedule WHERE instructor_id IN (SELECT id FROM instructors WHERE user_id = auth.uid()))
- Admin (role = 'admin'): full SELECT/INSERT/UPDATE/DELETE on all tables

## Auth
Supabase Auth with email/password. On sign-up, create a profiles row with role = 'member' via a database trigger or post-signup hook. Staff accounts created manually by admin with role = 'staff'. One admin account for Lucy with role = 'admin'.

Middleware protects routes:
- /account/* — requires auth, role = member (or any authenticated)
- /staff/* — requires auth, role = staff
- /dashboard/* — requires auth, role = admin

Role-based redirect after login: admin → /dashboard, staff → /staff, member → /account

## Public Pages (no auth required)

### / (Homepage)
Full-viewport hero section with dark background (cocoa), logo (beige variant), headline "Move, breathe, burn.", tagline "Pilates · Yoga · Heat · Sculpt", and gold CTA button "Book a class" linking to /timetable. Below: about preview section (split layout — photo placeholder left, text + stats right: 6 class types, 10 max per class, 3 instructors). Class highlights grid. Final CTA banner.

### /classes
6 class cards in a responsive grid (3-col desktop, 2-col tablet, 1-col mobile). Each card has: photo placeholder area with subtle gradient background per class type, price badge (cocoa pill, top-right), class name (Cormorant Garamond), duration label (gold uppercase), description paragraph. All data from the classes table.

### /team
3 instructor cards. Each has: photo placeholder, name (Cormorant Garamond), role label (gold uppercase), bio paragraph, class tags (small pills showing which classes they teach). Responsive grid.

### /timetable
This is the core page. Weekly timetable fetched from schedule table joined to classes and instructors.

UI: Week header showing date range with prev/next navigation. Day tabs (Mon–Sun) — clicking a tab shows that day's classes. Each slot shows: time, duration, colour-coded bar (Ember for hot classes, Gold for sculpt, Blush for cardio, Sand for beginners, Cocoa for baby & me), class name, instructor name, price, spots remaining (10 minus confirmed bookings for that specific date), and a Book button.

Book button behaviour:
- If spots = 0: disabled, shows "Full"
- If user not logged in: clicking opens a prompt to log in or sign up
- If user logged in with valid pack credits: opens modal confirming "1 credit will be used", user confirms, booking created via /api/bookings/create, credit deducted, confirmation email sent
- If user logged in without credits: opens modal showing drop-in price, user clicks "Pay with Stripe", redirects to Stripe Checkout via /api/checkout/session

### /pricing
Left column: pricing table listing all 6 classes with name, duration, and drop-in price. Right column: two class pack cards stacked. Top card (cocoa background, wheat text): 10 Class Pack, £75, £7.50/class, use within 6 weeks, "Best value" badge. Bottom card (white, bordered): 5 Class Pack, £37.50, £7.50/class, use within 4 weeks. Each has a buy button linking to /api/checkout/pack.

### /privacy, /terms, /cookies
Legal pages. Draft reasonable content covering: data collected (name, email, booking history), purpose (processing bookings, sending confirmations), third parties (Stripe for payments, Resend for email, Supabase for storage), data retention, data subject rights, contact details. Terms covering booking contract, cancellation policy, pack terms, liability. Cookie policy covering session cookies. Lucy is the data controller as a sole trader.

## Member Pages (auth required, role = member)

### /account
Dashboard showing: upcoming bookings (with cancel button), past bookings, class pack balance (credits remaining, expiry date, or "No active pack" with link to buy one), and a link to Stripe Customer Portal for payment management.

### /account/profile
Edit name and email.

## Staff Pages (auth required, role = staff)

### /staff
Filtered timetable showing only classes where the logged-in user is the assigned instructor. For each of their upcoming classes: date, time, class name, and an expandable attendee list showing booked member names and emails. Read-only — no edit capabilities.

## Admin Pages (auth required, role = admin)

### /dashboard
Overview: today's classes with booking counts, quick stats (total members, bookings this week, revenue this month via Stripe).

### /dashboard/classes
CRUD for class types. List all classes, add new, edit existing (name, description, duration, price, photo), delete.

### /dashboard/timetable
Visual weekly grid. Add/edit/remove schedule slots. Assign instructor to each slot. Ability to duplicate the current week template.

### /dashboard/bookings
View bookings by day or week. Click into a slot to see the attendee list. Cancel a booking on behalf of a member.

### /dashboard/members
List all members with search/filter. Click into a member to see their profile, booking history, and pack credit balance.

### /dashboard/team
List instructors. Add/edit instructor (name, bio, photo). Create a Supabase Auth account for a new instructor and set their role to 'staff'.

## API Routes

### POST /api/checkout/session
Creates a Stripe Checkout Session in payment mode for a drop-in class booking. Receives: schedule_id, date. Looks up the class to get the correct Stripe Price. Passes metadata: { schedule_id, date, user_id }. Returns the checkout session URL.

### POST /api/checkout/pack
Creates a Stripe Checkout Session for a class pack. Receives: pack_type ('5' or '10'). Uses the correct Stripe Price (£37.50 or £75.00). Passes metadata: { pack_type, user_id }. Returns the checkout session URL.

### POST /api/webhooks/stripe
Handles Stripe webhook events. Verify signature with webhook secret. On checkout.session.completed:
- If metadata contains schedule_id → it's a drop-in booking. Create booking row in Supabase (status: confirmed, payment_method: stripe, stripe_session_id). Send booking confirmation email via Resend.
- If metadata contains pack_type → it's a pack purchase. Create class_packs row with correct credits_total, credits_remaining, and expires_at (4 weeks for 5-pack, 6 weeks for 10-pack). Send pack confirmation email via Resend.
- Idempotency: check if a booking/pack already exists for this stripe_session_id before writing.

### POST /api/bookings/create
For pack credit bookings (no Stripe involved). Receives: schedule_id, date. Checks user has valid non-expired pack with credits_remaining > 0. Checks class is not full (bookings count < 10). Checks no duplicate booking. Decrements credits_remaining by 1. Creates booking row (payment_method: pack_credit). Sends confirmation email. Returns success.

### POST /api/bookings/cancel
Receives: booking_id. Sets booking status to 'cancelled'. If payment_method was pack_credit, increment the pack's credits_remaining by 1. If payment_method was stripe, no automatic refund (refund policy TBC). Sends cancellation email.

### GET /api/timetable
Receives: week_start (date). Returns schedule slots for that week with booking counts per slot per date, joined with class and instructor data. Used by the timetable page to show spots remaining.

## Email (Resend)
Domain: burnmatstudio.co.uk. From address: hello@burnmatstudio.co.uk.
Build emails as React Email components with the brand palette (cocoa header with wheat logo, cream body, gold CTA buttons, charcoal footer).

Templates:
- Booking confirmation: class name, date, time, instructor, "See you on the mat."
- Pack purchase confirmation: pack type, credits, expiry date
- Booking cancellation: confirmation of cancellation, credit refunded note if applicable
- Welcome email: sent on sign-up

## Stripe Products to Create
8 products total, all one-time payment mode:
1. Hot Pilates — £15.50 (metadata: class_slug: hot-pilates)
2. Hot Yoga — £12.00 (metadata: class_slug: hot-yoga)
3. Pilates Sculpt — £12.00 (metadata: class_slug: pilates-sculpt)
4. Cardio Pilates — £8.50 (metadata: class_slug: cardio-pilates)
5. Beginners Pilates — £10.00 (metadata: class_slug: beginners-pilates)
6. Baby & Me Yoga — £8.50 (metadata: class_slug: baby-me-yoga)
7. 5 Class Pack — £37.50 (metadata: pack_type: 5)
8. 10 Class Pack — £75.00 (metadata: pack_type: 10)

Enable Stripe Customer Portal for payment method management.

## Build Order
1. Scaffold Next.js project with Tailwind config using the brand colours and fonts
2. Create Supabase migration with all tables, RLS policies, and seed data
3. Set up Supabase Auth with profiles trigger
4. Build public layout (nav with brown logo, footer with beige logo, cream background)
5. Build homepage
6. Build /classes page
7. Build /team page
8. Build /timetable page (read-only first — just display the schedule with spot counts)
9. Build /pricing page
10. Set up Stripe products and API route for checkout sessions
11. Set up Stripe webhook handler
12. Add booking flow to timetable (drop-in Stripe checkout)
13. Add class pack purchase flow
14. Add pack credit booking flow (deduct credit, no Stripe)
15. Build auth pages (login, signup)
16. Build member account pages (/account, /account/profile)
17. Build staff view (/staff)
18. Build admin dashboard (/dashboard and all sub-pages)
19. Build Resend email templates and integrate
20. Build legal pages (/privacy, /terms, /cookies) with consent checkbox on booking
21. Testing and polish
22. Deploy to Vercel, configure DNS, switch Stripe to live

## Important Notes
- All prices stored in pence in the database to avoid floating-point issues. Convert to pounds for display (price_pence / 100).
- The timetable is a static weekly template. Bookings reference a schedule slot + a specific date. Spots remaining = 10 - COUNT(bookings WHERE schedule_id = X AND date = Y AND status = 'confirmed').
- Class packs are a credit system, not Stripe subscriptions. No recurring billing.
- Lucy is not technical. The admin dashboard must be intuitive — clear labels, confirmation dialogs before destructive actions, no jargon.
- Three user roles sharing one auth system. Middleware and RLS enforce access, not just UI hiding.
- The logo is custom lettering (not a font). Use the PNG assets as images. Beige logo on dark backgrounds, brown logo on light backgrounds.
- Mobile-first responsive design. Many members will book from their phones.