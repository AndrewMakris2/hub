# BearVantageHub

A single-user, local-first personal dashboard — fitness, golf, fantasy football, finances,
entertainment, travel, and a working information-security toolkit, all in one static page.
Everything you enter lives in your own browser; there is no account system and no general
application database. See [privacy.html](privacy.html) for the full data-handling policy.

Live: https://bearvantagehub.netlify.app · also mirrored at https://andrewmakris2.github.io/hub/

For a guided, page-by-page tour of what the app actually does, see the user guide generated
alongside this repo (`BearVantageHub-User-Guide.docx`) rather than this file — this README is
the operating contract for whoever edits the code next.

## How it's built

`app.jsx` is the source of truth for the core application — pages, navigation, theming, and a
`window.__v` bridge object that five feature-specific chunk files read shared utilities from.
`build.js` compiles `app.jsx` with Babel Standalone, minifies it with Terser, and inlines the
result directly into `index.html` from the `index.shell.html` template — so the browser never
runs a compiler, and the published `index.html` is the entire app with no build step for a
visitor. The compiled chunk files are written alongside it as their own static `.js` files, each
loaded only when its page is opened.

```
node build.js
```

Run this after every edit to `app.jsx` or any `app.*.jsx` chunk, and commit the regenerated
`index.html` / `chunk-*.js` files together with the source change — they are checked into the
repository rather than built at deploy time (Netlify also runs it: see `netlify.toml`'s
`npm install && node build.js`, useful as a second, deploy-time confirmation that the committed
output actually matches the source).

There is currently no automated check that a commit's compiled output matches its source, and no
test suite — changes are verified by hand, in a real browser, against the live app. If you add
tests, the highest-value first targets are the pure helpers with no DOM dependency: the OAuth
state signing/verification in `netlify/functions/_lib/oauthState.js`, and `app.jsx`'s schema
migrations (`runMigrations`) and PIN/vault crypto (`derivePinHash`, `deriveVaultKey`).

## File map

| File | Role |
|---|---|
| `app.jsx` | Core application — all shared pages, Home dashboard, navigation, theming, persistence, migrations, the PIN/vault lock, and the `window.__v` bridge each chunk reads from. |
| `app.fantasy.jsx` | Fantasy football chunk — Sleeper/FantasyCalc-backed dashboard, trade analyzer, draft tools. |
| `app.golf.jsx` | Golf chunk — scorecards and handicap tracking. |
| `app.ravenseye.jsx` | Raven's Eye chunk — pen-test and threat-model tracking. |
| `app.mechanicalorchard.jsx` | Mechanical Orchard chunk — the 13 security-analyst tools (vulnerability analysis, CVE/KEV lookup, phishing header analysis, etc). |
| `app.jobsearch.jsx` | Job Search chunk — resume-matched cybersecurity role search. |
| `app.terraform.jsx` | Terraform chunk — curriculum viewer, progress dashboard, and quiz engine for the Terraform Mastery course. |
| `build.js` | The compile step described above. |
| `index.shell.html` | The static HTML/CSS shell `build.js` injects the compiled app into (via the `<!--APP-->` marker). |
| `index.html` | Generated — do not hand-edit. Overwritten by every `node build.js` run. |
| `chunk-*.js` | Generated — do not hand-edit. One per chunk file above. |
| `sw.js` | Service worker: caches the app shell (not every page/chunk) for offline use and installability. |
| `manifest.json` | PWA manifest — name, icons, install behavior. |
| `securityx.html` | A separate, large standalone page (CompTIA SecurityX/CAS-005 study material), embedded via `<iframe>` from the SecurityX tab. Not compiled by `build.js` — it's its own static file with its own, more permissive CSP (see below). |
| `netlify.toml` | Build command, security headers, and CSP for both the main origin and `securityx.html`. |
| `netlify/functions/` | The small serverless surface — see below. |
| `privacy.html`, `terms.html` | The public-facing privacy policy and terms. Keep these honest against what the code in `netlify/functions/` actually does — see "Data & privacy" below. |

## Running it locally

No build tooling is required to just view the current compiled state — `index.html` is
self-contained. To make and preview a change:

```
npm install          # once, installs @babel/standalone, terser, @netlify/blobs
node build.js         # recompiles index.html and every chunk-*.js from app.jsx
```

Then open `index.html` directly, or serve the directory with any static file server. The
Netlify Functions (OAuth callbacks, player-stat lookups) won't run from a plain static server —
use `netlify dev` (Netlify CLI) if you need to exercise those locally, with the environment
variables below set in a local `.env`.

## Deployment

Static hosting in two places, from the same build output:

- **Netlify** (canonical — the only one that can run `netlify/functions/` and serve the custom
  security headers in `netlify.toml`). Build command and headers are defined there; Netlify Blobs
  is used for server-side token storage (see below).
- **GitHub Pages** (`https://andrewmakris2.github.io/hub/`) — serves the same static files as a
  fallback, but with no server-side functions and no custom headers. `index.html`'s own
  `<meta http-equiv="Content-Security-Policy">` tag is that copy's only CSP; it can't carry
  `frame-ancestors`, so Netlify's `X-Frame-Options: DENY` header is this site's only real
  clickjacking protection, and only on Netlify.

