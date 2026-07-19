# Fight Club NSW — Fighter Registration Platform

A self-serve web app where boxers register interest in Fight Club NSW fight nights: they create
an account, build a fighter profile (photo, gym, coach, location, amateur/pro weight division,
fight record, and title history), and appear on the public fighter roster.

Built deliberately with **zero external runtime dependencies except `sharp`** (used to process
uploaded photos and to draw the gold "CHAMPION" banner across a current title-holder's photo).
Everything else — the web server, routing, sessions, password hashing, the database, and the
multipart file upload parser — is hand-rolled on top of Node.js's own built-ins (including the
built-in `node:sqlite` module). That means there is no build step, no bundler, and nothing to
`npm install` beyond `sharp` itself. This was a deliberate choice to keep the app portable and
trivial to run on almost any host.

## Requirements

- Node.js **22.5 or newer** (for built-in `node:sqlite`). A `.node-version` file pins a known-good
  version for tools like `nvm`/`fnm` that read it.

## Running it locally

```bash
npm install       # installs sharp only
npm start         # starts the server on http://localhost:3000
```

Set `PORT` to change the port, and `NODE_ENV=production` to mark session cookies `Secure` (do
this once the site is served over HTTPS).

## Data & photos

- The SQLite database lives at `data/app.db` (auto-created on first run, WAL mode).
- Uploaded fighter photos are stored on disk under `uploads/`.
- **Both of these must live on persistent storage.** If you deploy to a platform that wipes the
  filesystem between deploys or restarts (most serverless / "ephemeral disk" platforms), fighter
  accounts and photos will be lost. Pick a host with a persistent disk/volume (see below), or
  swap in a hosted database + object storage if you outgrow this.
- At 150–200 fighters, both SQLite and local-disk photo storage are comfortably within what this
  design was built for.

## Deploying it live

This project has no Vercel/Netlify-specific config because it isn't a serverless app — it's a
single always-on Node process that needs a writable disk. The simplest hosts for that shape are
**Render** or **Railway** (both have a free/low-cost tier with a persistent disk you attach to the
service), or any small VPS (Lightsail, DigitalOcean, etc.) where you just run `npm start` behind a
process manager like `pm2` and put Nginx/Caddy in front for HTTPS.

Whichever you use, the steps are the same shape:

1. Push this project to a GitHub repo (or upload it directly if the host allows).
2. Create a new Web Service from that repo.
3. Build command: `npm install`. Start command: `npm start`.
4. Attach a persistent disk mounted so that `data/` and `uploads/` survive restarts/redeploys
   (e.g. mount it at `/app/data` and `/app/uploads`, or mount one volume at `/app` and keep the
   whole app there).
5. Set `NODE_ENV=production` once you're on HTTPS.

## Project structure

```
server.mjs            entry point — HTTP server + routing
lib/db.mjs             SQLite schema + seed data
lib/weightDivisions.mjs amateur (14) and professional (17) weight divisions, in kg
lib/auth.mjs            password hashing (scrypt) + session cookies
lib/multipart.mjs       dependency-free multipart/form-data parser
lib/photo.mjs           photo processing + champion banner overlay (sharp)
lib/titles.mjs          title badge / overlay text helpers
lib/bio.mjs             auto-generated bio paragraph (gym + location + record)
lib/layout.mjs          shared HTML shell (nav, branding)
lib/pages.mjs           page templates (home, signup, login, register, profile, roster)
public/style.css        Fight Club NSW branding (black / gold / distressed boxing look)
public/app.js           client-side JS: amateur/pro weight toggle, title fields, profile tabs
public/logo.svg         Fight Club NSW badge logo
```

## Notes on the fighter profile

- **Photo**: required on signup, with a help note asking for a clear front-facing face photo.
  There is no automated face-detection check — this app relies on the instruction text, by design.
- **Weight divisions**: switching Amateur/Professional repopulates the weight dropdown from the
  correct list (14 amateur divisions per Boxing Australia / AABL; 17 professional divisions, the
  standard world boxing weight classes), in kg.
- **Titles**: a fighter can mark themselves a current or former Regional / NSW / Australian
  champion. Current title holders get a "▲ CHAMPION" badge on the roster and profile, *and* a
  gold ribbon banner reading e.g. "NSW CHAMPION" composited across their profile photo. Former
  title holders get a badge only (no photo banner). The banner is generated on request, so it
  always reflects the fighter's current status — no stale images if a title changes.
- **Bio**: auto-generated from gym name, coach, and gym town/postcode, so location always appears
  on the profile without the fighter having to type free text.
