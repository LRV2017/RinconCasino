# Rogueboard account and cloud-save setup

Rogueboard supports email/password accounts and cloud saves through Supabase. The existing local profile remains as an offline cache; when an account is signed in, progress is also written to the player's own Supabase row.

## 1. Create a free Supabase project

1. Create a project at https://supabase.com/dashboard.
2. Open **Project Settings → API**.
3. Copy the **Project URL** and the **publishable key** (older projects may label it anon).
4. Open **SQL Editor** and run the full contents of supabase/rogueboard.sql.
5. In **Authentication → URL Configuration**, set the Site URL to your deployed Rogueboard URL:
   https://lrv2017.github.io/RinconCasino/illegal-chess/
6. Add that same URL to the allowed Redirect URLs. Add your local development URL too if you use one.

## 2. Add the public browser configuration

Edit illegal-chess/cloud-config.js:

- Replace https://YOUR_PROJECT_REF.supabase.co with your project's URL.
- Replace YOUR_SUPABASE_PUBLISHABLE_KEY with its publishable key.

The publishable key is designed to appear in frontend code. **Never** paste a Supabase service_role or secret key into the website, GitHub, or this repository. The database table has Row Level Security policies so signed-in users can only read or write the row whose user_id matches their authenticated user ID.

## 3. Create an account

1. Open Rogueboard and choose **Account** in the sidebar.
2. Enter a callsign, email, and password (at least 8 characters).
3. Choose **Create account**.
4. If email confirmation is enabled, open the confirmation email and follow its link back to Rogueboard.
5. Sign in with that email and password.

Supabase email/password authentication is used. Account passwords are handled by Supabase Auth and are never stored in the Rogueboard save data.

## 4. Existing local progress

When a signed-in account already has a cloud save and this browser also has local progress, Rogueboard asks which version to keep:

- **Use cloud save** downloads the account's save to this browser.
- **Upload this device** replaces the account's cloud save with this browser's profile.

A new account with no cloud save receives the current browser profile automatically. After that, updates to rating, XP, shards, cosmetics, quests, and career stats are synced to Supabase. The local profile remains available as a cache.

## 5. Security and current limits

- Authenticated save rows are private to their owner through Postgres Row Level Security.
- The browser uses only the publishable key; no service-role secret is exposed.
- The save contains the game's current profile and progression data, not passwords.
- Cloud saves are not an anti-cheat system. Because this is a static client and P2P matches are not validated by a trusted game server, a modified browser can still falsify its own stats or save data. Do not treat the current rating, shards, or leaderboard as secure competitive currency.
- Global public leaderboards, OAuth providers, account deletion, and cross-device active-match recovery are not enabled in this first cloud release.
- Email verification and password reset behavior follow the Supabase Auth settings in your project.

Official documentation:
- https://supabase.com/docs/guides/auth/passwords
- https://supabase.com/docs/guides/database/postgres/row-level-security
- https://supabase.com/docs/guides/database/secure-data
