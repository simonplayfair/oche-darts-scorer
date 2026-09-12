# Oche — self-hosted setup

A darts scorer (501/301 double-out + the 121 team game) with player profiles
and stats synced through a Postgres database, deployable on Vercel like your
tennis app.

## What's here

- `public/index.html` — the whole app (frontend), plus `manifest.json` and
  icons for "Add to Home Screen" on iOS/Android.
- `api/state.js` — one serverless function: `GET` returns the saved players
  and game history, `POST` saves a new version. Backed by a single Postgres
  table (`oche_state`), created automatically on first request.

## Setup

1. **Database.** If you already have a Postgres/Neon database from the
   tennis app, you can reuse it — this app creates its own table
   (`oche_state`) and won't touch anything else. Otherwise add one from the
   Vercel dashboard: Project → Storage → Create Database → Postgres (Neon).

2. **Env var.** This code reads the connection string from `DATABASE_URL`,
   falling back to `POSTGRES_URL` or `NEON_DATABASE_URL`. When you attach a
   Postgres database to the project in Vercel, it sets one of these
   automatically — check Settings → Environment Variables and rename if
   needed so one of those three names is set.

3. **Deploy.**
   - Push this folder to a GitHub repo.
   - In Vercel: New Project → import that repo → Deploy. No framework
     preset needed (it auto-detects the `api/` folder as serverless
     functions and `public/` as static files).

4. **Open it** at the Vercel URL you're given. No login required — this is a
   plain public page. (If you'd rather keep it private, that's a call for
   Vercel's own access-control settings, not something this app handles.)

## Notes

- Player profiles and stats live in the database — same data everywhere the
  page is opened, no login needed.
- The "Look & feel" setting (Classic chalkboard/paper vs. Neon Arcade) is
  saved per-browser in local storage, not synced — a per-device preference.
- If the API is briefly unreachable, the app falls back to whatever's cached
  in that browser's local storage and keeps working from there.
