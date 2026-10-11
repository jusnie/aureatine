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
