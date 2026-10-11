# Aureatine Gemini chat trial

## Activate on Vercel
1. Upload the updated source files, including `api/chat.js`, `src/ChatWidget.jsx`, `src/chat.css`, `src/main.jsx`, `vite.config.js`, `package.json`, and `vercel.json`.
2. Use repository root, Vite, `npm run build`, output `dist`. The updated config uses `/` for Vercel and `/aureatine/` only for `npm run build:pages`.
3. In Vercel > Project > Settings > Environment Variables set `GEMINI_API_KEY` to your Google AI Studio API key. Mark Sensitive. Select Production (Preview only if needed). Never share or commit this key.
4. Optional `GEMINI_MODEL` selects an available generateContent-compatible model; default `gemini-2.5-flash-lite`. Verify access/quotas in your Google account. If the model is retired or unavailable, select an available compatible model there.
5. Redeploy. Open the floating round robot, consent to processing, and test a business question. Configured status means a key exists; a successful provider response must still be verified.

## Disable / remove
Set `CHAT_ENABLED=false` to disable the API and `VITE_CHAT_ENABLED=false` to hide the launcher, then redeploy. Remove the Gemini environment key if no longer needed. The rest of the site is independent of chat. For complete removal remove the ChatWidget import/render and the API, chat component and stylesheet files.

## What is and is not implemented
- Custom circular robot launcher, responsive accessible non-modal chat panel, presets, busy/cancel/clear controls, graceful unconfigured/provider-error states.
- Server-side key, input size validation, short answer/context limits, 20-second provider timeout, same-origin browser checks, and basic in-memory 6 requests/minute/IP throttling.
- No app conversation storage or intentional prompt logging. Conversation is held in tab memory, sent to Google on consent; Google and infrastructure providers have their own retention/processing policies. Do not solicit sensitive health data. Review Gemini data-use terms for your account/tier before launch.
- General fitness education only. Includes a formula-based nutrition calculator with unit-tested arithmetic, not clinical validation. Does not access accounts, scan QR or award points. Prompt safeguards reduce risk but cannot guarantee AI accuracy or safety.
- No real Gemini response was verified without a configured key. Hosting / provider charges and quotas may apply.

## Before sharing publicly
This is a trial, not a cost-abuse-proof public launch. In-memory rate limits reset on cold starts and are NOT shared across serverless instances. Origin checking is not authentication and can be forged outside browsers. Set restrictive provider quotas, billing alerts, and appropriate key/API restrictions. Add Vercel Firewall/WAF or durable distributed rate limits and bot protection (e.g. Turnstile) before heavy/public traffic. Budget alerts alone do not cap spending. Test safe handling of medical questions, minors, eating-disorder concerns, prompt injection, long messages, provider failures, and quota errors. Approve product knowledge before making nutrition claims.

## GitHub Pages
GitHub Pages cannot execute `/api/chat`. The widget will show offline there unless a separately hosted API and secure cross-origin configuration are intentionally implemented. Vercel is the intended chatbot host. Use `npm run build:pages` only for static GitHub Pages deployment.


## Nutrition Calculator tab
Seven inputs: age, equation coefficient, kg, cm, overall activity, current weekly exercise days, and goal. Mifflin–St Jeor × approximate activity factor provides maintenance energy (nearest 50 kcal); no deficit or surplus is prescribed. Protein uses an adult 0.8 g/kg reference when exercising fewer than two days, and 1.4–2.0 g/kg for regular exercise (1.6–2.0 for the strength goal). Those are transparent product heuristics, not individualized clinical assessments. Sources and exact math are linked in the UI. Adults 18–75 only with suitability attestation; out-of-scope measurements route to professional guidance.
Calculations happen locally. Optional AI explanation requires explicit consent to send inputs to Google. The API recalculates from validated inputs using `shared/nutrition.js`, ignoring client-supplied totals. Include the entire `shared/` folder when uploading. The API advertises `nutritionCalculator:true`; an older backend leaves AI explanation disabled while local calculations continue to work. Tested using mocked AI responses, not clinically validated.

