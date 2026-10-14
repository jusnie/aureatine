
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

- Pushed owner label fallback and rebuilt Pages as aa78615c515756bc3baff7bd9aa7b4fe33c89ce0 (temporary token, not stored). SQL file unchanged in this push and still needs to be run in Supabase.

- Glass redesign (local, not pushed): palette #0B090A / #A4161A / #D3D3D3 applied across src; glass surfaces with backdrop blur; animated background; scroll-reveal sections; route cross-fade; phone-friendly motion control. Build and build:pages passed. aislop src: 92 Healthy, 0 errors, 5 pre-existing warnings. Browser check: no horizontal overflow at 390px or 1440px; no page errors on home, about, rewards, leaderboard, login, signup. Share card restyled in the same glass system (black field, red glow, frosted identity panel, red check badges); rendered and checked with and without a photo and with a long name.

- Share card redrawn (local, not pushed): fixed a drawing bug that hid rank and achievements when a photo was present. Export names unchanged.
- Member card: smaller name over a black bottom gradient, username below, rank line; completed-tasks removed from card and share options. Local, not pushed.
- Navigation: mobile menu opaque with stronger blur; header glass raised. Local, not pushed.
- Staff: kind picker cards with icons and value line; scanner buttons with icons; manual code in one box per letter. Local, not pushed.
- Rewards brands: light logo plates so black logos show; "Browse brand" styled as a button. Local, not pushed.
- Reviews footer now reads "These reviews are from the latest reviews of the gym, as of October 15, 2026." Local, not pushed.
- Leaderboard rank column and avatar gap tightened. Local, not pushed.
- Open: 24-hour task timer and Cardio 30 mins task (needs product decision and SQL change).
- Tasks: daily check-in and new Cardio 30 minutes task (30 points, once per Philippine date) show a live countdown to the midnight reset. SQL: new task name in the check constraint and claim function; existing checks pass (full-sql, tasks-sql). Local, not pushed. Run supabase/aureatine-full-setup.sql before using the Cardio task.
