
## Owner/admin labels — prepared locally, NOT pushed or executed
- @gianpogi: ADMIN label + existing limited admin/staff access (one-time seed from exact confirmed username).
- @apex.fg: ADMIN label + existing limited admin/staff access + OWNER label (display only; grants no extra database powers).
- Both are granted only by the one full SQL file; a reused username inherits nothing.
- Badges show on leaderboard, public profiles, admin member list, and own account (OWNER via new get_my_owner_status).
- Checks: owner-labels-sql PASS; admin/leaderboard-profile/own-ranking/community/full/leaderboard-photos SQL PASS; browser checks PASS; build PASS.
- Not yet in GitHub: the latest push (182be2a) predates these edits. Requires new authorized upload plus applying the updated full SQL file. No live SQL run.

## Email confirmation redirect + green/red status labels — prepared, NOT deployed
- Sign-up now shows a "Check your email to confirm your account." page with the entered email and a resend button.
- Confirmation links return to the public site (https://aureatine.cc.cd/confirm/), not localhost:3000. Production build reads VITE_PUBLIC_SITE_URL from .env.production.
- /confirm: green "you are logged in" label on success; red error label for expired, cancelled or invalid links.
- Login/sign-up messages: green on success, red on error; green flash on the account page after login.
- REQUIRED in Supabase dashboard (not changeable from code): Authentication > URL Configuration: Site URL = https://aureatine.cc.cd ; Redirect URLs include https://aureatine.cc.cd/confirm/ and https://aureatine.cc.cd/reset-password/ (plus http://localhost:5179/** for local testing only). Without this, Supabase can still send users to the old Site URL.
- Checks: auth-redirect-browser PASS (mocked Supabase); leaderboard-profile, community, member-card browser PASS; build PASS. No SQL change needed.
- Static GitHub Pages build keeps working but uses the Pages origin, not aureatine.cc.cd.

## Labels and automatic staff visits (pushed dbed563; SQL must be run in Supabase)

- Label cards: MEMBER, STUDENT and STAFF join APEX and AUREATINE. A member can hold several labels. Labels show on the leaderboard, the public profile, the member's own account page and the admin list.
- Label managers: only admins who also hold an APEX or AUREATINE label see the label editor. The editor calls `admin_set_member_labels`, which accepts only MEMBER, STUDENT and STAFF and writes an audit row. APEX and AUREATINE are owner-seeded only.
- Automatic visits: staff with the APEX role scan a member's QR or enter the code, and the visit is recorded at once (10 points). The manual visit reference and confirm step are gone. The server creates a unique reference such as `VISIT-YYYYMMDD-XXXXXXXXXX` from the request ID (Asia/Manila date). No daily limit. Each scan awards points, so accidental double scans award twice.
- Purchases are unchanged: verified member, receipt reference, amount, confirmation.
- SQL: `supabase/aureatine-full-setup.sql` is still one file. Run it in Supabase before pushing the frontend. The frontend tolerates the old contract (empty labels, no label editor), but visit scans need the new SQL.
- Checks added: `labels-visits-sql`, `labels-live-upgrade-sql`, `labels-staff-browser`, `admin-labels-browser`. Updated: `owner-labels-sql`, `own-ranking-sql`, `leaderboard-profile-sql`, `members-browser`. All SQL checks and browser checks pass locally (mocked Supabase). `npm run build` and `npm run build:pages` pass.

## Profile labels and layout polish (pushed dbed563)

- Profile identity order is now display name, @username, then label cards (ADMIN, AUREATINE, and so on). Verified at 390px and 1440px.
- aislop on `src`: 88 → 92, with 0 errors. Removed redundant `role="status"` on `<output>`, merged a duplicate import, removed `autoFocus`, and documented empty catch blocks.
- Layout polish in `style.css`: 44px tap targets for header icons, account link, navigation toggle and password toggle; floating AI and "Motion on" controls spaced at 12–16px; footer rows at 40px; small label classes raised to 11px; hero caption raised to 11px; bottom clearance for floating controls on phones.
- Browser checks pass: community, leaderboard-profile, member-card, admin, members, labels-staff, admin-labels.

- Pushed to jusnie/aureatine main as dbed5632a6b48d4f4d66d1443ed21c8b21db8644 with a temporary token (not stored). Vercel served the new stylesheet (min-width:44px, polish rules) on aureatine.cc.cd. The live label code chunk was not confirmed by grep.
- Live database: the assistant did not run SQL. Run supabase/aureatine-full-setup.sql in Supabase before using visit scans or labels.

## Owner label fallback (local, not pushed)

- Live database did not yet return `labels` or `get_my_labels`, so APEX and AUREATINE disappeared from the site. The site now falls back to `owner_label` (leaderboard, member profile, admin list) and to `get_my_owner_label` (own account page).
- Checked against a simulated live response: the profile and leaderboard show AUREATINE. Labels, admin, leaderboard-profile, community and members browser checks pass.
- The leaderboard only shows APEX and AUREATINE after `supabase/aureatine-full-setup.sql` is run in Supabase, because the live leaderboard function does not return owner labels yet.