## Gym-goal guide v2 / age boundaries
Supersedes the v1 seven-field adult-only form: adult goals are gain weight, lose weight, build muscle, maintain. Added current gym experience and meal challenge (nine adult inputs). Calories remain a maintenance baseline; no automatic bulking/cutting target. The app provides three goal-specific actions and conditional food-first protein-powder/mass-gainer education. It cannot establish a dietary gap or product suitability and has no verified Aureatine nutrition labels.

Ages 16–17 use a six-input LOCAL guide with no body measurements, numeric calorie/protein targets, weight-change goals, or supplement recommendations. Known teen mode disables the Conversation tab. The API requires an adult confirmation and rejects calculator profiles under 18 before any provider request. The client checks `gymGuidanceVersion:2` to avoid sending newer profiles to an old backend. Consent, age and suitability checks are attestations, not identity/age verification.

IMPORTANT: Gemini API terms state that API clients must not be directed toward or likely accessed by under-18s: https://ai.google.dev/gemini-api/terms#age-requirements . Local teen content does not by itself establish compliance for a mixed-age website. Before public deployment of this variant, review the provider terms and appropriate access controls, or choose a provider explicitly permitting the intended audience. Do not describe the teen guide as an AI-generated personal plan. It is prepared educational content. This v2 change has only been prepared/tested locally, not live-provider tested or published.

## Coach-style refresh (preview only)
Aureatine AI now uses a supportive coach-style prompt: clarify missing goals/experience/schedule with at most two questions, then offer small actionable steps and an appropriate check-in. It remains AI, not a certified trainer or medical professional. All v2 age/provider restrictions above still apply; this UI does not resolve mixed-age Gemini deployment compliance.
The interface adds goal-oriented starter cards, editable follow-up prompts, warm editorial styling and short transform/opacity transitions. Response reveal renders at most approximately 20 updates/second instead of every animation frame, scrolls after text updates, and finishes immediately when paused/hidden. CSS respects reduced motion and hidden-tab pause. No animation dependencies added. Actual device performance is not guaranteed.
Validated with checks/coach-browser.cjs, checks/gym-guide-browser.cjs and checks/nutrition-v2.mjs. Provider output was mocked, not live-tested. Not uploaded.

## Published scope: adult-only assistant (supersedes teen sections)
Owner selected 18+ only. Removed the local teen guide and teen calculation paths. A session-only age gate precedes assistant/calculator access and capability requests; selecting under 18 blocks access. Calculator ages are restricted to 18–75, server-side too. Declaring an under-18 calculator age locks the assistant and clears chat state. Adult confirmation and separate provider-processing consent are required. This is self-attestation, NOT verified age assurance or a guarantee of Gemini terms compliance. The owner must ensure the API client is not directed towards or likely accessed by under-18s and review appropriate access controls. Gemini remains the disclosed provider. Coach/browser testing uses mocked responses, not evidence of a live provider request.
Current checks: nutrition-v2.mjs, coach-browser.cjs, adult-access.cjs. Older teen-flow browser check is historical, not valid for this adult-only release.

## Age input correction
Age is freely editable text with a numeric mobile keyboard. Partial typing never closes or resets the assistant. On blur, unsupported values receive inline guidance; calculation still validates whole-number ages 18–75 locally and on the server. Editing clears stale estimates and sharing consent. This supersedes the previous statement that entering an under-18 age locks the assistant; the separate 18+ access gate remains.

## One-tap shortcut questions
Starter questions and follow-up chips now send immediately through the normal request path, after explicit processing consent. They are disabled before consent, while unavailable, or while responding. A synchronous request guard prevents overlapping submissions. Errors restore the prompt to the composer for retry. checks/shortcut-send.cjs validates this behavior with a mock provider and replaces the older draft-only assertions in coach-browser.cjs. Age typing correction and this change are local/unpublished.
