# Visual direction (current): Glass on black
Palette: black #0B090A, red #A4161A, light grey #D3D3D3 (user-supplied). Glass surfaces are grey at 8–14% opacity with backdrop blur 18px and a 1px grey edge. Primary actions are solid red with white text (contrast above 7:1). Body text is #D3D3D3; headings are #FFFFFF.
Background: an animated black field with two slow drifting light fields (red and grey), GPU-only transform animation, paused by the motion toggle, held still under prefers-reduced-motion.
Motion: sections rise in on scroll (scroll-driven where supported); route changes cross-fade through View Transitions; the motion control shrinks to a state dot on phones.
Accessibility: prefers-reduced-motion stops the background and entrances; prefers-reduced-transparency removes backdrop blur. The QR code keeps dark-on-light contrast so it scans.
Implementation: colors converted by role in the existing stylesheets; src/glass.css loads last. Content and behavior unchanged.
Skill guidance applied: impeccable craft floor (contrast, focus states, themed selection and scrollbars, motion on transform and opacity), taste-skill glass rules (solid fallback, reduced motion, button contrast). Glass is used as the main surface system because the brief asks for it, not as decoration only.

---

# Visual direction
Warm editorial shake café: parchment #faf7f1, espresso #50392c, light brown #e9dac6. Manrope display and DM Sans body, self-hosted through npm fonts. Large asymmetric split hero with arch-topped beverage photo; compact SVG navigation; generous spacing and restrained pills. One subtle GSAP entrance, reduced-motion support. Mobile collapses cleanly; all forms have explicit pending, busy, and feedback states. String-connected founder tags; no fake reviews, balances, or nutrition claims. Impeccable craft guidance and applicable Taste Skill rules interpreted in service of this brief, not contradictory style mandates.

## Motion and flow refinement
Added low-contrast animated orbit/line background, fixed behind content with pointer events disabled; no map overlay. User-controlled motion toggle and OS reduced-motion support. Background loops pause when tab is hidden. Sticky framed navigation, reading progress, back-to-top, breadcrumbs, scroll offsets, mobile Escape dismissal, route focus management, and native View Transition page continuity with no-dependency fallback. GSAP hero framing and bounded section motion; deliberate button, form, rewards-panel, and team-tag feedback. No Three.js render loop needed for these lightweight effects.

## About page editorial upgrade
Dedicated founder-story composition: asymmetric title and eight-founder typographic print, partnership introduction, spacious hanging-tag centerpiece, native accessible details/summary intentions, and an espresso invitation panel linking to Visit Us and Our Shakes. All eight supplied names retained, without invented bios or roles. Gentle fixed-pivot yarn/tag breeze preserved with offscreen pause and motion preferences. Browser checks passed at 1440, 390, and 320px: heading, anchor navigation, eight tags, details interaction, no horizontal overflow or page errors.

## Aureatine rewards and community update
Primary header/footer wordmarks and hero now use Aureatine alone. Restored “Your next rep. Your new favorite sip.” with a secondary partnership credit below. Rewards redesigned as warm editorial dashboard: balance wallet, availability note, two-state rewards/how-it-works control, empty catalog, and cross-navigation to the leaderboard. New trophy icon immediately precedes Rewards. Leaderboard uses current verified wallet points, opt-in public display names, and honest pending/error/empty states. Search applies to the top 50 loaded members. No artificial rankings or redeemables. Tested at 1440, 390, and 320px, including icon navigation, points explanation, guide toggle, and leaderboard search/reset.

## Gemini chat trial
Circular warm-brown robot-head launcher above existing motion controls, connected styled chat panel, clear offline state, opt-in Google processing consent, preset questions, loading/cancel/retry-via-draft/clear controls. Session-only memory. Accessible non-modal dialog with Escape/focus restoration and reduced motion. Vercel API keeps Gemini key server-side. No fake assistant responses; no personal calorie calculator or account/points access. Disable with CHAT_ENABLED=false and VITE_CHAT_ENABLED=false.

## Aureatine AI conversation refinement
Branded header and conversation as Aureatine AI; Gemini retained in explicit processing/privacy disclosure only. New centered welcome, compact conversation mode, animated thinking avatar/wave, progressive visual reply reveal (after complete server response, not provider streaming), full accessible reply text, copy feedback, scroll-follow that yields to reading, and animated close. OS and site motion preferences honored. Tested with mocked provider responses at 320/390/1440px; no live key needed or included.

## Calculator tool inside Aureatine AI
Conversation / Calculator segmented navigation. Seven metric inputs, adult suitability check, local deterministic estimates, disclosure of formulas and limits, optional explicit AI-sharing consent, server recalculation, and disabled explanation with older/offline backends. Chat motion and APEX capitalization retained. UI tests cover formula results, no network submission before consent, minor restriction, reset and 320/390/1440px.

## Member share card
Reference-led portrait export in the existing parchment/espresso palette, with Aureatine upper-left watermark, actual member identity, optional snapshot rank and completed-task labels. Straight 4:5 export (not a tilted screenshot), large personal photo, functional contrast scrims and a quiet two-column preview/options page. Compact account entry; no fictitious people, ranks or credentials. Canvas-generated PNG stays in the browser. Skills used as applicable: incumbent-preserving redesign, minimalist controls, reference-led hierarchy and Impeccable craft/privacy/error-state checks. Existing brand fonts and original tagline retained.

## Leaderboard member profile interaction
Member photo/name is now a keyboard-accessible underlined button opening a native read-only dialog. Keeps the board/search in place, uses warm parchment/espresso and existing Manrope/DM Sans, initials or real consented photos, genuine standings and community counts. Clear sign-in/error/unavailable states, a visible close control, Escape/Tab/focus-return behavior, and bounded async loading. Shared data only; no account editor or private identifiers. Relevant minimalism/Impeccable clarification and hardening guidance applied without changing the established visual identity.
