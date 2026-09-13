# Oche — darts scorer

501/301 double-out and the 121 team game, with player profiles and stats
shared across every device that opens the page.

## What's here

- `public/index.html` — the whole app, plus `manifest.json` and icons so it
  can be added to an iPhone/Android home screen and run full-screen.
- `api/state.js` — one serverless function: `GET` returns the saved players
  and game history, `POST` saves a new version. Backed by Vercel Blob.

## Setup

1. **Storage.** In the Vercel project: Storage → Create Database → Blob, with access set to **Private**.
   Connect it to this project. Vercel then sets `BLOB_READ_WRITE_TOKEN`
   automatically — that's the only environment variable needed.

2. **Deploy.** Push to GitHub and import the repo in Vercel (no framework
   preset — it picks up `api/` as functions and `public/` as static files).

## How saving works

Every change writes the whole state (players + history) as one JSON blob,
tagged with an incrementing revision number. The API rejects any write whose
revision is behind what's already stored, so a slow request from one device
can't undo a newer change from another. Records read back from storage are
normalised on the way in, so a malformed or partial record can't break the
page.

If the API is unreachable, the app keeps working from that browser's local
storage and syncs again when it can.

## Notes

- The "Look & feel" setting (Classic chalkboard/paper vs. Neon Arcade) is
  saved per-browser, not synced — it's a per-device preference.
- Cross-device updates arrive on page load, on tab refocus, and via a poll
  every 15 seconds.
