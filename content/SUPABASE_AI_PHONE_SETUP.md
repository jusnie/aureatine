# Optional Supabase AI deployment — not the current hosting choice

**Superseded:** the owner selected Vercel again. Follow `CHAT_SETUP.md` instead. The instructions below are retained only for an optional future migration; the production frontend now uses `/api/chat`.

**Status: code prepared and locally tested; not deployed.** This chat has no authorized Supabase connector or deployment session. Saving secrets does not deploy a function, and no live NVIDIA reply has been tested.

## 1. Create the function
1. In your existing Supabase project, open **Edge Functions**.
2. Choose **Deploy a new function → Via Editor** (the wording may differ slightly).
3. Name it exactly **aureatine-ai**.
4. Open the default **index.ts**, delete its sample code, then paste the ENTIRE supplied `supabase/functions/aureatine-ai/index.ts` file.
5. Deploy/save the function. This file is self-contained: no imports, extra files or packages to add in the phone editor. Do NOT paste it into the SQL Editor.
6. In the function settings, turn **Verify JWT / Verify JWT with legacy secret OFF**. This preserves the existing public guest-chat experience. The matching repository CLI config is already `verify_jwt = false`, but dashboard-created functions may require this manual setting.

**Public-endpoint warning:** With JWT verification off, the chat endpoint is callable without a Supabase login, consuming NVIDIA quota. The server enforces request limits, age/processing declarations and a best-effort per-instance rate limit. CORS is not authentication and does not stop non-browser callers. Monitor usage; add platform/WAF/distributed abuse controls before a broad public launch. No service-role key or database permissions are used by this function.

## 2. Existing secrets
Keep the secrets you already saved:
- `NVIDIA_API_KEY`: actual NVIDIA API secret, not its name or UUID.
- `NVIDIA_MODEL`: `z-ai/glm-5.3-flash`.
- `CHAT_ENABLED`: optional; `false` disables the assistant.

No key value goes in index.ts or any frontend file. Allowed browser origins default to your Aureatine domain (including www) and the existing GitHub Pages origin. If you need another legitimate frontend, add the optional `CHAT_ALLOWED_ORIGINS` secret with a comma-separated list of exact origins, not paths or wildcards. This replaces the default list. For example, include all production origins plus an exact preview origin when testing that preview.

## 3. Check configuration, then test inference
Once deployed, the expected URL is:
https://oisqrwrmtbcwtfmcenoc.supabase.co/functions/v1/aureatine-ai

Opening that URL in your browser makes a GET request. Expected configured response includes `"available":true` and `"provider":"nvidia"`. This checks secret presence, NOT whether the NVIDIA model accepts your key.
- 404: wrong function name or not deployed.
- 401 before a function response: review the function's JWT setting.
- available:false: key absent or CHAT_ENABLED=false.

Tell the assistant **“deployed aureatine-ai”** when it is deployed. It can then make a benign POST to that public URL to test an actual provider answer, without seeing your key. The model name follows your screenshot; the provider model page fetched as 404 in this environment, so actual model access is still unverified. A 502 response means the provider rejected/failed the request; a 504 means timeout. Provider raw errors and credentials are not sent to the browser.

Optional dashboard/curl POST test body:
```json
{"provider":"nvidia","consent":true,"adultConfirmed":true,"messages":[{"role":"user","content":"Reply with one short greeting for Aureatine AI. Do not claim access to accounts."}]}
```
Use `Content-Type: application/json`. Do not put the NVIDIA key in the test request. The function reads it from Secrets. If the dashboard test sends an Origin header, that exact trusted dashboard origin must be included in CHAT_ALLOWED_ORIGINS; a server-side test with no Origin is supported.

## 4. Connect the website
The prepared production frontend now sets the PUBLIC `VITE_CHAT_API_URL` in `.env.production` to the function URL above. The release ZIP includes this file. **The updated website must still be uploaded/rebuilt/redeployed.** An already deployed Gemini frontend does not switch automatically when the function is created. Old Gemini clients are deliberately rejected by the new function until users refresh and consent to NVIDIA processing.

No changes to membership SQL are required. This Edge Function is separate from your single database setup SQL. GitHub Pages can now call the deployed Supabase endpoint after the updated frontend is published. Preview hosts need their exact origin in the allowlist; do not permit every sandbox domain globally.

## Maintenance and tests
`node scripts/prepare-supabase-chat.mjs` regenerates the single file from the canonical API logic and calculator code. Run this after changing `api/chat.js` or `shared/nutrition.js`, then redeploy the function. It replaces Node environment/body-length calls with Deno-compatible equivalents and adds bounded request reading and CORS.
`node checks/supabase-chat.mjs` tests the generated file using Web Request/Response and mocked Deno/provider APIs. It covers preflight/origins, explicit NVIDIA consent, adult gates, size limits, final-answer parsing, calculator recalculation and missing-secret behavior. This is local validation, not a live Supabase deployment or provider test. Never claim a successful deployment from these tests alone.