## Environment variables

All set in Netlify's site settings (Site configuration → Environment variables), never committed.

| Variable | Used by | Required for |
|---|---|---|
| `SESSION` | `tiktok-auth-start.js`, `tiktok-callback.js` | HMAC-signs the OAuth state param. Without it, TikTok connect refuses to start. |
| `TIKTOK_CLIENT_KEY` | `tiktok-callback.js` | TikTok token exchange (public value — the same one entered in the app's Settings). |
| `TIKTOK_CLIENT_SECRET` | `tiktok-callback.js` | TikTok token exchange. Secret — never sent to the browser. |
| `TIKTOK_REDIRECT_URI` | `tiktok-callback.js` | Must exactly match what's registered in TikTok's Login Kit settings. |
| `VANTAGE_URL` | `tiktok-callback.js`, `tiktok-auth-start.js` | Where to redirect the browser back to after a connect/error. Defaults to the GitHub Pages URL if unset. |
| `VANTAGE_ORIGIN` | `tiktok-status.js`, `tiktok-disconnect.js` | CORS allow-origin for those two endpoints. `_lib/cors.js`'s `corsHeaders()` (used elsewhere) instead allowlists both known origins directly and doesn't need this variable. |

Nothing here is required for the dashboard itself to work — every one of these only gates the
optional TikTok connection. Sleeper (Fantasy) needs no credentials at all — it's read directly
from the browser.

## Data & privacy — what actually happens, not just what's promised

`privacy.html` is the source of truth for users; keep it accurate rather than aspirational. As of
this writing:

- Everything under a `dash.*` `localStorage` key (fitness, finances, journal, habits, profile,
  agenda, and most other dashboard data) never leaves the browser. Larger blobs (uploaded videos,
  some templates) live in IndexedDB instead.
- An optional PIN gate (`app.jsx`, "APP LOCK" section) hashes the PIN with PBKDF2 and is a
  privacy screen, not encryption — the underlying data is still plaintext in storage. A separate,
  opt-in "Lock now" action derives a second, non-extractable AES-256-GCM key from the same PIN and
  encrypts a full snapshot into `dash.encryptedVault`, clearing every other `dash.*` key. This
  only protects data from the moment you explicitly lock (or a fresh load finds it already
  locked) — closing the tab without locking leaves that session's data as plaintext, same
  boundary the PIN gate itself has. See the comment above `VAULT_STORAGE_KEY` in `app.jsx` for
  the full reasoning.
- Google Calendar / Microsoft Outlook tokens are held only in browser memory for the session —
  never sent to or stored by any BearVantageHub server.
- Sleeper (Fantasy) needs no OAuth at all — its public API is read directly from the browser with
  just a username. Nothing is stored server-side.
- TikTok tokens **are** stored server-side (Netlify Blobs, `tiktok-tokens` store, key `"primary"`)
  — access token, refresh token, and both expiry timestamps, kept until you disconnect. The
  connect flow's OAuth `state` is HMAC-signed and expires after 10 minutes
  (`tiktok-auth-start.js` / `tiktok-callback.js` / `_lib/oauthState.js`). Disconnecting
  (Settings → TikTok → "Disconnect") deletes the stored token via `tiktok-disconnect.js`.
- The exported JSON backup (Settings → Backup) is **plaintext** and can contain financial,
  journal, and profile data along with integration configuration — treat it like any other
  sensitive personal file.

If you change what any integration stores or how long it's kept, update `privacy.html` in the
same change — the two drifting apart is worse than either one being conservative.

## Security headers & CSP

Defined in `netlify.toml`, not in code. Two policies exist because `securityx.html` is loaded in
an `<iframe>` and needs `unsafe-eval` for its own tooling — it's isolated to its own, more
permissive header set (`X-Frame-Options: SAMEORIGIN`, broader `script-src`) rather than relaxing
the main site's policy. The main site's `script-src` allows `'unsafe-inline'` (required — the
compiled app ships as one inline `<script>` block) plus a specific CDN allowlist (unpkg,
accounts.google.com, cdnjs, jsdelivr, sheetjs); `connect-src` is `'self' https:`, i.e. any HTTPS
origin — deliberately broad, since the app calls a couple dozen distinct public APIs directly
from the browser by design (Google, Microsoft, YouTube, Last.fm, ESPN, Open-Meteo, Open Library,
Google News RSS, FantasyCalc, NVD, CISA KEV, and more). Narrowing this to an explicit allowlist is
a real hardening step, but a nontrivial one — it means enumerating and maintaining every domain
those integrations actually call.

## Known gaps (intentionally not fixed here)

- No CI, no automated tests, no generated-file freshness check (nothing currently guarantees a
  commit's `index.html` matches its `app.jsx`).
- `app.jsx` (15k+ lines) and `securityx.html` (~1MB) are both large, single-file surfaces —
  workable for one person who knows them well, harder to safely change piecemeal as they grow.
  Splitting `app.jsx` into domain modules behind stable interfaces is a real, but multi-week,
  undertaking — not attempted here.
- Many form inputs use `placeholder` text without a persistent, associated `<label>`. Functional,
  but a real accessibility gap worth a dedicated pass rather than a scattered one.
