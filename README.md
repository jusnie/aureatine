# Aureatine

A light-brown React website for Aureatine, in partnership with Apex Fitness Gym.

## Publish to GitHub Pages
Ready-built files are included in `docs/`. No token or API key is needed to publish.

1. In **jusnie/aureatine**, open **Settings → Pages**.
2. Under **Build and deployment**, select **Deploy from a branch**.
3. Choose **main** and **/docs**, then **Save**.
4. Wait for GitHub's Pages deployment to finish.
5. Open **https://jusnie.github.io/aureatine/**.

The directory pages support direct links and reloads for About, Rewards, Leaderboard, Login, Signup, and password recovery. All assets use the `/aureatine/` project prefix.

## Development
Node 22 recommended.

```sh
npm ci
npm run dev
```

## Update the public site
```sh
npm ci
npm run build:pages
```
Commit both source changes and regenerated `docs/` to main.

## Backend status
Pages, navigation, animations, the map embed, and external links work without an application backend. Accounts, QR generation/scanning, point awards, real rankings, and event redemptions are NOT activated by GitHub Pages. See `SETUP.md` and `supabase/` for the prepared database setup and pending work.

Only use Supabase public/publishable credentials in Vite environment variables. Never commit GitHub tokens, service-role keys, passwords, or `.env` files.

For deployed Supabase redirects, use `https://jusnie.github.io/aureatine/login/` and `https://jusnie.github.io/aureatine/reset-password/`. Configure your deployed Site URL as `https://jusnie.github.io/aureatine/`.
