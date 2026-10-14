# Aureatein x Apex

## Start
`npm ci` then `npm run dev`. Build: `npm run build`.

## Activate real accounts
1. Create a Supabase project. Enable Email authentication and email confirmations.
2. Run `supabase/aureatine-full-setup.sql` in the Supabase SQL Editor.
3. Copy `.env.example` to `.env`. Set the project URL and public publishable key. NEVER use a service-role key in the frontend.
4. Configure Authentication > URL Configuration: set your deployed Site URL and add exact allowed redirect URLs for `/login` and `/reset-password` on your domain (and the preview domain if testing there).
5. Configure production SMTP, authentication rate limits, password policy (12+ characters), and email templates in Supabase. Restart Vite after changing environment values.
6. Test signup, confirmation, login, logout, password recovery, and expired recovery links with a test email before launch. Sessions are handled by Supabase; no custom password storage.

Without configuration, the UI explicitly says accounts are pending. It never pretends that a signup, login, or reset email succeeded.

## Rewards
Wallets are created with zero points on signup. Row-level security permits users to read only their own balance; browser clients cannot award or change points. The plus button explains earning, not crediting points. Grant points only from trusted administration/server code after verified activity. A ledger, idempotent award endpoint, redemption transactions, and finalized business rules are needed before real earning/redemption launches. No rewards or costs are invented.

## Assets still needed
- Exact gym Google Maps listing/link, address, hours, gym information.
- Authorized gym photographs and approved Google review integration/content. Do not scrape or fabricate ratings/reviews.
- Points PNG (temporary SVG star currently used).
- Actual product menu, prices, ingredients, allergen and nutrition information.
- Optional founder bios/roles.

The shake photo is AI-generated conceptual imagery and labeled accordingly. Map and reviews are explicit placeholders. No invented gym address, ratings, benefits, or nutrition claims.

## Routes and deployment
Routes: `/`, `/about`, `/rewards`, `/login`, `/signup`, `/forgot-password`, `/reset-password`. On static hosting, rewrite all non-file routes to `/index.html` (SPA fallback). `public/_redirects` supports Netlify-style hosts.

## Privacy / launch readiness
Add your real privacy policy and any legally required consent/terms before production. Do not collect real users until backend policies, email delivery, recovery links, and deployment have been tested. This delivery is a frontend and backend schema, not a connected live authentication service.

## Updated Visit Us implementation
Gym location now uses the supplied APEX Fitness Gym listing and a free Google Maps embed with no custom overlay. Reviews button opens the Google listing (select its Reviews tab). No review feed/API, copied review data, or gym media gallery. The earlier request for gym photos is superseded: user explicitly does not want gym photos/videos. The existing shake concept image remains separate from gym media. Verify Google's embedded location pin in the public preview before launch; the exact-listing link is included as fallback.

## Community leaderboard
New route: `/leaderboard`. The leaderboard is included in `supabase/aureatine-full-setup.sql`; run only that full file as the trusted database owner. The public read-only view deliberately exposes ONLY opt-in display names, points and computed all-time rank. Users cannot edit wallet points. Equal points share a rank. The UI lists/searches the top 50 returned members, not a full user directory.
Signed-in members can explicitly opt in with a display name and consent checkbox, change it, or remove themselves. No email addresses or user IDs are exposed publicly. Display-name moderation and a public privacy policy should be established before launch. Without Supabase, no fake rows or points appear; refresh is disabled and joining directs to real account setup. Authenticated opt-in and database permissions require testing against your connected project before production.

## Planned staff QR workflow
“How it works” now describes the requested gym/purchase scan program and monthly events. It is informational, not a working QR scanner. Before launch: implement opaque revocable member QR tokens, authenticated staff roles for both businesses, server-side verification, replay/idempotency controls, scan/points audit ledger, business-approved point rates and qualifying activity rules, plus event eligibility/reward handling. Never encode secrets or grant wallet write access to member browsers. Existing wallets remain read-only to members.

## Production sign-in configuration repair
The deployed efd01aa bundle lacked the Supabase project URL and compiled sign-in into the “Accounts are not connected yet” fallback. Local builds had silently relied on `.env.local`, which correctly stays out of Git. The prepared `.env.production` now includes the existing project URL and public publishable key (not a service-role/admin secret). RLS remains essential and unchanged. Existing Vercel environment overrides take precedence: remove any blank/stale override or set these same two public values for Production, then redeploy.

`vite.config.js` now rejects builds missing VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY or using the URL placeholder. A fresh isolated production build without `.env.local` passed and contained the expected project URL; removing the production configuration correctly failed the build. The project's public Auth settings endpoint responded HTTP200. Actual member sign-in was not attempted. Local and live origins keep separate sessions; members must sign in again on live. No new SQL, user migration or admin key is required for this configuration repair. This repair is prepared locally, not yet deployed.
