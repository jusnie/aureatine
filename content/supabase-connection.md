# Supabase connection status

Project URL: https://oisqrwrmtbcwtfmcenoc.supabase.co
Local `.env.local` contains the owner-supplied public publishable key and project URL in both website and release workspace. The `/rest/v1/` suffix must NOT be included in VITE_SUPABASE_URL. Local env files are ignored by Git. No secret/service-role key has been requested or stored.

Verified via the project's auth settings endpoint: email signup enabled, signup not disabled, email confirmation required. No real user account created, no emails sent and no successful real login claimed. Read-only aggregate RPC check returned PGRST202 (function absent from schema cache), so reward count migration is not ready. No database writes performed. Browser public key is not admin access and cannot apply SQL or configure dashboard settings.

## Owner actions before testing confirmation/reset links
1. Supabase Authentication → URL Configuration: set Site URL to https://aureatine.cc.cd .
2. Add redirect URLs https://aureatine.cc.cd/login/ and https://aureatine.cc.cd/reset-password/ .
3. For workspace preview testing, copy the actual preview origin from its browser URL and add that origin with `/login/` and `/reset-password/`. Do not use localhost for the user's browser or allow all arbitrary origins.
4. If Pages is used for auth, also allow https://jusnie.github.io/aureatine/login/ and https://jusnie.github.io/aureatine/reset-password/ .
5. Run ONLY `supabase/aureatine-full-setup.sql` after review. It includes every database feature. Redemption activation still requires real products, stock and collection/recovery workflow.
6. In Vercel Environment Variables, set VITE_SUPABASE_URL to the project URL above and VITE_SUPABASE_PUBLISHABLE_KEY to the supplied publishable key. Redeploy. Never use a service-role/secret key in VITE_ variables.
7. User tests Sign up with their own email, follows confirmation link, logs in, logs out and verifies password reset. Configure SMTP and auth rate limits for public launch as appropriate.

Builds succeed with configured Supabase; bundler reports a large-chunk warning, not a build failure. Local preview is configured; Vercel settings and dashboard redirects have not been changed by the assistant.
