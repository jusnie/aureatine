## Current database installation
Run only `supabase/aureatine-full-setup.sql`. Earlier migration filenames below are historical notes, not additional files to run; those separate files have been removed.

# Redeemables catalog
Local update only. Brand filters: Youngla, Gymshark, Breathevinity, Dfyne. Inline SVG text artwork is not official logo artwork or a partnership claim. Only the Redeemables tab renders this component; the wallet, QR instructions, guide and flying pilot remain intact.
Sorting supports points ascending/descending and item-name A–Z; unknown points remain last. Catalog is empty until owner supplies images and confirms item details. No sample products or invented points are displayed. Supply brand, product name, image, description, points cost, sizes and availability. Descriptions drafted from images must not assert unverified material/performance claims. Redemption remains disabled until backend and inventory are configured.

Categories added: All items, Apparel, Accessories. Category and brand filters combine with points sorting. Clear filters resets both. No actual accessory items added pending owner images/details.

## Unique-member redemption counts (not connected yet)
Apply supabase/redemption-counts.sql in the intended Supabase project after review. It adds catalog IDs/publication flags and a private redemption ledger, with a public aggregate RPC. Browser roles cannot read member-level records or write counts. Publish a catalog ID only when its frontend item is approved.

Trusted fulfillment backend must write/update a ledger row only after verifying the actual redemption and its authenticated member. Use the stable transaction_ref for idempotent upserts; mark completed with completed_at only after fulfillment confirmation. Pending, cancelled and refunded rows do not count. Multiple completed rows from one user for the same item count once. If a user has another valid completion, refunding one redemption still leaves that member counted. Account deletion cascades and removes its member count. Do NOT expose the service-role key to the frontend. This migration is NOT a redemption endpoint, points debit, stock check, or fulfillment workflow.

The UI reads batches of at most 100 IDs on catalog mount and explicit Refresh counts. No constant polling. It shows verified zero only for returned published catalog rows with zero completions; missing IDs, unconfigured Supabase and failed queries are unavailable, not fabricated zero. No catalog products exist yet, so no per-item badges appear until real items are supplied.

JS parsing/label checks and both builds passed locally. SQL migration has not been applied or database-executed; verify permissions and repeat-user/cancel/refund behavior in a Supabase staging project before launch.

## Per-item size choices
Apparel cards default to S/M/L/XL preference choices; item.sizes overrides the list. Accessories show no size section unless explicitly configured. Each item has an independent, keyboard-accessible radio group and no preselected size. Known unavailable sizes can be listed in item.unavailableSizes. Size availability remains unconfirmed; a selection is local UI state, not a reservation or completed redemption. When fulfillment is implemented, submit and validate the selected size server-side against real inventory. No product cards appear until actual items are added.

## Confirmed redemption and insufficient-points flow
New migration: supabase/redeem-item.sql, applied AFTER schema.sql and redemption-counts.sql. SQL function redeem_reward validates auth.uid, locks the wallet and item/size stock, checks the server points cost, deducts points and stock, and creates a completed point-exchange claim atomically. Same user/request UUID retries return the original claim without a second debit. The cost shown in the browser must match the database cost; mismatches require refresh, not silent repricing. No browser direct table-write permissions were added.

Superseding count definition: completed now means a confirmed point exchange and stock reservation, NOT physical fulfillment. collected_at is separate, and staff collection/refund workflow still needs implementing. Counts represent unique members with valid completed claims. Do not manually cancel/refund by only changing status: point/stock restoration needs an audited server-side transaction, not supplied here.

Frontend displays “Successfully redeemed!” only for a validated success RPC response with reference and new balance; insufficient balance displays “Not enough points.” Includes explicit confirmation before deduction, selected-size validation and repeated-click guard. Confirmed failures let users change size/retry; uncertain network failures reuse the same UUID while the item component remains mounted. Recovery/history across reloads and lost claims needs a member claim-history flow before public launch.

Activation remains OFF by default. After staging verification, register real item IDs, points_cost, publication flags, redeem_enabled, and reward_variants stocks/sizes. Configure Supabase public env variables, set VITE_REDEMPTIONS_ENABLED=true, and mark only valid frontend items available:true. Never set up fake products or balances. Backend SQL remains unapplied to any live Supabase project. Production use also requires staff collection/refund and claim recovery tooling.

Checks: checks/redemption-sql.cjs executed all three migrations in local PostgreSQL-compatible PGlite and passed cost mismatch, invalid size, out-of-stock, wallet/stock updates, insufficient points, same-request retry, unique-member count, private ledger access and sign-in checks. This is not a Supabase deployment or multi-client concurrency/load test. Both Vite builds pass.

## User-supplied brand logos
Placeholder SVG wordmarks replaced with uploaded GYMSHARK.PNG, BREATHEVINITY.PNG, DFYNE.PNG and YOUNGLA.PNG. Trimmed transparent outer padding into public/images/brands while preserving original pixels and transparency. White Breathevinity mark uses a dark brown backing for contrast. Original uploads retained. Apparel now has an inline SVG shirt icon. Asset URLs use BASE_URL for Pages and Vercel compatibility. Builds passed; not uploaded.

## Transparent replacement and review motion
Replaced Breathevinity with user-uploaded BREATHEVINITY1.PNG, cropped only transparent outer padding (394×254). Removed dark-surface class; logo renders directly on the brand tile with transparent background and original proportions. Review Show more uses short staggered opacity/transform entrances; Show less fades outgoing cards before removing six. Collapse controls are locked during the brief exit to avoid repeated-click races; reduced-motion/global motion pause skips animation. Normal and Pages builds passed. No new screenshots created; not uploaded.

## Black logo cache correction and capitalization
Breathevinity now references a new asset URL, breathevinity-black-v2.png, generated from BREATHEVINITY1.PNG with RGB black and original alpha retained. This avoids reuse of the previous white artwork under the old filename. Brand mentions in JSX now use “Aureatine” (initial capital), including header/footer/About labels, community labels and chat reply label. Corrected the old AUREATEIN auth heading typo. Builds passed. Local only; the public site requires a new deployment.
