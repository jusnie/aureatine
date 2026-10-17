
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

## Brown neumorphism restyle (local, not yet pushed)
- Replaced the glass palette with the brown palette (#EDE0D4, #E6CCB2, #DDB892, #B08968, #9C6644, #7F5539) across src/.
- Neumorphic raised and inset shadows on cards, panels, buttons, and inputs. Glass blur removed.
- Status: success green (#2F7D4F), error red (#B3261E).
- src/glass.css renamed to src/theme.css and imported last in src/main.jsx.
- QR colors (#241d17 on #ffffff) kept. Share card black bottom gradient kept; red glow changed to caramel.
- index.html theme-color set to #EDE0D4. DESIGN.md and PRODUCT.md updated.
- Checks: npm run build and build:pages pass. aislop scan src: 92 healthy, 0 errors, 5 pre-existing warnings. Desktop and 390px screenshots of home, about, rewards, leaderboard, and login: no page errors, no horizontal overflow.
- Open: /leaderboard at 390px bottom overlap with motion toggle and AI launcher (layout fix pending).

## 24-hour tasks, manual code, background, motion toggle (local, not yet pushed)
- SQL (single file supabase/aureatine-full-setup.sql): daily and cardio now claim on a rolling 24-hour window from each claim, with unique period keys. get_member_tasks returns daily_available_at, cardio_available_at, and next_reset. Re-run the full SQL file in Supabase before the Cardio and daily changes take effect.
- Local SQL test (PGlite, stubbed auth): signup once, daily once per 24 hours, cardio 30 once per 24 hours, claim after 25 hours succeeds, points 55 as expected.
- Tasks UI: signup card disappears after claim. Daily and cardio show Available again in HH:MM:SS after claim.
- Manual member code: one row of six pressed tiles, ink-cocoa letters (no white glow).
- Softer neumorphic highlights (less white glow). Task countdown text is ink, not white.
- Motion on/off toggle removed. Animated background: three drifting warm glows and two slow rings; paused for reduced-motion users.
- Responsive: no horizontal overflow at 320, 390, 768, 1024, 1280 on public pages. Member pages checked through a static harness.
- Open: five-day gym task "limited time" meaning, and whether tasks rotate after 24 hours.
- Five-day gym task now repeats: each cycle needs five visit dates since the last claim, then one claim per 24 hours. Visible countdown after claim. Local SQL test passed (4 visits rejected, 5 visits awarded 25 points, later cycle counts only new visits).
- Open: rotating task list after 24 hours needs the user task list and point values before implementation.
- Member card (share card, src/memberCardCanvas.js): same layout, brown palette. Espresso field, caramel glow, sand and base text, latte glow. Bottom gradient kept dark (espresso, not pure black) for legibility. Verified by render test; test files removed.
- Member card (share card): neumorphic raised base with pressed-in photo well, light brown fade only at the photo bottom, Georgia name and watermark, system sans body. Test renders checked; test files removed.
- Leaderboard paging and compact labels (local, not yet pushed). SQL: get_leaderboard_entries(p_limit=20, p_offset, p_search) returns 20 per page, capped at 50, with global ranks and total_count; server-side name search; index on wallets(points desc). Re-run the full SQL file before deploying the page, since the function signature changed.
- Frontend: Show more members button, server search with a 300 ms debounce, header count shows the real total. Badges shrunk to 18px chips, avatars 44px desktop and 38px phone.
- Checks: local SQL test (45 members: page 1 = 20 rows, page 3 = 5 rows, search returns the single match, %-search escapes, limit clamps to 50). Browser mock at 390 and 1440: 20 then 40 rows after Show more, search 7 matches, no overflow, no page errors.
- Leaderboard layout final pass (local, not pushed): table lines and column bands removed, the left accent on your row removed (tint only), rank/name/points share one centre line at the top, labels sit directly under the name, search has one outline. Measured at 320, 390, 1440: no clipping, no page overflow.
- Leaderboard status and live updates (local, not pushed): own ranking shows "Not in the leaderboards" when not opted in; when listed it shows #rank with Top 3, Top 10, or Top 50 chips. Both the own ranking and the leaderboard list refresh every 20 seconds, and again when the tab is shown or the window is focused. Browser mock test: not-listed state shown, then rank 2 appeared automatically after 18 s without reload. No extra SQL needed beyond the earlier leaderboard SQL change.

## Aurels rename (local, not pushed)
- Visible "points" copy renamed to "Aurels" across the UI (45 lines in 10 `src/` files plus the chat coach prompt in `api/chat.js`). Database columns, keys, and code names (`points`, `member_point_events`, `wallets.points`) are unchanged.
- The Aurel coin (`public/images/aurel-coin.png`, from the user's supplied PNG) replaces the star icon on the balance card (`.aurel-coin` in `theme.css`).
- Removed the "temporary SVG" note from the "How can I add Aurels?" explainer.
- Checks: `npm run build` exit 0; `aislop scan src` 92 healthy, 0 errors, 5 warnings; `/rewards` at 390px: coin loads (608×411), no horizontal overflow, no page errors.

## EXP ranks (local, not pushed)
- Lifetime EXP: 1 EXP per Aurel earned. Redeeming lowers Aurels but never EXP. Implemented as `wallets.exp_total` with a trigger on balance increases (`wallets_track_exp`), so every award path counts. Backfilled from past positive events and task claims.
- Ranks: Mortal 0, Demigod 500, Divine 1500, Olympian 4000, Ascendant 10000. `member_rank_title()` in SQL and `src/ranks.js` must stay in sync.
- SQL: new `member-exp` module at the end of `supabase/aureatine-full-setup.sql`. Updates `get_leaderboard_entries` (adds `rank_title`, `exp`), `get_my_leaderboard_standing` (adds `exp`, `rank_title`), and `member_community_card` (adds `rank_title`; `exp` only on the member's own card). Run the full file once in Supabase.
- Checks: `/home/user/tools/sql-check/exp-check.mjs` passes (EXP at each boundary, redemption keeps EXP). `lb-check.mjs` and `task24h-check.mjs` still pass with the full file.
- Assets: `public/images/ranks/{rank}-badge.webp` and `{rank}-border.webp`, backgrounds removed from the supplied art.
- UI: leaderboard rows show a corner badge on the avatar and a rank chip under the name. The member dialog and own profile show the full border ring around the photo and a rank line with EXP (own profile only).
- Fixed a stale dev-server issue (not a code bug). The production build was already correct.
- Checks: `npm run build` exit 0; aislop 92 healthy, 0 errors, 5 warnings (existing). Leaderboard rows at 390px: no overflow, no page errors. Not yet browser-checked: the logged-in own profile and the member dialog with a real session.

## Installable app (PWA, local, not pushed)
- Chosen route: installable web app, no APK. Members use Chrome's "Install app" or "Add to Home screen".
- Added: `public/manifest.webmanifest` (standalone, theme #EDE0D4), icons in `public/icons/` (192, 512, maskable 512; the Aurel coin on brown, replaceable), `public/sw.js`, and `src/registerWorker.js` (production only, base-aware path).
- Service worker: caches only the app shell, hashed assets, and images. Navigation is network-first with a cached fallback. Cross-origin calls (Supabase, Vercel `/api/*`) always go to the network and are never cached.
- `index.html`: manifest, icon, apple-touch-icon, and mobile web app meta tags. Links are absolute, so the GitHub Pages sub-folder routes resolve.
- Checks: `npm run build` and `build:pages` exit 0. Served build: manifest loads, icons 200, service worker active and controlling the page, no page errors, no horizontal overflow at 390px. Offline reload renders the app shell. aislop 93 healthy, 0 errors, 5 warnings (existing).
- Not done: an APK or store listing. The sandbox has no Android SDK. A later APK can wrap the live URL with PWABuilder or Bubblewrap, since the manifest and service worker now exist.

## Logo, app icon, and device-aware shell (local, not pushed)
- Logo: the supplied badge is cropped and saved as `public/images/aureatine-logo.webp` with a transparent background. It replaces the "Aureatine" text wordmark in the header. The footer wordmark is unchanged.
- App icons (`public/icons/`) now use the badge on the cream brand colour.
- Device detection: `src/deviceKind.js` (`useDeviceKind`). A phone or tablet is detected from the user agent or touch input, or a coarse pointer at widths up to 900px. Result is set on `<html data-device>`.
- Mobile shell: `src/MobileTabBar.jsx` adds a fixed bottom bar (Home, Shakes, Rewards, Board, Account or Log in). On mobile the header's Leaderboard and Rewards links are hidden, since the bar covers them. Layout offsets are in `src/device.css`. Laptops and desktops keep the existing header.
- Checks: build passes. Phone (mobile UA, touch, 390px) gets `data-device="mobile"` and a visible tab bar with no overflow. Laptop (1440px) gets `desktop` with no tab bar. No page errors. Aislop unchanged at 5 existing warnings.
- Not done: separate page-by-page mobile layouts. Pages share the responsive layout, with the mobile shell and tab bar as the main difference.

## Menu page (local, not pushed)
- Header "Our shakes" link is now "Menu" and points to `/menu`. The mobile tab bar's "Shakes" tab is now "Menu" too.
- New `/menu` page (`src/MenuPage.jsx`, `src/menu.css`) shows only the menu. Items come from `src/menuData.js`, which is empty for now, so the page shows a "Coming soon" card. No flavors or prices are invented.
- To populate: add entries to `MENU_SECTIONS[0].items` with `name`, `description`, `price` (number, pesos), and `allergens`.
- `scripts/prepare-pages.mjs` includes `menu`, so GitHub Pages can load `/menu` directly.
- Checks: build, `build:pages`, and aislop pass (5 existing warnings). `/menu` on laptop and phone: heading "Menu", no page errors, no horizontal overflow, the phone tab bar shows Menu as current, and no "Our shakes" link remains.

## Push to GitHub (this turn)
- Pushed `edb5efe` to `jusnie/aureatine` main as a fast-forward on `8c9db42`. It includes the EXP ranks, Aurels rename, logo, PWA install, device-aware mobile shell, menu page, leaderboard and member-card work, and the rebuilt `docs/` for GitHub Pages.
- The one-time token was used for this push only and was not saved. The temporary clone was removed. The token should be revoked.
- Verified live: https://aureatine.cc.cd/menu and https://jusnie.github.io/aureatine/menu/ return 200, and the manifest loads on both.
- Not run: the SQL file has not been run in Supabase. Run `supabase/aureatine-full-setup.sql` once in the SQL Editor.
