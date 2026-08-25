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
tests, the highest-value first targets are the pure helpers with no DOM dependency: `app.jsx`'s
schema migrations (`runMigrations`) and PIN/vault crypto (`derivePinHash`, `deriveVaultKey`).

## File map

| File | Role |
|---|---|
| `app.jsx` | Core application — all shared pages, Home dashboard, navigation, theming, persistence, migrations, the PIN/vault lock, and the `window.__v` bridge each chunk reads from. |
| `app.fantasy.jsx` | Fantasy football chunk — Sleeper/FantasyCalc-backed dashboard, trade analyzer, draft tools. |
| `app.golf.jsx` | Golf chunk — scorecards and handicap tracking. |
| `app.ravenseye.jsx` | Raven's Eye chunk — pen-test and threat-model tracking. |
| `app.mechanicalorchard.jsx` | Mechanical Orchard chunk — the 13 security-analyst tools (vulnerability analysis, CVE/KEV lookup, phishing header analysis, etc). |
| `app.jobsearch.jsx` | Job Search chunk — resume-matched cybersecurity role search. |
| `app.terraform.jsx` | Terraform chunk — curriculum viewer, progress dashboard, quiz engine, and a Workspace tab (editor + fmt/validate/plan/apply) for the Terraform Mastery course. |
| `terraform-bridge/` | A local companion process (not deployed anywhere — the user runs it on their own machine) that the Workspace tab talks to over `127.0.0.1` to actually run `terraform`. See its own README.md for the full security model. |
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

Then open `index.html` directly, or serve the directory with any static file server. The Netlify
Functions (the nflverse stats proxy, and the scheduled YouTube auto-poster's backend — see below)
won't run from a plain static server — use `netlify dev` (Netlify CLI) if you need to exercise
them locally.

## Deployment

Static hosting in two places, from the same build output:

- **Netlify** (canonical — the only one that can run `netlify/functions/` and serve the custom
  security headers in `netlify.toml`). Build command and headers are defined there.
- **GitHub Pages** (`https://andrewmakris2.github.io/hub/`) — serves the same static files as a
  fallback, but with no server-side functions and no custom headers. `index.html`'s own
  `<meta http-equiv="Content-Security-Policy">` tag is that copy's only CSP; it can't carry
  `frame-ancestors`, so Netlify's `X-Frame-Options: DENY` header is this site's only real
  clickjacking protection, and only on Netlify.

## Environment variables

Everything except the nflverse stats proxy is credential-free. One feature needs real server-side
secrets: the scheduled YouTube auto-poster (`post-random-video.js` /
`post-random-video-background.js`), which posts a random video from the server-side pool
(`autopost-upload-chunk.js`, `autopost-pool.js`) to YouTube on a cron with no browser involved —
unlike every other integration in this app, that requires a refresh token, which requires a client
secret, which can never reach the browser. Set these in Netlify's site settings if you want that
feature running; leave them unset and it just no-ops (each function logs why and returns early):

- `GOOGLE_SERVER_CLIENT_ID` / `GOOGLE_SERVER_CLIENT_SECRET` — a **second** OAuth Client ID (type
  "Web application") in the same Google Cloud project the browser-side `googleClientId` setting
  already uses, with `youtube.upload` scope. This one needs a client secret; the browser-side one
  can't have one, so it can't do this. Authorized redirect URI:
  `https://bearvantagehub.netlify.app/.netlify/functions/youtube-auth-callback`. Also flip
  **OAuth consent screen → Audience → Publish app** (Testing → In production) — otherwise Google
  expires the refresh token after 7 days; publishing removes that cap without requiring Google's
  full verification review for an app under 100 users.
- `YOUTUBE_REFRESH_TOKEN` — obtained by visiting
  `/.netlify/functions/youtube-auth-start` once the two vars above are set; the callback page
  shows it once to copy in.
- `AUTOPOST_TITLE` — the title used for every auto-post. Defaults to "Vantage auto-post" if unset.
  Can hold several titles separated by `|` (e.g. `GYM Day|Leg Day|Cardio Session`) — one is picked
  at random each post; a single title with no `|` still works exactly as before. The post date is
  always appended, so even a one-title setup varies day to day.
- `INTERNAL_TRIGGER_SECRET` — any random string you pick. Gates the scheduled function's internal
  handoff to the background function that does the actual upload, so that URL isn't a bare,
  guessable "post a video right now" endpoint.
- `NETLIFY_BLOBS_TOKEN` — a Netlify Personal Access Token (User settings → Applications →
  New access token). Netlify's "automatic" Blobs configuration (the same `getStore(name)` call
  `_lib/statsData.js` already relies on) turned out to be unreliable specifically for *writes* on
  this project's functions — reads succeeded, writes threw `MissingBlobsEnvironmentError` even on
  retry. `_lib/videoPool.js` falls back to explicit `siteID`/`token` config (Netlify's own
  documented manual path) when this is set, which sidesteps that detection entirely. Only the
  auto-poster's Blobs usage needs this; `_lib/statsData.js`'s read-heavy cache is unaffected and
  left on automatic config.

Auto-posts are always `privacyStatus: private` — Google restricts unverified apps (this one) to
private-only API uploads regardless of the publishing-status toggle above, which is a separate,
additional content-audit process not pursued here.

If you previously set `SESSION`, `TIKTOK_CLIENT_KEY`/`SECRET`, `YAHOO_CLIENT_ID`/`SECRET`,
`VANTAGE_URL`, or `VANTAGE_ORIGIN` in Netlify's site settings, none of them are read by anything
anymore — safe to remove, though harmless to leave.

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
- "Share to TikTok" (`shareVideoFile` in `app.jsx`) uses the device's own share sheet
  (`navigator.share`), or a plain file download when that's unavailable, to hand a video off to
  the TikTok app directly. No backend, no token, no server involved at all. The manual "Post to
  YouTube" button (`PostToYouTubeModal`) is similar but does a real upload — the access token it
  gets from Google is short-lived and held only in browser memory, never sent to or stored by any
  BearVantageHub server, same as Calendar's.
- **The scheduled YouTube auto-poster is the one exception to "nothing lives on our server."**
  Videos added to its pool (the "Add to auto-post pool" button on the Videos page) are uploaded
  in pieces to this site's own Netlify Blobs storage and held there — under this same Google
  account's control, not a third party's — until the scheduled job posts and deletes them. A
  Google OAuth refresh token is also stored server-side (as the `YOUTUBE_REFRESH_TOKEN`
  environment variable) so the scheduled job can post without anyone present. See "Environment
  variables" above for the full mechanism. Every auto-post is Private. Since nothing pushes a
  notification when it runs, `AutopostAlert` (Home page) shows the last post or failure once on
  next load, and warns if the pool's down to its last video. A "Pause" toggle next to the pool
  count (Videos page) skips scheduled runs without emptying the pool — useful before a trip.
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
those integrations actually call. One narrow, explicit exception to the "https only" rule:
`http://127.0.0.1:4787` for the Terraform Workspace tab's local bridge (see below) — a single
fixed plain-HTTP loopback address, not a general HTTP allowance.

## Local Terraform bridge

The Terraform page's **Workspace** tab (editor, `fmt`/`validate`/`plan`/`apply`) is the one place
in Hub that can touch real infrastructure, so it's built differently from everything else here:
nothing about it runs on Netlify, and no server anywhere holds an AWS credential. Instead,
`terraform-bridge/terraform-bridge.js` is a small companion script the user runs on their own
machine (`node terraform-bridge/terraform-bridge.js /path/to/project`); the Workspace tab talks to
it over `127.0.0.1:4787`, and it shells out to the user's own already-configured local `terraform`.

That's viable at all because `127.0.0.1`/`localhost` is a browser-spec "potentially trustworthy
origin" — an HTTPS page can `fetch()` it without mixed-content blocking, the same mechanism every
local dev server (Vite, webpack-dev-server, etc.) already relies on.

Full security model — origin+token gating, no shell/arbitrary-command surface, `apply` can only
ever apply a plan the bridge just generated and showed the user, file access locked to the chosen
workspace directory — is in `terraform-bridge/README.md`. The short version: this process only
exists, and Hub can only reach it, while the user is deliberately running it in their own
terminal — closing that terminal is the master off switch.

## Known gaps (intentionally not fixed here)

- No CI, no automated tests, no generated-file freshness check (nothing currently guarantees a
  commit's `index.html` matches its `app.jsx`).
- `app.jsx` (15k+ lines) and `securityx.html` (~1MB) are both large, single-file surfaces —
  workable for one person who knows them well, harder to safely change piecemeal as they grow.
  Splitting `app.jsx` into domain modules behind stable interfaces is a real, but multi-week,
  undertaking — not attempted here.
- Every form input has an `aria-label` (added after an accessibility audit flagged 65 that only
  had `placeholder` text), but almost none has a persistent *visible* `<label>` — the accessible
  name exists, the on-screen affordance mostly doesn't. Fine for a screen reader, not ideal for
  someone who just prefers seeing labels.
