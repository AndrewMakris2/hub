/*
  Fantasy tab chunk — Sleeper/FantasyCalc/Yahoo-backed fantasy-football hub
  ("The War Room"), lazy-loaded on first visit to #fantasy instead of shipping
  in every page's bundle. See build.js and the "LAZY-LOADED PAGE CHUNKS"
  comment in app.jsx for the loader contract this file participates in.
*/
const { useState, useEffect, useMemo, useRef } = React;
const { vantageIsDarkTheme } = window.__v;

// Nested router for the Fantasy tab's own sub-pages (mirrors the original
// app's react-router routes: /players, /players/:id, /trade-analyzer, ...).
// Reads everything after "fantasy/" in the hash so sub-pages stay bookmarkable
// and back/forward keeps working, same rationale as useHashRoute in core.
function useFantasySubRoute() {
  function resolve() {
    const raw = window.location.hash.replace(/^#/, "");
    if (!raw.startsWith("fantasy")) return [];
    const rest = raw.slice("fantasy".length).replace(/^\//, "");
    return rest ? rest.split("/") : [];
  }
  const [segments, setSegments] = useState(resolve);
  useEffect(() => {
    function onHashChange() {
      setSegments(resolve());
    }
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  function navigate(path) {
    window.location.hash = path ? `fantasy/${path}` : "fantasy";
  }
  return [segments, navigate];
}

// Generic TTL cache for the Fantasy tab's larger client-fetched payloads (the
// ~14MB Sleeper player directory, FantasyCalc trade values per format) —
// IndexedDB for anything too big/ephemeral for localStorage.
const FF_CACHE_DB_NAME = "vantage-fantasy-cache";
const FF_CACHE_STORE = "cache";

function openFFCacheDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("This browser doesn't support local caching."));
      return;
    }
    const req = indexedDB.open(FF_CACHE_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(FF_CACHE_STORE)) {
        db.createObjectStore(FF_CACHE_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbGetCache(id) {
  const db = await openFFCacheDB();
  return new Promise((resolve) => {
    const req = db.transaction(FF_CACHE_STORE, "readonly").objectStore(FF_CACHE_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

async function dbSetCache(id, data) {
  const db = await openFFCacheDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(FF_CACHE_STORE, "readwrite");
    tx.objectStore(FF_CACHE_STORE).put({ id, data, fetchedAt: Date.now() });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Returns cached data if present and younger than maxAgeMs, else null — callers
// decide what to do on a miss (fetch fresh, then dbSetCache the result).
async function dbGetFreshCache(id, maxAgeMs) {
  const record = await dbGetCache(id);
  if (!record) return null;
  if (Date.now() - record.fetchedAt > maxAgeMs) return null;
  return record.data;
}

/* ----------------------------------------------------------------------
   FANTASY TAB — ported from "The War Room" (a separate fantasy-football
   dashboard app: react-router + react-query + Netlify Functions/Blobs).
   Its own design system (FF_CSS below) is pasted in near-verbatim and
   rendered inside a real Shadow DOM subtree (FFShadowRoot) so its ~300
   classes never have to be reconciled with Vantage's theme system — style
   isolation works in both directions for free. Only two seams change from
   the original file: ":root" -> ":host" (a shadow tree has no document
   root), and --accent reads from --ff-accent, which FFShadowRoot sets from
   Vantage's active theme.accent — the one deliberate "both of the above"
   hook between the two design systems the user asked for. The outer page
   header/sub-nav around it is plain Vantage theme-driven JSX, same as every
   other page.
---------------------------------------------------------------------- */

const FF_CSS = `
:host {
  /* Surfaces */
  --bg: #0a0d12;
  --surface: #131820;
  --surface-2: #1a2029;
  --surface-3: #222a36;
  --border: #262e3a;
  --border-strong: #37414f;

  /* Text */
  --text: #eef1f5;
  --text-secondary: #b9c1cd;
  --muted: #7c8798;

  /* Brand / accent */
  --accent: var(--ff-accent, #2f7dff);
  --accent-strong: #1f63e6;
  --accent-soft: rgba(47, 125, 255, 0.16);
  --teal: #17d9c4;
  --accent-gradient: linear-gradient(135deg, var(--accent), var(--teal));

  /* Functional */
  --success: #22c55e;
  --success-soft: rgba(34, 197, 94, 0.14);
  --danger: #ef4444;
  --danger-soft: rgba(239, 68, 68, 0.14);
  --warning: #f59e0b;
  --warning-soft: rgba(245, 158, 11, 0.14);

  /* Tiers */
  --gold: #ffd166;
  --silver: #cbd5e1;
  --bronze: #d99a5b;

  /* Positions */
  --pos-qb: #ef5158;
  --pos-rb: #2fbf71;
  --pos-wr: #3b82f6;
  --pos-te: #f0973b;
  --pos-k: #a78bfa;
  --pos-def: #6b7684;
  --pos-pick: #d4a017;

  /* Platforms */
  --sleeper: #4c6ef5;
  --yahoo: #6b21d8;

  /* Shape */
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-pill: 999px;

  /* Shadow */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.5), 0 1px 1px rgba(0, 0, 0, 0.35);
  --shadow-md: 0 6px 16px rgba(0, 0, 0, 0.4);
  --shadow-glow: 0 0 0 1px var(--accent-soft), 0 8px 22px rgba(47, 125, 255, 0.28);

  /* Base — ported from index.css's body{} rule; there's no <body> inside a
     shadow tree, so these live on :host and inherit down instead. */
  display: block;
  background: var(--bg);
  color: var(--text);
  font-family: "Space Grotesk", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  font-size: 15px;
  line-height: 1.45;
  -webkit-font-smoothing: antialiased;
}

/* ---------- Reset ---------- */

* {
  box-sizing: border-box;
}

a {
  color: var(--accent);
}

h1,
h2,
h3 {
  margin: 0 0 0.5rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--text);
}

h1 {
  font-size: 1.9rem;
}

h2 {
  font-size: 1.25rem;
  margin-top: 0;
}

h3 {
  font-size: 1rem;
}

p {
  margin: 0 0 0.75rem;
  color: var(--text-secondary);
}

::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--border-strong);
  border-radius: var(--radius-pill);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--accent);
}

/* ---------- Buttons, inputs, selects ---------- */

button,
.button-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.4rem;
  background: var(--accent-gradient);
  color: #051220;
  border: none;
  border-radius: var(--radius-md);
  padding: 0.55rem 1.1rem;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  text-decoration: none;
  box-shadow: var(--shadow-sm);
  transition: filter 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
}

button:hover,
.button-link:hover {
  filter: brightness(1.08);
  box-shadow: var(--shadow-glow);
}

button:active,
.button-link:active {
  transform: translateY(1px);
}

button:disabled {
  background: var(--surface-3);
  color: var(--muted);
  cursor: not-allowed;
  box-shadow: none;
  filter: none;
}

input[type="text"],
input[type="number"],
select {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  color: var(--text);
  padding: 0.55rem 0.75rem;
  font-size: 0.9rem;
  font-family: inherit;
}

input[type="text"]:focus,
input[type="number"]:focus,
select:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px var(--accent-soft);
}

select {
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, var(--muted) 50%),
    linear-gradient(135deg, var(--muted) 50%, transparent 50%);
  background-position: calc(100% - 18px) center, calc(100% - 13px) center;
  background-size: 5px 5px, 5px 5px;
  background-repeat: no-repeat;
  padding-right: 2rem;
  cursor: pointer;
}

input[type="checkbox"] {
  accent-color: var(--accent);
  width: 16px;
  height: 16px;
}

/* ---------- Layout ---------- */

.page {
  max-width: 1080px;
  margin: 0 auto;
  padding: 0.5rem 0 3.5rem;
  width: 100%;
  flex: 1;
}

.page--wide {
  max-width: 1360px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border);
  gap: 1rem;
  flex-wrap: wrap;
}

.page-header h1 {
  font-size: 1.5rem;
}

section {
  margin-bottom: 2rem;
}

.filter-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
  align-items: center;
}

.filter-bar input[type="text"] {
  flex: 1 1 220px;
}

.filter-bar--secondary {
  margin-top: -0.25rem;
}

.filter-toggle {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-weight: 600;
  font-size: 0.85rem;
  cursor: pointer;
  padding: 0.5rem 0.8rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.filter-toggle:has(input:checked) {
  color: var(--text);
  border-color: var(--accent);
  background: var(--accent-soft);
}

.empty-state {
  color: var(--muted);
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination__status {
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 600;
}

.pagination button {
  background: var(--surface-2);
  color: var(--text);
  box-shadow: none;
}

.pagination button:hover:not(:disabled) {
  filter: none;
  background: var(--surface-3);
  box-shadow: none;
}

.pagination button:disabled {
  opacity: 0.5;
}

.error-text {
  color: var(--danger);
}

.success-text {
  color: var(--success);
}

.data-source-note {
  color: var(--muted);
  font-size: 0.78rem;
  margin: -0.4rem 0 1rem;
}

.warning-banner {
  background: var(--warning-soft);
  border: 1px solid color-mix(in srgb, var(--warning) 45%, transparent);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
  margin-bottom: 1rem;
  color: #ffd08a;
}

.back-link {
  background: none;
  border: none;
  box-shadow: none;
  padding: 0;
  color: var(--muted);
  text-decoration: none;
  display: inline-block;
  margin-bottom: 1rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.back-link:hover {
  color: var(--text);
  filter: none;
  transform: none;
  box-shadow: none;
}

/* ---------- Dashboard widget grid ---------- */

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(340px, 100%), 1fr));
  gap: 1.25rem;
  align-items: start;
}

.dashboard-widget {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
}

.dashboard-widget--wide {
  grid-column: 1 / -1;
}

.dashboard-widget__header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 0.75rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.dashboard-widget__header h2 {
  margin: 0;
}

.dashboard-widget__stack {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
}

/* ---------- Tables ---------- */

.data-table {
  width: 100%;
  border-collapse: collapse;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  font-variant-numeric: tabular-nums;
}

.data-table th,
.data-table td {
  text-align: left;
  padding: 0.6rem 0.85rem;
  border-bottom: 1px solid var(--border);
}

.data-table th {
  color: var(--muted);
  font-weight: 800;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  background: var(--surface-2);
}

.data-table tbody tr {
  transition: background-color 0.1s ease;
}

.data-table tbody tr:nth-child(even) {
  background: rgba(255, 255, 255, 0.015);
}

.data-table tbody tr:hover {
  background: var(--surface-3);
}

.data-table tbody tr:last-child td {
  border-bottom: none;
}

.data-table-scroll {
  overflow-x: auto;
  border-radius: var(--radius-lg);
}

.game-log-points {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.game-log-points__track {
  width: 60px;
  height: 6px;
  border-radius: var(--radius-pill);
  background: var(--surface-3);
  overflow: hidden;
  flex-shrink: 0;
}

.game-log-points__bar {
  height: 100%;
  border-radius: var(--radius-pill);
  background: var(--accent-gradient);
}

.data-table-scroll--frozen-first .data-table th:first-child,
.data-table-scroll--frozen-first .data-table td:first-child {
  position: sticky;
  left: 0;
  z-index: 1;
  background: rgba(26, 32, 41, 0.75);
}

.data-table-scroll--frozen-first .data-table tbody td:first-child {
  background: rgba(19, 24, 32, 0.75);
}

.data-table-scroll--frozen-first .data-table tbody tr:nth-child(even) td:first-child {
  background: rgba(23, 29, 38, 0.75);
}

.table-player-cell {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.table-player-link {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text);
  text-decoration: none;
  font-weight: 700;
}

.table-player-link:hover {
  color: var(--accent);
}

.players-table__number {
  color: var(--muted);
  font-size: 0.82rem;
  font-weight: 500;
}

.trending-count {
  color: var(--accent);
  font-weight: 800;
}

.injury-badge {
  color: var(--warning);
  font-size: 0.82rem;
  font-weight: 700;
}

.checklist {
  list-style: none;
  padding: 0;
  margin: 1rem 0;
}

.checklist li {
  padding: 0.35rem 0;
}

.checklist label {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  color: var(--text-secondary);
  font-weight: 600;
}

/* ---------- Badges ---------- */

.position-badge {
  display: inline-block;
  padding: 0.18rem 0.55rem;
  border-radius: var(--radius-sm);
  font-size: 0.7rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: #071019;
}

.position-badge--QB {
  background: var(--pos-qb);
  color: white;
}

.position-badge--RB {
  background: var(--pos-rb);
}

.position-badge--WR {
  background: var(--pos-wr);
  color: white;
}

.position-badge--TE {
  background: var(--pos-te);
}

.position-badge--K {
  background: var(--pos-k);
  color: white;
}

.position-badge--DEF {
  background: var(--pos-def);
  color: white;
}

.position-badge--PICK {
  background: var(--pos-pick);
}

.position-badge--UNK {
  background: var(--border-strong);
  color: var(--muted);
}

.platform-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: var(--radius-sm);
  font-size: 0.68rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: white;
  vertical-align: middle;
}

.platform-badge--sleeper {
  background: var(--sleeper);
}

.platform-badge--yahoo {
  background: var(--yahoo);
}

.team-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-weight: 700;
  color: var(--text-secondary);
}

.team-tag__dot {
  width: 8px;
  height: 8px;
  border-radius: 999px;
  flex-shrink: 0;
}

.rank-medal {
  font-weight: 800;
}

span.rank-medal--gold {
  color: var(--gold);
}

span.rank-medal--silver {
  color: var(--silver);
}

span.rank-medal--bronze {
  color: var(--bronze);
}

/* ---------- Avatars ---------- */

.player-avatar {
  border-radius: 999px;
  object-fit: cover;
  background: var(--surface-3);
  border: 1px solid var(--border);
  flex-shrink: 0;
}

.player-avatar--sm {
  width: 30px;
  height: 30px;
}

.player-avatar--md {
  width: 52px;
  height: 52px;
}

.player-avatar--lg {
  width: 120px;
  height: 120px;
  border-width: 3px;
  border-color: var(--accent);
  box-shadow: var(--shadow-glow);
}

.player-avatar--logo {
  object-fit: contain;
  background: var(--surface);
  padding: 4px;
}

.player-avatar--fallback {
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--muted);
  font-weight: 800;
  font-size: 0.8rem;
}

.player-avatar--lg.player-avatar--fallback {
  font-size: 2.2rem;
}

/* ---------- Watchlist ---------- */

.watchlist-button {
  background: none;
  border: none;
  box-shadow: none;
  padding: 0.1rem 0.2rem;
  color: var(--muted);
  font-size: 1.1rem;
  line-height: 1;
  flex-shrink: 0;
}

.watchlist-button:hover {
  color: var(--gold);
  filter: none;
  transform: none;
}

.watchlist-button--active {
  color: var(--gold);
}

h1 .watchlist-button {
  font-size: 1.25rem;
  vertical-align: middle;
  margin-left: 0.4rem;
}

/* ---------- Top players list (Dashboard) ---------- */

.top-players-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.top-player-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.75rem;
  text-decoration: none;
  color: var(--text);
  transition: border-color 0.12s ease, background-color 0.12s ease;
}

.top-player-row:hover {
  border-color: var(--accent);
  background: var(--surface-3);
}

.top-player-row__rank {
  color: var(--accent);
  font-weight: 800;
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  width: 2rem;
  flex-shrink: 0;
}

.top-player-row__name {
  font-weight: 700;
  font-size: 0.9rem;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.top-player-row__value {
  color: var(--text-secondary);
  font-weight: 700;
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  margin-left: auto;
}

/* ---------- League cards / matchup ---------- */

.league-grid {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.league-card {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.75rem 0.9rem;
  text-decoration: none;
  color: var(--text);
  transition: border-color 0.12s ease, background-color 0.12s ease;
}

.league-card:hover {
  border-color: var(--accent);
  background: var(--surface-3);
}

.league-card__body {
  flex: 1;
  min-width: 0;
}

.league-card__body h3 {
  margin: 0;
  font-size: 0.95rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.league-card__team {
  color: var(--text-secondary);
  margin: 0.1rem 0 0;
  font-size: 0.82rem;
}

.league-card__record {
  color: var(--muted);
  font-size: 0.85rem;
  font-weight: 700;
  margin: 0;
  text-align: right;
  white-space: nowrap;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.1rem;
}

.league-card__season {
  color: var(--muted);
  font-size: 0.72rem;
  font-weight: 500;
}

.matchup-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.5rem;
  box-shadow: var(--shadow-sm);
}

.matchup-card__team {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.35rem;
  flex: 1;
  padding: 0.75rem;
  border-radius: var(--radius-md);
}

.matchup-card__team--leading {
  background: var(--success-soft);
}

.matchup-card__name {
  font-weight: 700;
}

.matchup-card__score {
  font-size: 1.75rem;
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  color: var(--text-secondary);
}

.matchup-card__team--leading .matchup-card__score {
  color: var(--success);
}

.matchup-card__vs {
  color: var(--muted);
  font-weight: 800;
  font-size: 0.85rem;
}

.league-settings__positions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 0.3rem;
}

.transactions-feed {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.transactions-feed__row {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.75rem 1rem;
}

.transactions-feed__type {
  flex-shrink: 0;
  font-size: 0.72rem;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--accent);
  min-width: 6.5rem;
}

.transactions-feed__body {
  flex: 1;
  color: var(--text-secondary);
  font-size: 0.88rem;
}

.transactions-feed__body p {
  margin: 0.15rem 0;
}

.transactions-feed__date {
  flex-shrink: 0;
  color: var(--muted);
  font-size: 0.78rem;
  font-weight: 600;
}

/* ---------- Player profile ---------- */

.player-profile__banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1.5rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.75rem;
}

.player-profile__identity {
  display: flex;
  align-items: center;
  gap: 1.1rem;
}

.player-profile__identity h1 {
  font-size: 1.55rem;
  margin-bottom: 0.35rem;
}

.player-profile__number {
  color: var(--muted);
  font-size: 0.9rem;
  margin-left: 0.5rem;
  font-weight: 500;
}

.player-profile__meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: var(--muted);
  font-weight: 600;
}

.player-profile__stats {
  display: flex;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.player-profile__stats > div {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.player-profile__bio-label {
  color: var(--muted);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
}

.player-profile__stats span:last-child {
  font-size: 0.95rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.ranking-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
}

.ranking-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.3rem;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.1rem 1rem;
  text-align: center;
  box-shadow: var(--shadow-sm);
}

.ranking-card__label {
  color: var(--muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
}

.ranking-card__rank {
  font-size: 1.4rem;
  font-weight: 800;
  color: var(--accent);
  font-variant-numeric: tabular-nums;
}

.ranking-card__value {
  color: var(--text);
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

.ranking-card__unranked {
  color: var(--muted);
  font-weight: 600;
  padding: 0.5rem 0;
}

/* ---------- Trade analyzer ---------- */

.trade-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.trade-vs {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  border-radius: 999px;
  background: var(--accent-gradient);
  color: #051220;
  font-weight: 800;
  font-size: 0.8rem;
  letter-spacing: 0.03em;
  box-shadow: var(--shadow-sm);
  justify-self: center;
}

@media (max-width: 700px) {
  .trade-grid {
    grid-template-columns: 1fr;
  }
  .trade-vs {
    margin: -0.25rem auto;
  }
}

.trade-side {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.15rem;
  box-shadow: var(--shadow-sm);
}

.trade-side h3 {
  margin: 0 0 0.75rem;
  font-size: 1.02rem;
}

.trade-side input[type="text"] {
  width: 100%;
  margin-right: 0;
  margin-bottom: 0.5rem;
  box-sizing: border-box;
}

.trade-side__matches {
  list-style: none;
  padding: 0;
  margin: 0 0 0.75rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.trade-side__matches button {
  display: block;
  width: 100%;
  text-align: left;
  background: transparent;
  color: var(--text);
  border-radius: 0;
  padding: 0.55rem 0.85rem;
  font-weight: 500;
  box-shadow: none;
}

.trade-side__matches button:hover {
  background: var(--surface-2);
  filter: none;
  transform: none;
}

.trade-side__selected {
  list-style: none;
  padding: 0;
  margin: 0;
}

.trade-side__selected li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--border);
  font-weight: 600;
}

.trade-side__value {
  color: var(--accent);
  font-weight: 800;
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
}

.trade-side__remove {
  background: none;
  border: none;
  box-shadow: none;
  padding: 0 0.3rem;
  color: var(--muted);
  font-size: 1.1rem;
  line-height: 1;
}

.trade-side__remove:hover {
  color: var(--danger);
  filter: none;
  transform: none;
}

.trade-side__total {
  margin: 0.75rem 0 0;
  font-weight: 700;
}

.trade-verdict {
  border-radius: var(--radius-lg);
  padding: 1rem;
  font-weight: 700;
  text-align: center;
  border: 1px solid var(--border);
}

.trade-verdict--neutral {
  background: var(--surface);
  color: var(--muted);
}

.trade-verdict--even {
  background: var(--success-soft);
  border-color: color-mix(in srgb, var(--success) 45%, transparent);
  color: #86efac;
}

.trade-verdict--lopsided {
  background: var(--warning-soft);
  border-color: color-mix(in srgb, var(--warning) 45%, transparent);
  color: #fcd34d;
}

.trade-review-trigger {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}

/* ---------- Comparison table ---------- */

.comparison-scroll {
  overflow-x: auto;
  margin-top: 1rem;
  border-radius: var(--radius-lg);
}

.comparison-table {
  min-width: 100%;
}

.comparison-table th,
.comparison-table td {
  white-space: nowrap;
}

.comparison-table__label {
  color: var(--muted);
  font-weight: 800;
  position: sticky;
  left: 0;
  background: var(--surface);
}

.comparison-table th:first-child {
  position: sticky;
  left: 0;
  background: var(--surface-2);
  z-index: 1;
}

.comparison-table__player {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.comparison-table__player a {
  color: var(--text);
  text-decoration: none;
  font-weight: 700;
}

.comparison-table__player a:hover {
  color: var(--accent);
}

.comparison-table__winner {
  color: var(--success);
  font-weight: 800;
}

/* ---------- Modal ---------- */

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(4, 6, 10, 0.78);
  backdrop-filter: blur(3px);
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 4vh 1.5rem;
  z-index: 100;
  overflow-y: auto;
}

.modal-panel {
  width: 100%;
  max-width: 640px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-md);
  max-height: 92vh;
  display: flex;
  flex-direction: column;
}

.modal-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.15rem 1.4rem;
  border-bottom: 1px solid var(--border);
}

.modal-panel__header h2 {
  margin: 0;
  font-size: 1.1rem;
}

.modal-panel__close {
  background: none;
  border: none;
  box-shadow: none;
  padding: 0.2rem 0.5rem;
  color: var(--muted);
  font-size: 1.4rem;
  line-height: 1;
}

.modal-panel__close:hover {
  color: var(--text);
  filter: none;
  transform: none;
}

.modal-panel__body {
  padding: 1.4rem;
  overflow-y: auto;
}

.comparison-modal__stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.player-detail-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 1rem;
}

.player-detail-card__label {
  display: inline-block;
  color: var(--muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.player-detail-card__header {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  margin-bottom: 0.9rem;
}

.player-detail-card__name {
  color: var(--text);
  text-decoration: none;
  font-weight: 800;
  font-size: 1rem;
}

.player-detail-card__name:hover {
  color: var(--accent);
}

.player-detail-card__meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  margin-top: 0.35rem;
  color: var(--muted);
  font-weight: 600;
  font-size: 0.85rem;
}

.player-detail-card__grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(105px, 1fr));
  gap: 0.8rem;
}

.player-detail-card__grid > div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.player-detail-card__stat-label {
  color: var(--muted);
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
}

.trade-review-modal__verdict {
  text-align: center;
  font-weight: 700;
  margin: 0 0 1.15rem;
}

.trade-review-modal__columns {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.15rem;
}

.trade-review-modal__columns h3 {
  margin: 0 0 0.75rem;
  font-size: 0.95rem;
}

@media (max-width: 600px) {
  .trade-review-modal__columns {
    grid-template-columns: 1fr;
  }
}

/* ---------- Onboarding ---------- */

.onboarding-section {
  background: var(--surface);
  border: 1px solid var(--border);
  border-left: 3px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.4rem;
  box-shadow: var(--shadow-sm);
}

.onboarding-section--sleeper {
  border-left-color: var(--sleeper);
}

.onboarding-section--yahoo {
  border-left-color: var(--yahoo);
}

/* ---------- Import rankings ---------- */

.import-rankings__form,
.import-rankings__review,
.import-rankings__saved {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.4rem;
  box-shadow: var(--shadow-sm);
  margin-bottom: 1.4rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.import-rankings__form label {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
  font-weight: 700;
}

.import-rankings__step {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.3rem;
  height: 1.3rem;
  border-radius: var(--radius-pill);
  background: var(--accent-gradient);
  color: #051220;
  font-size: 0.72rem;
  font-weight: 800;
  margin-right: 0.3rem;
}

.import-rankings__form input[type="text"],
.import-rankings__form textarea {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.6rem 0.75rem;
  color: var(--text);
  font-size: 0.92rem;
  font-family: inherit;
}

.import-rankings__section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.import-rankings__line {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
  padding: 0.6rem 0.75rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
}

.import-rankings__line-text {
  flex: 1 1 240px;
  color: var(--text);
}

.import-rankings__search {
  position: relative;
  flex: 1 1 220px;
}

.ranking-set-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
  gap: 0.8rem;
}

.ranking-set-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  text-align: left;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.85rem 1rem;
  cursor: pointer;
  transition: border-color 0.12s ease, background-color 0.12s ease;
}

.ranking-set-card:hover {
  border-color: var(--accent);
  background: var(--surface-3);
}

.ranking-set-card--active {
  border-color: var(--accent);
  box-shadow: var(--shadow-glow);
}

.ranking-set-card__name {
  font-weight: 800;
  font-size: 0.92rem;
  color: var(--text);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-set-card__count {
  font-size: 0.78rem;
  color: var(--muted);
}

.ranking-set-card__bar {
  display: flex;
  height: 6px;
  border-radius: var(--radius-pill);
  overflow: hidden;
  background: var(--surface-3);
}

.ranking-set-card__bar-segment {
  height: 100%;
}

.ranking-set-card__bar-segment--QB {
  background: var(--pos-qb);
}

.ranking-set-card__bar-segment--RB {
  background: var(--pos-rb);
}

.ranking-set-card__bar-segment--WR {
  background: var(--pos-wr);
}

.ranking-set-card__bar-segment--TE {
  background: var(--pos-te);
}

.ranking-set-card__bar-segment--K {
  background: var(--pos-k);
}

.ranking-set-card__bar-segment--DEF {
  background: var(--pos-def);
}

.ranking-set-viewer {
  margin-top: 1.2rem;
  padding-top: 1.2rem;
  border-top: 1px solid var(--border);
}

.ranking-set-viewer__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.ranking-set-viewer__header h3 {
  margin: 0;
}

.ranking-set-viewer__actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.ranking-set-viewer__filters {
  display: flex;
  gap: 0.35rem;
}

.ranking-set-filter-chip {
  background: var(--surface-2);
  border: 1px solid var(--border);
  box-shadow: none;
  color: var(--text-secondary);
  padding: 0.3rem 0.7rem;
  font-size: 0.78rem;
  font-weight: 700;
  border-radius: var(--radius-pill);
}

.ranking-set-filter-chip:hover {
  filter: none;
  border-color: var(--accent);
  color: var(--text);
}

.ranking-set-filter-chip--active {
  background: var(--accent-gradient);
  border-color: transparent;
  color: #051220;
}

.ranking-set-viewer__delete {
  background: none;
  border: 1px solid var(--border);
  box-shadow: none;
  padding: 0.3rem 0.7rem;
  font-size: 0.78rem;
  color: var(--muted);
  border-radius: var(--radius-sm);
}

.ranking-set-viewer__delete:hover {
  color: var(--danger);
  border-color: var(--danger);
  filter: none;
  transform: none;
}

.ranking-set-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  max-height: 640px;
  overflow-y: auto;
}

.ranking-set-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.75rem;
  text-decoration: none;
  color: var(--text);
  transition: border-color 0.12s ease, background-color 0.12s ease;
}

.ranking-set-row:hover {
  border-color: var(--accent);
  background: var(--surface-3);
}

.ranking-set-row__rank {
  width: 2.5rem;
  flex-shrink: 0;
  font-weight: 800;
  font-size: 0.85rem;
  font-variant-numeric: tabular-nums;
  color: var(--accent);
}

.ranking-set-row__name {
  flex: 1;
  min-width: 0;
  font-weight: 700;
  font-size: 0.9rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.ranking-set-row__pos-rank {
  color: var(--muted);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  margin-left: auto;
}

/* ---------- Mock draft ---------- */

.draft-settings {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 1.25rem;
  box-shadow: var(--shadow-sm);
}

.draft-settings__row {
  display: flex;
  gap: 1.25rem;
  flex-wrap: wrap;
  margin-bottom: 1.1rem;
}

.draft-settings__row label,
.draft-settings__slot {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: var(--text-secondary);
  font-size: 0.82rem;
  font-weight: 700;
}

.draft-settings__row input,
.draft-settings__row select,
.draft-settings__slot input {
  color: var(--text);
  font-size: 0.95rem;
}

.draft-settings__slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.draft-settings input[type="number"] {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 0.5rem 0.65rem;
  width: 100%;
}

.draft-clock {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  padding: 0.7rem 1.1rem;
  margin-bottom: 1rem;
  font-weight: 700;
  text-align: center;
}

.draft-clock strong {
  color: var(--accent);
}

.draft-clock--user {
  border-color: var(--accent);
  box-shadow: var(--shadow-glow);
}

.draft-layout {
  display: grid;
  grid-template-columns: minmax(min(260px, 100%), 1fr) minmax(340px, 1.5fr);
  gap: 1.25rem;
  align-items: start;
}

@media (max-width: 900px) {
  .draft-layout {
    grid-template-columns: 1fr;
  }
}

.draft-pick-controls {
  margin-top: 0.75rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.draft-roster-panel {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.draft-roster-panel__group {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.6rem 0.85rem;
}

.draft-roster-panel__slot-label {
  display: block;
  color: var(--muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  font-weight: 800;
  margin-bottom: 0.4rem;
}

.draft-roster-panel__row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.3rem 0;
  font-weight: 600;
}

.draft-board-scroll {
  overflow-x: auto;
  margin-bottom: 1.1rem;
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
}

.draft-board {
  border-collapse: collapse;
  width: 100%;
  background: var(--surface);
  font-size: 0.88rem;
}

.draft-board th,
.draft-board td {
  border: 1px solid var(--border);
  padding: 0.4rem 0.55rem;
  text-align: left;
  white-space: nowrap;
}

.draft-board th {
  background: var(--surface-2);
  color: var(--muted);
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  position: sticky;
  top: 0;
}

.draft-board__corner {
  position: sticky;
  left: 0;
  z-index: 2;
}

.draft-board__round {
  position: sticky;
  left: 0;
  background: var(--surface-2);
  color: var(--muted);
  font-weight: 800;
  z-index: 1;
}

.draft-board__cell {
  min-width: 112px;
  vertical-align: top;
}

.draft-board__cell--current {
  background: var(--accent-soft);
  box-shadow: inset 0 0 0 2px var(--accent);
}

.draft-board__player-name {
  display: block;
  font-weight: 700;
  font-size: 0.85rem;
  margin-bottom: 0.2rem;
}

.draft-board__on-clock {
  color: var(--accent);
  font-weight: 800;
  font-size: 0.78rem;
}

.draft-board__empty {
  color: var(--border-strong);
}

.available-players__tabs {
  display: flex;
  gap: 0.35rem;
  margin-bottom: 0.6rem;
  flex-wrap: wrap;
}

.available-players__tab {
  background: var(--surface);
  border: 1px solid var(--border);
  color: var(--muted);
  border-radius: var(--radius-sm);
  padding: 0.35rem 0.8rem;
  font-size: 0.82rem;
  font-weight: 800;
  box-shadow: none;
}

.available-players__tab:hover {
  color: var(--text);
  transform: none;
  box-shadow: none;
}

.available-players__tab--active {
  background: var(--accent-gradient);
  color: #051220;
  border-color: transparent;
}

.available-players input[type="text"] {
  width: 100%;
  margin: 0.75rem 0;
  box-sizing: border-box;
}

.available-players__scroll {
  max-height: 520px;
  overflow-y: auto;
  border-radius: var(--radius-lg);
}

.available-players__scroll thead th {
  position: sticky;
  top: 0;
  z-index: 1;
  background: var(--surface-2);
}

.available-players button {
  padding: 0.35rem 0.85rem;
  font-size: 0.8rem;
}

.draft-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(220px, 100%), 1fr));
  gap: 1rem;
}

.draft-summary-team h2 {
  font-size: 1.02rem;
  margin-bottom: 0.6rem;
}

/* ---------- Draft grades ---------- */

.draft-grades-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(240px, 100%), 1fr));
  gap: 0.9rem;
  margin-bottom: 2rem;
}

.draft-grade-card {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.9rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.draft-grade-card--you {
  border-color: var(--accent);
  box-shadow: var(--shadow-glow);
}

.draft-grade-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.2rem;
}

.draft-grade-card__team {
  font-weight: 800;
  font-size: 0.92rem;
}

.draft-grade-card__letter {
  font-size: 1.6rem;
  font-weight: 800;
  line-height: 1;
}

.draft-grade-card--A .draft-grade-card__letter {
  color: var(--success);
}

.draft-grade-card--B .draft-grade-card__letter {
  color: var(--accent);
}

.draft-grade-card--C .draft-grade-card__letter {
  color: var(--warning);
}

.draft-grade-card--D .draft-grade-card__letter {
  color: var(--bronze);
}

.draft-grade-card--F .draft-grade-card__letter {
  color: var(--danger);
}

.draft-grade-card__surplus {
  margin: 0;
  font-size: 0.78rem;
  color: var(--muted);
  font-variant-numeric: tabular-nums;
}

.draft-grade-card__line {
  margin: 0;
  font-size: 0.8rem;
  color: var(--text-secondary);
}

.draft-grade-card__line strong {
  color: var(--text);
}

.draft-grade-card__notes {
  margin: 0.2rem 0 0;
  padding-left: 1.1rem;
  font-size: 0.76rem;
  color: var(--muted);
}

/* ---------- Cheat sheets ---------- */

.cheat-sheet-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(min(260px, 100%), 1fr));
  gap: 0.9rem;
}

.cheat-sheet-card {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.9rem 1rem;
  transition: border-color 0.12s ease, background-color 0.12s ease;
}

.cheat-sheet-card:hover {
  border-color: var(--accent);
  background: var(--surface-3);
}

.cheat-sheet-card__body {
  flex: 1;
  min-width: 0;
  text-decoration: none;
  color: var(--text);
}

.cheat-sheet-card__body h3 {
  margin: 0 0 0.2rem;
  font-size: 1rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cheat-sheet-card__meta {
  margin: 0;
  font-size: 0.8rem;
  color: var(--muted);
}

.cheat-sheet-card__delete {
  background: none;
  border: 1px solid var(--border);
  box-shadow: none;
  padding: 0.35rem 0.7rem;
  font-size: 0.78rem;
  color: var(--muted);
  border-radius: var(--radius-sm);
}

.cheat-sheet-card__delete:hover {
  color: var(--danger);
  border-color: var(--danger);
  filter: none;
  transform: none;
  box-shadow: none;
}

.cheat-sheet-editor__name {
  width: 100%;
  max-width: 480px;
  font-size: 1.3rem;
  font-weight: 800;
  background: none;
  border: none;
  border-bottom: 1px solid var(--border);
  border-radius: 0;
  padding: 0.2rem 0;
  color: var(--text);
}

.cheat-sheet-editor__name:focus {
  outline: none;
  border-bottom-color: var(--accent);
  box-shadow: none;
}

.cheat-sheet-editor__teams-field {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.85rem;
}

.cheat-sheet-editor__teams-field input {
  width: 4.5rem;
}

.cheat-sheet-editor__notes {
  width: 100%;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  color: var(--text);
  padding: 0.7rem 0.9rem;
  font-family: inherit;
  font-size: 0.9rem;
  resize: vertical;
  margin-bottom: 1.5rem;
}

.cheat-sheet-list {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.cheat-sheet-row {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 0.5rem 0.75rem;
}

.cheat-sheet-row--drafted {
  opacity: 0.5;
}

.cheat-sheet-row--drafted .cheat-sheet-row__name {
  text-decoration: line-through;
}

.cheat-sheet-row__round {
  width: 3rem;
  flex-shrink: 0;
  text-align: center;
  padding: 0.4rem 0.3rem;
}

.cheat-sheet-row__name {
  font-weight: 700;
  font-size: 0.9rem;
  color: var(--text);
  text-decoration: none;
  white-space: nowrap;
  min-width: 6rem;
}

.cheat-sheet-row__name:hover {
  color: var(--accent);
}

.cheat-sheet-row__rank {
  color: var(--muted);
  font-size: 0.8rem;
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
  width: 2.5rem;
}

.cheat-sheet-row__note {
  flex: 1;
  min-width: 0;
  font-size: 0.85rem;
  padding: 0.4rem 0.6rem;
}

.cheat-sheet-row__drafted-toggle {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.78rem;
  color: var(--text-secondary);
  flex-shrink: 0;
  white-space: nowrap;
}
`;

// Theme-bridge stylesheet for the Fantasy tab — same rationale as
// ravenThemeCSS/secxThemeCSS: remaps War Room's own CSS variables to
// Vantage's active theme so the tab reads as a native Vantage page. --bg is
// always solid across every Vantage theme (verified against all 16), so
// it's safe to color-mix off directly; --accent-gradient's two hardcoded
// consumers (button text) get flattened to the theme's real contrast color
// via --accent-contrast, same fix as Raven's Eye's .btn--primary. Position
// colors (--pos-qb etc.), platform colors (--sleeper/--yahoo), and
// success/danger/warning stay fixed — functional signal colors, not brand.
function ffThemeCSS(theme) {
  return `
:host {
  --bg: ${theme.pageBg} !important;
  --surface: ${theme.cardBg} !important;
  --surface-2: color-mix(in srgb, ${theme.pageBg} 92%, ${theme.text} 8%) !important;
  --surface-3: color-mix(in srgb, ${theme.pageBg} 84%, ${theme.text} 16%) !important;
  --border: ${theme.divider} !important;
  --border-strong: ${theme.cardBorder} !important;
  --text: ${theme.text} !important;
  --text-secondary: ${theme.textMuted} !important;
  --muted: ${theme.textFaint} !important;
  --accent: ${theme.accent} !important;
  --accent-strong: color-mix(in srgb, ${theme.accent} 80%, black) !important;
  --accent-soft: ${theme.accentSoft} !important;
  --accent-gradient: ${theme.accent} !important;
  --accent-contrast: ${theme.accentText} !important;
  --radius-sm: calc(${theme.cardRadius} * 0.45) !important;
  --radius-md: calc(${theme.cardRadius} * 0.7) !important;
  --radius-lg: ${theme.cardRadius} !important;
  --shadow-sm: ${theme.cardShadow} !important;
  --shadow-md: ${theme.cardShadow} !important;
  --shadow-glow: 0 0 0 1px ${theme.accentSoft}, ${theme.cardShadow} !important;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  color-scheme: ${vantageIsDarkTheme(theme) ? "dark" : "light"};
}
/* These hardcode #051220 (dark navy) as their text color, assuming
   --accent-gradient is always a bright blue-to-teal — no longer true once
   it's remapped to an arbitrary theme accent above, so flatten to the
   theme's own contrast color instead. */
button, .button-link, .trade-vs, .import-rankings__step,
.ranking-set-filter-chip--active, .available-players__tab--active {
  color: var(--accent-contrast);
}
`;
}

// Renders children inside a real Shadow DOM subtree carrying FF_CSS — style
// isolation works in both directions, so ~2,400 lines of a completely
// different app's CSS (classes, bare h1/a/button selectors, the works) can
// be pasted in near-verbatim without any risk of colliding with Vantage's
// own styles, and without Vantage's styles leaking in either.
function FFShadowRoot({ theme, children }) {
  const hostRef = useRef(null);
  const [shadowRoot, setShadowRoot] = useState(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setShadowRoot(host.shadowRoot || host.attachShadow({ mode: "open" }));
  }, []);
  const skin = useMemo(() => ffThemeCSS(theme), [theme]);
  return (
    <div ref={hostRef} style={{ "--ff-accent": theme.accent, display: "block" }}>
      {shadowRoot &&
        ReactDOM.createPortal(
          <>
            <style>{FF_CSS}</style>
            <style>{skin}</style>
            {children}
          </>,
          shadowRoot
        )}
    </div>
  );
}

// Top-level sub-pages the original app exposed in its sidebar nav (player
// profile/comparison/league-detail are reached via links from these, same
// as the original — not top-level tabs there either).
/* ----------------------------------------------------------------------
   FANTASY TAB — client-side data layer
   Ported from FantasyFootballTool's server/src/services/{sleeperClient,
   tradeValueClient}.ts. Both source APIs send permissive CORS headers
   (verified via curl), so these run as plain browser fetch() calls instead
   of going through a backend — the Netlify Blobs TTL cache those files used
   server-side is replaced by the IndexedDB cache (dbGetFreshCache/dbSetCache,
   defined earlier) here instead.
---------------------------------------------------------------------- */

const FF_SLEEPER_BASE = "https://api.sleeper.app/v1";
const FF_FANTASY_POSITIONS = new Set(["QB", "RB", "WR", "TE", "K", "DEF"]);
const FF_PLAYERS_CACHE_ID = "sleeper-players-v2";
const FF_PLAYERS_CACHE_MAX_AGE_MS = 24 * 60 * 60 * 1000;
const FF_TRADEVALUE_CACHE_MAX_AGE_MS = 12 * 60 * 60 * 1000;

async function ffSleeperGet(pathname) {
  const res = await fetch(`${FF_SLEEPER_BASE}${pathname}`);
  if (!res.ok) throw new Error(`Sleeper API error ${res.status} for ${pathname}`);
  return res.json();
}

async function ffFindUserByUsername(username) {
  return ffSleeperGet(`/user/${encodeURIComponent(username)}`);
}

// Sleeper's idea of "the current season" only rolls over ~March/April, not
// on the calendar year, so ask it directly rather than using new Date().
async function ffGetCurrentSeason() {
  const state = await ffSleeperGet("/state/nfl");
  return state.season;
}

async function ffGetLeaguesForUser(userId, season) {
  const resolvedSeason = season || (await ffGetCurrentSeason());
  return ffSleeperGet(`/user/${userId}/leagues/nfl/${resolvedSeason}`);
}

// The full ~14MB Sleeper player directory (every player, active or not) —
// cached in IndexedDB rather than re-fetched on every visit. Callers that
// only want fantasy-relevant players should go through
// ffGetFantasyRelevantPlayers instead of calling this directly.
async function ffGetPlayersMap() {
  const cached = await dbGetFreshCache(FF_PLAYERS_CACHE_ID, FF_PLAYERS_CACHE_MAX_AGE_MS);
  if (cached) return cached;
  const players = await ffSleeperGet("/players/nfl");
  await dbSetCache(FF_PLAYERS_CACHE_ID, players);
  return players;
}

function ffPlayerDisplayName(playerId, meta) {
  return (meta && meta.full_name) || `${(meta && meta.first_name) || ""} ${(meta && meta.last_name) || ""}`.trim() || playerId;
}

function ffToPlayer(playerId, meta) {
  return {
    playerId,
    name: ffPlayerDisplayName(playerId, meta),
    position: (meta && meta.position) || "UNK",
    team: (meta && meta.team) || null,
    injuryStatus: (meta && meta.injury_status) || null,
  };
}

function ffToNumber(value) {
  if (value === null || value === undefined) return null;
  const num = typeof value === "number" ? value : Number(value);
  return Number.isFinite(num) ? num : null;
}

function ffToPlayerProfile(playerId, meta) {
  return {
    playerId,
    name: ffPlayerDisplayName(playerId, meta),
    position: meta.position || "UNK",
    team: meta.team || "FA",
    age: ffToNumber(meta.age),
    heightInches: ffToNumber(meta.height),
    weightLbs: ffToNumber(meta.weight),
    college: meta.college || null,
    yearsExp: ffToNumber(meta.years_exp),
    jerseyNumber: ffToNumber(meta.number),
    status: meta.status || null,
    injuryStatus: meta.injury_status || null,
    depthChartPosition: meta.depth_chart_position || null,
    depthChartOrder: ffToNumber(meta.depth_chart_order),
  };
}

// Same "is this a real, current NFL roster player" check the original app
// used everywhere it surfaced a player list, so Players/Waiver Wire stay
// consistent instead of one filtering inactive players and the other not.
function ffIsFantasyRelevant(meta) {
  const isActive = meta.position === "DEF" ? meta.active === true : meta.status === "Active";
  if (!isActive) return false;
  if (!meta.team) return false;
  if (!meta.position || !FF_FANTASY_POSITIONS.has(meta.position)) return false;
  return true;
}

async function ffGetFantasyRelevantPlayers() {
  const playersMap = await ffGetPlayersMap();
  const profiles = [];
  for (const [playerId, meta] of Object.entries(playersMap)) {
    if (!ffIsFantasyRelevant(meta)) continue;
    profiles.push(ffToPlayerProfile(playerId, meta));
  }
  return profiles;
}

async function ffGetTrendingPlayers(type, limit = 25) {
  // Sleeper's trending endpoint includes inactive/free-agent players, so
  // over-fetch and filter+trim to `limit` after.
  const [trending, playersMap] = await Promise.all([
    ffSleeperGet(`/players/nfl/trending/${type}?lookback_hours=24&limit=${limit * 4}`),
    ffGetPlayersMap(),
  ]);
  const results = [];
  for (const entry of trending) {
    const meta = playersMap[entry.player_id];
    if (!meta || !ffIsFantasyRelevant(meta)) continue;
    results.push({ ...ffToPlayerProfile(entry.player_id, meta), trendCount: entry.count });
    if (results.length >= limit) break;
  }
  return results;
}

// Sleeper's scoring_settings is a flat map of stat -> point value; "rec"
// (points per reception) is what actually distinguishes PPR leagues.
function ffScoringTypeFor(scoringSettings) {
  const rec = (scoringSettings && scoringSettings.rec) || 0;
  if (rec >= 1) return "Full PPR";
  if (rec >= 0.5) return "Half PPR";
  return "Standard";
}

async function ffGetLeagueDetail(leagueId, userId) {
  const [leagueMeta, rosters, users, playersMap] = await Promise.all([
    ffSleeperGet(`/league/${leagueId}`),
    ffSleeperGet(`/league/${leagueId}/rosters`),
    ffSleeperGet(`/league/${leagueId}/users`),
    ffGetPlayersMap(),
  ]);

  const userNameByOwnerId = new Map(users.map((u) => [u.user_id, u.display_name]));
  const myRoster = rosters.find((r) => r.owner_id === userId);
  if (!myRoster) throw new Error(`No roster found for user ${userId} in league ${leagueId}`);

  const standings = [...rosters]
    .sort((a, b) => (b.settings.wins || 0) - (a.settings.wins || 0) || (b.settings.fpts || 0) - (a.settings.fpts || 0))
    .map((r, index) => ({
      teamId: String(r.roster_id),
      teamName: userNameByOwnerId.get(r.owner_id) || `Team ${r.roster_id}`,
      record: { wins: r.settings.wins || 0, losses: r.settings.losses || 0, ties: r.settings.ties || 0 },
      pointsFor: r.settings.fpts || 0,
      pointsAgainst: r.settings.fpts_against || 0,
      rank: index + 1,
    }));

  const teams = rosters.map((r) => ({
    teamId: String(r.roster_id),
    teamName: userNameByOwnerId.get(r.owner_id) || `Team ${r.roster_id}`,
    roster: (r.players || []).map((playerId) => ffToPlayer(playerId, playersMap[playerId])),
  }));

  let currentMatchup = null;
  try {
    const state = await ffSleeperGet("/state/nfl");
    const matchups = await ffSleeperGet(`/league/${leagueId}/matchups/${state.week}`);
    const mine = matchups.find((m) => m.roster_id === myRoster.roster_id);
    const opponent = mine ? matchups.find((m) => m.matchup_id === mine.matchup_id && m.roster_id !== myRoster.roster_id) : undefined;
    if (mine && opponent) {
      const opponentRoster = rosters.find((r) => r.roster_id === opponent.roster_id);
      currentMatchup = {
        week: state.week,
        myScore: mine.points,
        opponentScore: opponent.points,
        opponentTeamName: opponentRoster ? userNameByOwnerId.get(opponentRoster.owner_id) || `Team ${opponent.roster_id}` : "Unknown",
      };
    }
  } catch (e) {
    currentMatchup = null;
  }

  return {
    platform: "sleeper",
    leagueId,
    name: leagueMeta.name,
    season: leagueMeta.season,
    myTeam: {
      teamId: String(myRoster.roster_id),
      teamName: userNameByOwnerId.get(userId) || "My Team",
      record: { wins: myRoster.settings.wins || 0, losses: myRoster.settings.losses || 0, ties: myRoster.settings.ties || 0 },
      roster: (myRoster.players || []).map((playerId) => ffToPlayer(playerId, playersMap[playerId])),
    },
    teams,
    standings,
    currentMatchup,
    settings: {
      scoringType: ffScoringTypeFor(leagueMeta.scoring_settings),
      rosterPositions: leagueMeta.roster_positions || [],
      playoffTeams: (leagueMeta.settings && leagueMeta.settings.playoff_teams) || null,
      totalRosters: leagueMeta.total_rosters || rosters.length,
    },
  };
}

async function ffGetRosterTeamNames(leagueId) {
  const [rosters, users] = await Promise.all([ffSleeperGet(`/league/${leagueId}/rosters`), ffSleeperGet(`/league/${leagueId}/users`)]);
  const userNameByOwnerId = new Map(users.map((u) => [u.user_id, u.display_name]));
  return new Map(rosters.map((r) => [r.roster_id, userNameByOwnerId.get(r.owner_id) || `Team ${r.roster_id}`]));
}

// Sleeper's transactions endpoint is keyed by week, not a flat feed — pull
// the current week plus the two before it and merge, rather than fetching
// all 18 weeks for a list that only shows the last 15 anyway.
async function ffGetLeagueTransactions(leagueId, limit = 15) {
  const state = await ffSleeperGet("/state/nfl");
  const currentWeek = Math.max(1, state.week || 1);
  const weeks = [currentWeek, currentWeek - 1, currentWeek - 2].filter((w) => w >= 1);

  const [weeklyResults, playersMap, rosterNames] = await Promise.all([
    Promise.all(weeks.map((week) => ffSleeperGet(`/league/${leagueId}/transactions/${week}`).catch(() => []))),
    ffGetPlayersMap(),
    ffGetRosterTeamNames(leagueId),
  ]);

  const all = weeklyResults.flat().filter((t) => t.status === "complete");
  all.sort((a, b) => b.created - a.created);

  function toRefs(entries) {
    if (!entries) return [];
    return Object.entries(entries).map(([playerId, rosterId]) => ({
      playerId,
      playerName: ffPlayerDisplayName(playerId, playersMap[playerId]),
      teamName: rosterNames.get(rosterId) || `Team ${rosterId}`,
    }));
  }

  return all.slice(0, limit).map((t) => ({
    id: t.transaction_id,
    type: t.type,
    createdAt: t.created,
    adds: toRefs(t.adds),
    drops: toRefs(t.drops),
  }));
}

function ffDraftStatusFrom(status) {
  if (status === "complete") return "complete";
  if (status === "drafting" || status === "paused") return "in_progress";
  return "not_started";
}

async function ffGetLeagueDraft(leagueId) {
  const drafts = await ffSleeperGet(`/league/${leagueId}/drafts`);
  const draft = drafts[0];
  if (!draft) return { status: "not_started", numTeams: 0, rounds: 0, picks: [] };

  const [picks, playersMap, rosterNames] = await Promise.all([
    ffSleeperGet(`/draft/${draft.draft_id}/picks`),
    ffGetPlayersMap(),
    ffGetRosterTeamNames(leagueId),
  ]);

  const draftPicks = picks.map((p) => {
    const meta = playersMap[p.player_id];
    return {
      round: p.round,
      pickNo: p.pick_no,
      teamIndex: p.draft_slot - 1,
      teamName: rosterNames.get(p.roster_id) || `Team ${p.roster_id}`,
      playerId: p.player_id,
      playerName: ffPlayerDisplayName(p.player_id, meta),
      playerPosition: (meta && meta.position) || "UNK",
    };
  });

  return {
    status: ffDraftStatusFrom(draft.status),
    numTeams: (draft.settings && draft.settings.teams) || rosterNames.size,
    rounds: (draft.settings && draft.settings.rounds) || Math.max(0, ...draftPicks.map((p) => p.round)),
    picks: draftPicks,
  };
}

// ---------- FantasyCalc trade values ----------

async function ffFetchFantasyCalcValues(isDynasty, ppr) {
  const params = new URLSearchParams({ isDynasty: String(isDynasty), numQbs: "1", numTeams: "12", ppr: String(ppr) });
  const res = await fetch(`https://api.fantasycalc.com/values/current?${params.toString()}`);
  if (!res.ok) throw new Error(`FantasyCalc API error ${res.status}`);
  return res.json();
}

async function ffGetTradeValues(isDynasty, ppr = 1) {
  const cacheId = `fantasycalc-${isDynasty ? "dynasty" : "redraft"}-ppr${ppr}-v2`;
  const cached = await dbGetCache(cacheId);
  if (cached && Date.now() - cached.fetchedAt < FF_TRADEVALUE_CACHE_MAX_AGE_MS) {
    return cached.data;
  }
  try {
    const entries = await ffFetchFantasyCalcValues(isDynasty, ppr);
    const values = {};
    for (const entry of entries) {
      if (!entry.player || !entry.player.sleeperId) continue;
      values[entry.player.sleeperId] = {
        sleeperId: entry.player.sleeperId,
        value: entry.value,
        overallRank: entry.overallRank,
        positionRank: entry.positionRank,
        trend30Day: entry.trend30Day,
      };
    }
    await dbSetCache(cacheId, values);
    return values;
  } catch (err) {
    // FantasyCalc can have transient outages — serving stale-but-present
    // data beats throwing, same reasoning as the server-side original.
    if (cached) return cached.data;
    throw err;
  }
}

// ---------- Yahoo (via backend — see netlify/functions/yahoo-*.js) ----------

async function ffGetYahooStatus() {
  const res = await fetch(`${FF_BACKEND_URL}/.netlify/functions/yahoo-status`);
  if (!res.ok) throw new Error(`yahoo-status error ${res.status}`);
  return res.json();
}
async function ffGetYahooPreview() {
  const res = await fetch(`${FF_BACKEND_URL}/.netlify/functions/yahoo-preview`);
  if (!res.ok) throw new Error(`yahoo-preview error ${res.status}`);
  return res.json();
}
async function ffGetYahooLeagueDetail(leagueKey) {
  const res = await fetch(`${FF_BACKEND_URL}/.netlify/functions/yahoo-league?leagueKey=${encodeURIComponent(leagueKey)}`);
  if (!res.ok) throw new Error(`yahoo-league error ${res.status}`);
  return res.json();
}
const FF_YAHOO_CONNECT_URL = `https://bearvantagehub.netlify.app/.netlify/functions/yahoo-auth-start`;

// Dispatches to the right platform's league-detail fetcher — the one place
// callers (LeagueDetail, Trade Analyzer's future league mode) need to know
// about, instead of branching on platform everywhere.
async function ffGetLeagueDetailByPlatform(platform, leagueId, sleeperUserId) {
  if (platform === "yahoo") return ffGetYahooLeagueDetail(leagueId);
  return ffGetLeagueDetail(leagueId, sleeperUserId);
}

// Backend origin for the two Netlify Functions that must stay server-side
// (nflverse stats proxy, and Yahoo OAuth once that lands) — hardcoded since
// Vantage only has one Netlify deploy; GitHub Pages visitors still reach it
// fine since fetch() is cross-origin here (same pattern the TikTok
// integration already uses via integrations.tiktokBackendUrl, just fixed
// instead of user-configurable since there's only ever one target).
const FF_BACKEND_URL = "https://bearvantagehub.netlify.app";

async function ffGetSeasonStats() {
  const res = await fetch(`${FF_BACKEND_URL}/.netlify/functions/player-stats`);
  if (!res.ok) throw new Error(`player-stats error ${res.status}`);
  return res.json();
}

async function ffGetWeeklyStats(playerId) {
  const res = await fetch(`${FF_BACKEND_URL}/.netlify/functions/player-stats-weekly?playerId=${encodeURIComponent(playerId)}`);
  if (!res.ok) throw new Error(`player-stats-weekly error ${res.status}`);
  return res.json();
}

/* ----------------------------------------------------------------------
   FANTASY TAB — small shared helpers/components
   Ported from FantasyFootballTool's lib/*.ts and components/*.tsx. react-
   query's useQuery is replaced by ffUseQuery, a small hook backed by a
   module-level cache map — same "fetch once, share across pages" behavior
   for the session, without pulling in the library. react-router's <Link>
   is replaced by plain <a href="#fantasy/..."> since the hash IS the real
   URL here, which gets standard link behavior (cmd/ctrl-click, etc.) free.
---------------------------------------------------------------------- */

const ffQueryCache = new Map();

function ffUseQuery(key, queryFn, deps) {
  const depsKey = JSON.stringify(deps === undefined ? [key] : deps);
  const [state, setState] = useState(() => {
    const cached = ffQueryCache.get(key);
    return cached ? { data: cached, isLoading: false, isError: false, error: null } : { data: undefined, isLoading: true, isError: false, error: null };
  });
  useEffect(() => {
    let cancelled = false;
    const cached = ffQueryCache.get(key);
    if (cached) {
      setState({ data: cached, isLoading: false, isError: false, error: null });
      return;
    }
    setState({ data: undefined, isLoading: true, isError: false, error: null });
    queryFn()
      .then((data) => {
        ffQueryCache.set(key, data);
        if (!cancelled) setState({ data, isLoading: false, isError: false, error: null });
      })
      .catch((err) => {
        if (!cancelled) setState({ data: undefined, isLoading: false, isError: true, error: err });
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, depsKey]);
  return state;
}

function ffMedalClass(rank) {
  if (rank === 1) return "rank-medal rank-medal--gold";
  if (rank === 2) return "rank-medal rank-medal--silver";
  if (rank === 3) return "rank-medal rank-medal--bronze";
  return "";
}

function ffFormatHeight(inches) {
  if (inches === null || inches === undefined) return "—";
  const feet = Math.floor(inches / 12);
  const remainder = inches % 12;
  return `${feet}'${remainder}"`;
}

// Primary accent color per NFL team, tuned to stay legible on the dark background.
const FF_TEAM_COLORS = {
  ARI: "#97233F", ATL: "#A71930", BAL: "#2A1A80", BUF: "#00338D", CAR: "#0085CA",
  CHI: "#C83803", CIN: "#FB4F14", CLE: "#FF3C00", DAL: "#869397", DEN: "#FB4F14",
  DET: "#0076B6", GB: "#FFB612", HOU: "#A71930", IND: "#1B3F8B", JAX: "#00778B",
  KC: "#E31837", LAC: "#0080C6", LAR: "#FFA300", LV: "#A5ACAF", MIA: "#008E97",
  MIN: "#4F2683", NE: "#C60C30", NO: "#D8A63D", NYG: "#1B3F8B", NYJ: "#1EB980",
  PHI: "#00843D", PIT: "#FFB612", SEA: "#69BE28", SF: "#AA0000", TB: "#D50A0A",
  TEN: "#4B92DB", WAS: "#8B2942",
};
function ffTeamColor(team) {
  if (!team) return "var(--muted)";
  return FF_TEAM_COLORS[team] || "var(--muted)";
}

// 2026 NFL bye weeks by team abbreviation — update once the new season's
// schedule is released each year.
const FF_BYE_WEEKS_2026 = {
  CAR: 5, KC: 5, CIN: 6, DET: 6, MIA: 6, MIN: 6, BUF: 7, JAX: 7, LAC: 7, WAS: 7,
  HOU: 8, NO: 8, NYG: 8, SF: 8, PIT: 9, TEN: 9, CHI: 10, DEN: 10, PHI: 10, TB: 10,
  ATL: 11, CLE: 11, GB: 11, LAR: 11, NE: 11, SEA: 11, BAL: 13, IND: 13, LV: 13,
  NYJ: 13, ARI: 14, DAL: 14,
};
function ffByeWeekFor(team) {
  if (!team) return null;
  return FF_BYE_WEEKS_2026[team] ?? null;
}

const FF_FORMAT_PARAMS = {
  standard: { dynasty: false, ppr: 0 },
  half: { dynasty: false, ppr: 0.5 },
  full: { dynasty: false, ppr: 1 },
  dynasty: { dynasty: true, ppr: 1 },
};
const FF_FORMATS = [
  { key: "standard", label: "Standard" },
  { key: "half", label: "Half PPR" },
  { key: "full", label: "Full PPR" },
  { key: "dynasty", label: "Dynasty" },
];

function ffInitials(name) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function FFPlayerAvatar({ playerId, name, position, team, size = "md", ringColor }) {
  const [errored, setErrored] = useState(false);
  const ringStyle = ringColor ? { borderColor: ringColor, boxShadow: `0 0 24px ${ringColor}66` } : undefined;

  if (position === "PICK") {
    return (
      <div className={`player-avatar player-avatar--${size} player-avatar--fallback`} style={ringStyle}>
        PK
      </div>
    );
  }

  const src =
    position === "DEF" && team
      ? `https://sleepercdn.com/images/team_logos/nfl/${team.toLowerCase()}.png`
      : `https://sleepercdn.com/content/nfl/players/thumb/${playerId}.jpg`;

  if (errored) {
    return (
      <div className={`player-avatar player-avatar--${size} player-avatar--fallback`} style={ringStyle}>
        {ffInitials(name)}
      </div>
    );
  }

  return (
    <img
      className={`player-avatar player-avatar--${size} ${position === "DEF" ? "player-avatar--logo" : ""}`}
      style={ringStyle}
      src={src}
      alt={name}
      loading="lazy"
      onError={() => setErrored(true)}
    />
  );
}

const FF_KNOWN_POSITIONS = new Set(["QB", "RB", "WR", "TE", "K", "DEF", "PICK"]);
function FFPositionBadge({ position }) {
  const variant = FF_KNOWN_POSITIONS.has(position) ? position : "UNK";
  return <span className={`position-badge position-badge--${variant}`}>{position}</span>;
}

function FFPlatformBadge({ platform }) {
  return <span className={`platform-badge platform-badge--${platform}`}>{platform}</span>;
}

function FFTeamTag({ team }) {
  if (!team) return <span>—</span>;
  const color = ffTeamColor(team);
  return (
    <span className="team-tag">
      <span className="team-tag__dot" style={{ background: color, boxShadow: `0 0 6px ${color}` }} />
      {team}
    </span>
  );
}

function FFWatchlistButton({ playerId, watchlist, setWatchlist }) {
  const isWatched = watchlist.includes(playerId);
  function toggle(e) {
    e.preventDefault();
    e.stopPropagation();
    setWatchlist(isWatched ? watchlist.filter((id) => id !== playerId) : [...watchlist, playerId]);
  }
  return (
    <button
      type="button"
      className={`watchlist-button ${isWatched ? "watchlist-button--active" : ""}`}
      onClick={toggle}
      aria-label={isWatched ? "Remove from watchlist" : "Add to watchlist"}
      title={isWatched ? "Remove from watchlist" : "Add to watchlist"}
    >
      {isWatched ? "★" : "☆"}
    </button>
  );
}

function FFLeagueCard({ league }) {
  return (
    <a href={`#fantasy/leagues/${league.platform}/${league.leagueId}`} className="league-card">
      <FFPlatformBadge platform={league.platform} />
      <div className="league-card__body">
        <h3>{league.name}</h3>
        <p className="league-card__team">{league.teamName}</p>
      </div>
      <p className="league-card__record">
        {league.record.wins}-{league.record.losses}
        {league.record.ties > 0 ? `-${league.record.ties}` : ""}
        <span className="league-card__season">{league.season}</span>
      </p>
    </a>
  );
}

function FFPlayerDetailCard({ player, entry, label }) {
  const bye = ffByeWeekFor(player.team);
  const isPick = player.position === "PICK";
  return (
    <div className="player-detail-card">
      {label && <span className="player-detail-card__label">{label}</span>}
      <div className="player-detail-card__header">
        <FFPlayerAvatar playerId={player.playerId} name={player.name} position={player.position} team={player.team} size="md" ringColor={ffTeamColor(player.team)} />
        <div>
          {isPick ? (
            <span className="player-detail-card__name">{player.name}</span>
          ) : (
            <a href={`#fantasy/players/${player.playerId}`} className="player-detail-card__name">
              {player.name}
            </a>
          )}
          <div className="player-detail-card__meta">
            <FFPositionBadge position={player.position} />
            {!isPick && <FFTeamTag team={player.team} />}
            {player.injuryStatus && <span className="injury-badge">{player.injuryStatus}</span>}
          </div>
        </div>
      </div>

      {isPick ? (
        <div className="player-detail-card__grid">
          <div>
            <span className="player-detail-card__stat-label">Estimated Value</span>
            <span>{entry ? entry.value.toLocaleString() : "—"}</span>
          </div>
        </div>
      ) : (
        <div className="player-detail-card__grid">
          <div>
            <span className="player-detail-card__stat-label">Rank</span>
            <span className={ffMedalClass(entry && entry.overallRank)}>{entry ? `#${entry.overallRank}` : "Unranked"}</span>
          </div>
          <div>
            <span className="player-detail-card__stat-label">Value</span>
            <span>{entry ? entry.value.toLocaleString() : "—"}</span>
          </div>
          <div>
            <span className="player-detail-card__stat-label">Pos Rank</span>
            <span>{entry ? `${player.position}${entry.positionRank}` : "—"}</span>
          </div>
          <div>
            <span className="player-detail-card__stat-label">30-Day Trend</span>
            <span>
              {entry ? (entry.trend30Day === 0 ? "Flat" : `${entry.trend30Day > 0 ? "▲" : "▼"} ${Math.abs(entry.trend30Day).toLocaleString()}`) : "—"}
            </span>
          </div>
          <div>
            <span className="player-detail-card__stat-label">Bye Week</span>
            <span>{bye ?? "—"}</span>
          </div>
          <div>
            <span className="player-detail-card__stat-label">Depth Chart</span>
            <span>{player.depthChartPosition ? `${player.depthChartPosition}${player.depthChartOrder ?? ""}` : "—"}</span>
          </div>
          <div>
            <span className="player-detail-card__stat-label">Age</span>
            <span>{player.age ?? "—"}</span>
          </div>
          <div>
            <span className="player-detail-card__stat-label">Ht/Wt</span>
            <span>
              {ffFormatHeight(player.heightInches)}
              {player.weightLbs !== null && player.weightLbs !== undefined ? ` / ${player.weightLbs} lb` : ""}
            </span>
          </div>
          <div>
            <span className="player-detail-card__stat-label">College</span>
            <span>{player.college ?? "—"}</span>
          </div>
          <div>
            <span className="player-detail-card__stat-label">Experience</span>
            <span>{player.yearsExp !== null && player.yearsExp !== undefined ? `${player.yearsExp} yrs` : "—"}</span>
          </div>
        </div>
      )}
    </div>
  );
}

function FFPlayersTable({ players, values, watchlist, setWatchlist }) {
  if (players.length === 0) {
    return <p className="empty-state">No players match these filters.</p>;
  }
  return (
    <div className="data-table-scroll data-table-scroll--frozen-first">
      <table className="data-table">
        <thead>
          <tr>
            <th>Player</th>
            <th>Rank</th>
            <th>Value</th>
            <th>Pos</th>
            <th>Team</th>
            <th>Age</th>
            <th>Ht/Wt</th>
            <th>College</th>
            <th>Exp</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {players.map((player) => {
            const entry = values[player.playerId];
            return (
              <tr key={player.playerId}>
                <td>
                  <div className="table-player-cell">
                    <FFWatchlistButton playerId={player.playerId} watchlist={watchlist} setWatchlist={setWatchlist} />
                    <a href={`#fantasy/players/${player.playerId}`} className="table-player-link">
                      <FFPlayerAvatar playerId={player.playerId} name={player.name} position={player.position} team={player.team} size="sm" />
                      <span>
                        {player.name}
                        {player.jerseyNumber !== null && <span className="players-table__number"> No. {player.jerseyNumber}</span>}
                      </span>
                    </a>
                  </div>
                </td>
                <td>{entry ? <span className={ffMedalClass(entry.overallRank)}>#{entry.overallRank}</span> : "—"}</td>
                <td>{entry ? entry.value.toLocaleString() : "Unranked"}</td>
                <td><FFPositionBadge position={player.position} /></td>
                <td><FFTeamTag team={player.team} /></td>
                <td>{player.age ?? "—"}</td>
                <td>
                  {ffFormatHeight(player.heightInches)}
                  {player.weightLbs !== null ? ` / ${player.weightLbs} lb` : ""}
                </td>
                <td>{player.college ?? "—"}</td>
                <td>{player.yearsExp ?? "—"}</td>
                <td>{player.injuryStatus ? <span className="injury-badge">{player.injuryStatus}</span> : "Healthy"}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function FFTrendingTable({ players, type, watchlist, setWatchlist }) {
  if (players.length === 0) {
    return <p className="empty-state">No trending data available.</p>;
  }
  const countLabel = type === "add" ? "Leagues Adding (24h)" : "Leagues Dropping (24h)";
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Player</th>
          <th>Pos</th>
          <th>Team</th>
          <th title="Number of Sleeper leagues where this player was added/dropped in the last 24 hours">{countLabel}</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {players.map((player, index) => (
          <tr key={player.playerId}>
            <td>{index + 1}</td>
            <td>
              <div className="table-player-cell">
                <FFWatchlistButton playerId={player.playerId} watchlist={watchlist} setWatchlist={setWatchlist} />
                <a href={`#fantasy/players/${player.playerId}`} className="table-player-link">
                  <FFPlayerAvatar playerId={player.playerId} name={player.name} position={player.position} team={player.team} size="sm" />
                  <span>{player.name}</span>
                </a>
              </div>
            </td>
            <td><FFPositionBadge position={player.position} /></td>
            <td><FFTeamTag team={player.team} /></td>
            <td className="trending-count">{player.trendCount.toLocaleString()}</td>
            <td>{player.injuryStatus ? <span className="injury-badge">{player.injuryStatus}</span> : "Healthy"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FFComparisonTable({ players, values, onRemove }) {
  if (players.length === 0) {
    return <p className="empty-state">Add at least two players to compare them.</p>;
  }
  const maxValue = Math.max(...players.map((p) => (values[p.playerId] ? values[p.playerId].value : -Infinity)));
  const byeCounts = new Map();
  for (const p of players) {
    const bye = ffByeWeekFor(p.team);
    if (bye !== null) byeCounts.set(bye, (byeCounts.get(bye) || 0) + 1);
  }

  const rows = [
    ["Rank", (p) => (values[p.playerId] ? <span className={ffMedalClass(values[p.playerId].overallRank)}>#{values[p.playerId].overallRank}</span> : "—")],
    [
      "Value",
      (p) => {
        const entry = values[p.playerId];
        if (!entry) return "Unranked";
        const isWinner = players.length > 1 && entry.value === maxValue;
        return <span className={isWinner ? "comparison-table__winner" : undefined}>{entry.value.toLocaleString()}</span>;
      },
    ],
    ["Position Rank", (p) => (values[p.playerId] ? `${p.position}${values[p.playerId].positionRank}` : "—")],
    [
      "30-Day Trend",
      (p) => {
        const entry = values[p.playerId];
        if (!entry) return "—";
        if (entry.trend30Day === 0) return <span className="empty-state">Flat</span>;
        const up = entry.trend30Day > 0;
        return (
          <span className={up ? "comparison-table__winner" : "error-text"}>
            {up ? "▲" : "▼"} {Math.abs(entry.trend30Day).toLocaleString()}
          </span>
        );
      },
    ],
    ["Position", (p) => <FFPositionBadge position={p.position} />],
    ["Team", (p) => <FFTeamTag team={p.team} />],
    [
      "Bye Week",
      (p) => {
        const bye = ffByeWeekFor(p.team);
        if (bye === null) return "—";
        const stacked = (byeCounts.get(bye) || 0) > 1;
        return (
          <span className={stacked ? "error-text" : undefined}>
            {bye}
            {stacked ? " (stacked)" : ""}
          </span>
        );
      },
    ],
    ["Depth Chart", (p) => (p.depthChartPosition ? `${p.depthChartPosition}${p.depthChartOrder ?? ""}` : "—")],
    ["Age", (p) => p.age ?? "—"],
    ["Height/Weight", (p) => `${ffFormatHeight(p.heightInches)}${p.weightLbs !== null ? ` / ${p.weightLbs} lb` : ""}`],
    ["College", (p) => p.college ?? "—"],
    ["Experience", (p) => (p.yearsExp !== null ? `${p.yearsExp} yrs` : "—")],
    ["Status", (p) => (p.injuryStatus ? <span className="injury-badge">{p.injuryStatus}</span> : "Healthy")],
  ];

  return (
    <div className="comparison-scroll">
      <table className="data-table comparison-table">
        <thead>
          <tr>
            <th>Attribute</th>
            {players.map((p) => (
              <th key={p.playerId}>
                <div className="comparison-table__player">
                  <FFPlayerAvatar playerId={p.playerId} name={p.name} position={p.position} team={p.team} size="sm" />
                  <a href={`#fantasy/players/${p.playerId}`}>{p.name}</a>
                  <button type="button" className="trade-side__remove" onClick={() => onRemove(p.playerId)}>
                    &times;
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(([label, render]) => (
            <tr key={label}>
              <td className="comparison-table__label">{label}</td>
              {players.map((p) => (
                <td key={p.playerId}>{render(p)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function FFModal({ title, onClose, children }) {
  useEffect(() => {
    function onKeyDown(e) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-panel__header">
          <h2>{title}</h2>
          <button type="button" className="modal-panel__close" onClick={onClose} aria-label="Close">
            &times;
          </button>
        </div>
        <div className="modal-panel__body">{children}</div>
      </div>
    </div>
  );
}

function FFComparisonModal({ players, values, onClose }) {
  return (
    <FFModal title="Full Comparison" onClose={onClose}>
      <div className="comparison-modal__stack">
        {players.map((player) => (
          <FFPlayerDetailCard key={player.playerId} player={player} entry={values[player.playerId]} />
        ))}
      </div>
    </FFModal>
  );
}

function FFPlayerSearchAdd({ candidates, excludeIds, onAdd, placeholder }) {
  const [search, setSearch] = useState("");
  const query = search.trim().toLowerCase();
  const matches = query === "" ? [] : candidates.filter((p) => !excludeIds.has(p.playerId) && p.name.toLowerCase().includes(query)).slice(0, 8);
  return (
    <>
      <input type="text" placeholder={placeholder || "Search to add a player..."} value={search} onChange={(e) => setSearch(e.target.value)} />
      {matches.length > 0 && (
        <ul className="trade-side__matches">
          {matches.map((player) => (
            <li key={player.playerId}>
              <button
                type="button"
                onClick={() => {
                  onAdd(player);
                  setSearch("");
                }}
              >
                {player.name} ({player.position}
                {player.team ? ` - ${player.team}` : ""})
              </button>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

const FF_SUBPAGES = [
  { id: "", label: "Dashboard" },
  { id: "players", label: "Players" },
  { id: "compare", label: "Compare" },
  { id: "trade-analyzer", label: "Trade Analyzer" },
  { id: "waiver-wire", label: "Waiver Wire" },
  { id: "mock-draft", label: "Mock Draft" },
  { id: "import-rankings", label: "Import Rankings" },
  { id: "cheat-sheets", label: "Cheat Sheets" },
  { id: "onboarding", label: "Connect Leagues" },
];

// Outer sub-nav — plain Vantage theme-driven JSX (outside the shadow root),
// matching every other page's header conventions rather than War Room's own.
function FFSubNav({ theme, active, onNavigate }) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
      {FF_SUBPAGES.map((p) => {
        const isActive = p.id === active;
        return (
          <button
            key={p.id || "dashboard"}
            onClick={() => onNavigate(p.id)}
            className="v-btn"
            style={{
              padding: "7px 13px",
              borderRadius: "999px",
              fontSize: "12.5px",
              fontWeight: 700,
              border: `1px solid ${isActive ? "transparent" : theme.divider}`,
              background: isActive ? theme.accent : "transparent",
              color: isActive ? theme.accentText : theme.textMuted,
            }}
          >
            {p.label}
          </button>
        );
      })}
    </div>
  );
}

// Placeholder for sub-pages not yet ported — replaced page by page in
// upcoming batches (Dashboard/Players/etc. are real data-backed pages next).
function FFComingSoon({ title, note }) {
  return (
    <div className="dashboard-widget" style={{ textAlign: "center", padding: "2.5rem 1.5rem" }}>
      <h2>{title}</h2>
      <p>{note || "This page is being ported over from The War Room next."}</p>
    </div>
  );
}

// Merges Sleeper (client-fetched) + Yahoo (fetched via the backend, since
// only it holds the access token) into one "leagues" list for the Dashboard.
async function ffGetLinkedLeagueSummaries(sleeper, yahoo) {
  const sleeperIds = (sleeper && sleeper.linkedLeagueIds) || [];
  const yahooKeys = (yahoo && yahoo.linkedLeagueKeys) || [];
  const leagues = [];
  const errors = [];

  const sleeperResults = await Promise.allSettled(sleeperIds.map((id) => ffGetLeagueDetail(id, sleeper.userId)));
  sleeperResults.forEach((r, i) => {
    if (r.status === "fulfilled") {
      const d = r.value;
      leagues.push({ platform: "sleeper", leagueId: sleeperIds[i], name: d.name, season: d.season, teamName: d.myTeam.teamName, record: d.myTeam.record });
    } else {
      errors.push(`Couldn't load a Sleeper league: ${r.reason && r.reason.message}`);
    }
  });

  const yahooResults = await Promise.allSettled(yahooKeys.map((key) => ffGetYahooLeagueDetail(key)));
  yahooResults.forEach((r, i) => {
    if (r.status === "fulfilled") {
      const d = r.value;
      leagues.push({ platform: "yahoo", leagueId: yahooKeys[i], name: d.name, season: d.season, teamName: d.myTeam.teamName, record: d.myTeam.record });
    } else {
      errors.push(`Couldn't load a Yahoo league: ${r.reason && r.reason.message}`);
    }
  });

  return { leagues, errors };
}

function FFDashboard({ watchlist, setWatchlist, sleeper, yahoo }) {
  const playersQuery = ffUseQuery("ff-players", ffGetFantasyRelevantPlayers);
  const tradeValuesQuery = ffUseQuery("ff-trade-values-false-1", () => ffGetTradeValues(false, 1));
  const linkedIds = (sleeper && sleeper.linkedLeagueIds) || [];
  const linkedYahooKeys = (yahoo && yahoo.linkedLeagueKeys) || [];
  const leaguesQuery = ffUseQuery(
    `ff-leagues-${linkedIds.join(",")}-${linkedYahooKeys.join(",")}`,
    () => ffGetLinkedLeagueSummaries(sleeper, yahoo),
    [linkedIds.join(","), linkedYahooKeys.join(",")]
  );

  const players = playersQuery.data || [];
  const values = tradeValuesQuery.data || {};
  const watchedPlayers = players.filter((p) => watchlist.includes(p.playerId));

  const topPlayers = players
    .map((p) => ({ player: p, entry: values[p.playerId] }))
    .filter((x) => x.entry)
    .sort((a, b) => a.entry.overallRank - b.entry.overallRank)
    .slice(0, 10);

  const leaguesData = leaguesQuery.data || { leagues: [], errors: [] };

  return (
    <div className="page page--wide">
      <div className="page-header">
        <h1>Dashboard</h1>
        <a href="#fantasy/onboarding" className="button-link">
          + Add leagues
        </a>
      </div>

      <div className="dashboard-grid">
        <section className="dashboard-widget dashboard-widget--wide">
          <div className="dashboard-widget__header">
            <h2>Top Fantasy Players</h2>
            <span className="data-source-note">Trade values via FantasyCalc.</span>
          </div>
          {topPlayers.length > 0 ? (
            <div className="top-players-list">
              {topPlayers.map(({ player, entry }) => (
                <a key={player.playerId} href={`#fantasy/players/${player.playerId}`} className="top-player-row">
                  <span className={`top-player-row__rank ${ffMedalClass(entry.overallRank)}`}>#{entry.overallRank}</span>
                  <FFPlayerAvatar playerId={player.playerId} name={player.name} position={player.position} team={player.team} size="sm" />
                  <span className="top-player-row__name">{player.name}</span>
                  <FFPositionBadge position={player.position} />
                  <FFTeamTag team={player.team} />
                  <span className="top-player-row__value">{entry.value.toLocaleString()}</span>
                </a>
              ))}
            </div>
          ) : (
            <p className="empty-state">
              {playersQuery.isError || tradeValuesQuery.isError
                ? "Couldn't reach the ranking service — check your connection and reload."
                : playersQuery.isLoading || tradeValuesQuery.isLoading
                ? "Loading rankings…"
                : "No ranked players available right now."}
            </p>
          )}
        </section>

        <section className="dashboard-widget">
          <div className="dashboard-widget__header">
            <h2>Your Watchlist</h2>
          </div>
          {watchedPlayers.length === 0 ? (
            <p className="empty-state">Star a player anywhere on the site (Players, Waiver Wire, or their profile) to pin them here.</p>
          ) : (
            <div className="dashboard-widget__stack">
              {watchedPlayers.map((player) => (
                <FFPlayerDetailCard key={player.playerId} player={player} entry={values[player.playerId]} />
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-widget">
          <div className="dashboard-widget__header">
            <h2>Your Leagues</h2>
          </div>
          {leaguesQuery.isLoading && linkedIds.length > 0 && <p className="empty-state">Loading leagues...</p>}
          {leaguesData.errors.length > 0 && (
            <div className="warning-banner">
              {leaguesData.errors.map((err, i) => (
                <p key={i}>{err}</p>
              ))}
            </div>
          )}
          {leaguesData.leagues.length === 0 && (
            <p className="empty-state">
              No leagues linked yet. <a href="#fantasy/onboarding">Connect Sleeper or Yahoo</a> to get started.
            </p>
          )}
          <div className="league-grid">
            {leaguesData.leagues.map((league) => (
              <FFLeagueCard key={`${league.platform}-${league.leagueId}`} league={league} />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

const FF_POSITIONS_LIST = ["QB", "RB", "WR", "TE", "K", "DEF"];
const FF_PAGE_SIZE = 15;

function FFPlayersPage({ watchlist, setWatchlist }) {
  const playersQuery = ffUseQuery("ff-players", ffGetFantasyRelevantPlayers);
  const [search, setSearch] = useState("");
  const [position, setPosition] = useState("ALL");
  const [team, setTeam] = useState("ALL");
  const [format, setFormat] = useState("full");
  const [health, setHealth] = useState("ALL");
  const [rookiesOnly, setRookiesOnly] = useState(false);
  const [rankedOnly, setRankedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { dynasty, ppr } = FF_FORMAT_PARAMS[format];
  const tradeValuesQuery = ffUseQuery(`ff-trade-values-${dynasty}-${ppr}`, () => ffGetTradeValues(dynasty, ppr), [dynasty, ppr]);
  const values = tradeValuesQuery.data || {};
  const data = playersQuery.data;

  const teams = useMemo(() => (data ? [...new Set(data.map((p) => p.team))].sort() : []), [data]);

  const filtered = useMemo(() => {
    if (!data) return [];
    const query = search.trim().toLowerCase();
    return data
      .filter((p) => (position === "ALL" ? true : p.position === position))
      .filter((p) => (team === "ALL" ? true : p.team === team))
      .filter((p) => (query === "" ? true : p.name.toLowerCase().includes(query)))
      .filter((p) => {
        if (health === "ALL") return true;
        if (health === "HEALTHY") return !p.injuryStatus;
        return Boolean(p.injuryStatus);
      })
      .filter((p) => (rookiesOnly ? p.yearsExp === 0 : true))
      .filter((p) => (rankedOnly ? Boolean(values[p.playerId]) : true))
      .sort((a, b) => {
        const rankA = values[a.playerId] ? values[a.playerId].overallRank : Infinity;
        const rankB = values[b.playerId] ? values[b.playerId].overallRank : Infinity;
        if (rankA !== rankB) return rankA - rankB;
        return a.name.localeCompare(b.name);
      });
  }, [data, search, position, team, health, rookiesOnly, rankedOnly, values]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / FF_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const paged = filtered.slice((currentPage - 1) * FF_PAGE_SIZE, currentPage * FF_PAGE_SIZE);
  const rangeStart = filtered.length === 0 ? 0 : (currentPage - 1) * FF_PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * FF_PAGE_SIZE, filtered.length);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Player Database</h1>
      </div>
      <p className="data-source-note">Live player data via Sleeper &middot; trade values via FantasyCalc.</p>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <select
          value={position}
          onChange={(e) => {
            setPosition(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">All positions</option>
          {FF_POSITIONS_LIST.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
        <select
          value={team}
          onChange={(e) => {
            setTeam(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">All teams</option>
          {teams.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="standard">Standard</option>
          <option value="half">Half PPR</option>
          <option value="full">Full PPR</option>
          <option value="dynasty">Dynasty</option>
        </select>
      </div>

      <div className="filter-bar filter-bar--secondary">
        <select
          value={health}
          onChange={(e) => {
            setHealth(e.target.value);
            setPage(1);
          }}
        >
          <option value="ALL">Any health status</option>
          <option value="HEALTHY">Healthy only</option>
          <option value="INJURED">Injured / questionable</option>
        </select>
        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={rookiesOnly}
            onChange={(e) => {
              setRookiesOnly(e.target.checked);
              setPage(1);
            }}
          />
          Rookies only
        </label>
        <label className="filter-toggle">
          <input
            type="checkbox"
            checked={rankedOnly}
            onChange={(e) => {
              setRankedOnly(e.target.checked);
              setPage(1);
            }}
          />
          Ranked only
        </label>
      </div>

      {playersQuery.isLoading && <p>Loading players...</p>}
      {playersQuery.isError && <p className="error-text">{playersQuery.error && playersQuery.error.message}</p>}

      {data && (
        <>
          <p className="empty-state">
            Showing {rangeStart}&ndash;{rangeEnd} of {filtered.length} players
          </p>
          <FFPlayersTable players={paged} values={values} watchlist={watchlist} setWatchlist={setWatchlist} />
          {totalPages > 1 && (
            <div className="pagination">
              <button type="button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>
                &lsaquo; Prev
              </button>
              <span className="pagination__status">
                Page {currentPage} of {totalPages}
              </span>
              <button type="button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= totalPages}>
                Next &rsaquo;
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function FFWaiverWirePage({ watchlist, setWatchlist }) {
  const [type, setType] = useState("add");
  const [position, setPosition] = useState("ALL");
  const trendingQuery = ffUseQuery(`ff-trending-${type}`, () => ffGetTrendingPlayers(type), [type]);
  const data = trendingQuery.data;
  const filtered = useMemo(() => {
    if (!data) return [];
    return data.filter((p) => (position === "ALL" ? true : p.position === position));
  }, [data, position]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Waiver Wire</h1>
      </div>
      <p className="data-source-note">Live add/drop data via Sleeper, refreshed every 24h.</p>

      <div className="filter-bar">
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="add">Most Added (24h)</option>
          <option value="drop">Most Dropped (24h)</option>
        </select>
        <select value={position} onChange={(e) => setPosition(e.target.value)}>
          <option value="ALL">All positions</option>
          {FF_POSITIONS_LIST.map((pos) => (
            <option key={pos} value={pos}>
              {pos}
            </option>
          ))}
        </select>
      </div>

      {trendingQuery.isLoading && <p>Loading trends...</p>}
      {trendingQuery.isError && <p className="error-text">{trendingQuery.error && trendingQuery.error.message}</p>}

      {data && <FFTrendingTable players={filtered} type={type} watchlist={watchlist} setWatchlist={setWatchlist} />}
    </div>
  );
}

const ffAsInt = (v) => v.toLocaleString();
const ffAsDecimal1 = (v) => v.toFixed(1);
const ffAsDecimal2 = (v) => v.toFixed(2);
const ffAsPercent = (v) => `${(v * 100).toFixed(1)}%`;

function ffRenderStatValue(entry, field) {
  const raw = entry[field.key];
  if (raw === null || raw === undefined) return "—";
  return (field.format || ffAsInt)(raw);
}

// Which raw counting stats are worth showing depends entirely on position —
// a WR's completions are always zero and just clutter the card.
function ffStatFieldsFor(position) {
  switch (position) {
    case "QB":
      return [
        { label: "Comp", key: "completions" },
        { label: "Att", key: "attempts" },
        { label: "Pass Yds", key: "passingYards" },
        { label: "Pass TD", key: "passingTds" },
        { label: "INT", key: "interceptions" },
        { label: "Rush Yds", key: "rushingYards" },
        { label: "Rush TD", key: "rushingTds" },
      ];
    case "RB":
      return [
        { label: "Carries", key: "carries" },
        { label: "Rush Yds", key: "rushingYards" },
        { label: "Rush TD", key: "rushingTds" },
        { label: "Rec", key: "receptions" },
        { label: "Rec Yds", key: "receivingYards" },
        { label: "Rec TD", key: "receivingTds" },
      ];
    case "WR":
    case "TE":
      return [
        { label: "Targets", key: "targets" },
        { label: "Rec", key: "receptions" },
        { label: "Rec Yds", key: "receivingYards" },
        { label: "Rec TD", key: "receivingTds" },
      ];
    default:
      return [];
  }
}

function ffAdvancedFieldsFor(position) {
  switch (position) {
    case "QB":
      return [
        { label: "Sacks", key: "sacks" },
        { label: "Sack Yds", key: "sackYards" },
        { label: "Pass Air Yds", key: "passingAirYards" },
        { label: "Pass YAC", key: "passingYardsAfterCatch" },
        { label: "Pass 1st Downs", key: "passingFirstDowns" },
        { label: "Pass EPA", key: "passingEpa", format: ffAsDecimal1 },
        { label: "PACR", key: "pacr", format: ffAsDecimal2 },
        { label: "DAKOTA", key: "dakota", format: ffAsDecimal2 },
        { label: "Pass 2PT", key: "passing2ptConversions" },
      ];
    case "RB":
      return [
        { label: "Fumbles", key: "rushingFumbles" },
        { label: "Fumbles Lost", key: "rushingFumblesLost" },
        { label: "Rush 1st Downs", key: "rushingFirstDowns" },
        { label: "Rush EPA", key: "rushingEpa", format: ffAsDecimal1 },
        { label: "Rec EPA", key: "receivingEpa", format: ffAsDecimal1 },
        { label: "Target Share", key: "targetShare", format: ffAsPercent },
        { label: "WOPR", key: "wopr", format: ffAsDecimal2 },
      ];
    case "WR":
    case "TE":
      return [
        { label: "Air Yards", key: "receivingAirYards" },
        { label: "YAC", key: "receivingYardsAfterCatch" },
        { label: "Rec 1st Downs", key: "receivingFirstDowns" },
        { label: "Rec EPA", key: "receivingEpa", format: ffAsDecimal1 },
        { label: "RACR", key: "racr", format: ffAsDecimal2 },
        { label: "Target Share", key: "targetShare", format: ffAsPercent },
        { label: "Air Yards Share", key: "airYardsShare", format: ffAsPercent },
        { label: "WOPR", key: "wopr", format: ffAsDecimal2 },
        { label: "Fumbles", key: "receivingFumbles" },
      ];
    default:
      return [];
  }
}

function ffWeeklyColumnsFor(position) {
  switch (position) {
    case "QB":
      return [
        { label: "Comp/Att", render: (w) => `${w.completions}/${w.attempts}` },
        { label: "Pass Yds", render: (w) => w.passingYards.toLocaleString() },
        { label: "Pass TD", render: (w) => String(w.passingTds) },
        { label: "INT", render: (w) => String(w.interceptions) },
        { label: "Rush Yds", render: (w) => w.rushingYards.toLocaleString() },
      ];
    case "RB":
      return [
        { label: "Carries", render: (w) => String(w.carries) },
        { label: "Rush Yds", render: (w) => w.rushingYards.toLocaleString() },
        { label: "Rush TD", render: (w) => String(w.rushingTds) },
        { label: "Rec", render: (w) => String(w.receptions) },
        { label: "Rec Yds", render: (w) => w.receivingYards.toLocaleString() },
      ];
    case "WR":
    case "TE":
      return [
        { label: "Tgt", render: (w) => String(w.targets) },
        { label: "Rec", render: (w) => String(w.receptions) },
        { label: "Rec Yds", render: (w) => w.receivingYards.toLocaleString() },
        { label: "Rec TD", render: (w) => String(w.receivingTds) },
      ];
    default:
      return [];
  }
}

function FFPlayerProfilePage({ playerId, watchlist, setWatchlist }) {
  const playersQuery = ffUseQuery("ff-players", ffGetFantasyRelevantPlayers);
  const player = (playersQuery.data || []).find((p) => p.playerId === playerId);

  const standard = ffUseQuery("ff-trade-values-false-0", () => ffGetTradeValues(false, 0));
  const half = ffUseQuery("ff-trade-values-false-0.5", () => ffGetTradeValues(false, 0.5));
  const full = ffUseQuery("ff-trade-values-false-1", () => ffGetTradeValues(false, 1));
  const dynasty = ffUseQuery("ff-trade-values-true-1", () => ffGetTradeValues(true, 1));
  const seasonStatsQuery = ffUseQuery("ff-season-stats", ffGetSeasonStats);
  const weeklyKey = player ? `ff-weekly-stats-${player.playerId}` : "ff-weekly-stats-none";
  const weeklyStatsQuery = ffUseQuery(weeklyKey, () => (player ? ffGetWeeklyStats(player.playerId) : Promise.resolve([])), [weeklyKey]);

  const queriesByFormat = { standard, half, full, dynasty };

  if (playersQuery.isLoading) {
    return (
      <div className="page">
        <p>Loading player...</p>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="page">
        <button type="button" className="back-link" onClick={() => window.history.back()}>
          &larr; Back to players
        </button>
        <p className="error-text">Player not found.</p>
      </div>
    );
  }

  const seasonStats = seasonStatsQuery.data || {};
  const seasonEntry = seasonStats[player.playerId];
  const fields = ffStatFieldsFor(player.position);
  const advancedFields = ffAdvancedFieldsFor(player.position);
  const weeks = weeklyStatsQuery.data;
  const columns = ffWeeklyColumnsFor(player.position);
  const maxPoints = weeks && weeks.length ? Math.max(...weeks.map((w) => w.fantasyPointsPpr), 1) : 1;

  return (
    <div className="page">
      <button type="button" className="back-link" onClick={() => window.history.back()}>
        &larr; Back to players
      </button>

      <div className="player-profile__banner">
        <div className="player-profile__identity">
          <FFPlayerAvatar playerId={player.playerId} name={player.name} position={player.position} team={player.team} size="md" ringColor={ffTeamColor(player.team)} />
          <div>
            <h1>
              {player.name}
              {player.jerseyNumber !== null && <span className="player-profile__number">No. {player.jerseyNumber}</span>}
              <FFWatchlistButton playerId={player.playerId} watchlist={watchlist} setWatchlist={setWatchlist} />
            </h1>
            <div className="player-profile__meta">
              <FFPositionBadge position={player.position} />
              <FFTeamTag team={player.team} />
              {player.injuryStatus && <span className="injury-badge">{player.injuryStatus}</span>}
            </div>
          </div>
        </div>

        <div className="player-profile__stats">
          <div>
            <span className="player-profile__bio-label">Age</span>
            <span>{player.age ?? "—"}</span>
          </div>
          <div>
            <span className="player-profile__bio-label">Ht/Wt</span>
            <span>
              {ffFormatHeight(player.heightInches)}
              {player.weightLbs !== null ? ` / ${player.weightLbs} lb` : ""}
            </span>
          </div>
          <div>
            <span className="player-profile__bio-label">College</span>
            <span>{player.college ?? "—"}</span>
          </div>
          <div>
            <span className="player-profile__bio-label">Exp</span>
            <span>{player.yearsExp !== null ? `${player.yearsExp} yrs` : "—"}</span>
          </div>
          <div>
            <span className="player-profile__bio-label">Bye</span>
            <span>{ffByeWeekFor(player.team) ?? "—"}</span>
          </div>
        </div>
      </div>

      {seasonEntry && fields.length > 0 && (
        <>
          <h2>{seasonEntry.season} Season Stats</h2>
          <p className="data-source-note">Real per-player stats via nflverse (open data) &middot; {seasonEntry.games} games played.</p>
          <div className="ranking-cards">
            {fields.map((field) => (
              <div key={field.label} className="ranking-card">
                <span className="ranking-card__label">{field.label}</span>
                <span className="ranking-card__value">{ffRenderStatValue(seasonEntry, field)}</span>
              </div>
            ))}
            <div className="ranking-card">
              <span className="ranking-card__label">Fantasy Pts (PPR)</span>
              <span className="ranking-card__value">{seasonEntry.fantasyPointsPpr.toFixed(1)}</span>
            </div>
          </div>

          {advancedFields.length > 0 && (
            <>
              <h2>Advanced Metrics</h2>
              <p className="data-source-note">Efficiency &amp; opportunity stats &mdash; EPA, air yards, target share, and friends.</p>
              <div className="ranking-cards">
                {advancedFields.map((field) => (
                  <div key={field.label} className="ranking-card">
                    <span className="ranking-card__label">{field.label}</span>
                    <span className="ranking-card__value">{ffRenderStatValue(seasonEntry, field)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}

      {weeks && weeks.length > 0 && columns.length > 0 && (
        <>
          <h2>Game Log</h2>
          <p className="data-source-note">Week-by-week box score via nflverse (open data).</p>
          <div className="data-table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Week</th>
                  <th>Opp</th>
                  {columns.map((col) => (
                    <th key={col.label}>{col.label}</th>
                  ))}
                  <th>Fantasy Pts (PPR)</th>
                </tr>
              </thead>
              <tbody>
                {weeks.map((week) => (
                  <tr key={week.week}>
                    <td>{week.week}</td>
                    <td>{week.opponentTeam}</td>
                    {columns.map((col) => (
                      <td key={col.label}>{col.render(week)}</td>
                    ))}
                    <td>
                      <div className="game-log-points">
                        <div className="game-log-points__track">
                          <div className="game-log-points__bar" style={{ width: `${Math.max((week.fantasyPointsPpr / maxPoints) * 100, 3)}%` }} />
                        </div>
                        <span>{week.fantasyPointsPpr.toFixed(1)}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h2>Rankings by Format</h2>
      <p className="data-source-note">Trade values via FantasyCalc.</p>
      <div className="ranking-cards">
        {FF_FORMATS.map(({ key, label }) => {
          const q = queriesByFormat[key];
          const entry = q.data && q.data[player.playerId];
          return (
            <div key={key} className="ranking-card">
              <span className="ranking-card__label">{label}</span>
              {q.isLoading ? (
                <span className="ranking-card__unranked">Loading…</span>
              ) : entry ? (
                <>
                  <span className={`ranking-card__rank ${ffMedalClass(entry.overallRank)}`}>#{entry.overallRank}</span>
                  <span className="ranking-card__value">{entry.value.toLocaleString()}</span>
                </>
              ) : (
                <span className="ranking-card__unranked">Unranked</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function FFPlayerComparisonPage() {
  const playersQuery = ffUseQuery("ff-players", ffGetFantasyRelevantPlayers);
  const [format, setFormat] = useState("full");
  const [selected, setSelected] = useState([]);
  const [showFullComparison, setShowFullComparison] = useState(false);

  const { dynasty, ppr } = FF_FORMAT_PARAMS[format];
  const tradeValuesQuery = ffUseQuery(`ff-trade-values-${dynasty}-${ppr}`, () => ffGetTradeValues(dynasty, ppr), [dynasty, ppr]);
  const values = tradeValuesQuery.data || {};

  const candidates = playersQuery.data || [];
  const selectedIds = new Set(selected.map((p) => p.playerId));

  return (
    <div className="page">
      <div className="page-header">
        <h1>Player Comparison</h1>
      </div>

      <div className="filter-bar">
        <select value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="standard">Standard</option>
          <option value="half">Half PPR</option>
          <option value="full">Full PPR</option>
          <option value="dynasty">Dynasty</option>
        </select>
        {selected.length > 0 && (
          <button type="button" onClick={() => setShowFullComparison(true)}>
            Full Comparison
          </button>
        )}
      </div>

      {playersQuery.isLoading && <p>Loading players...</p>}
      {playersQuery.isError && <p className="error-text">{playersQuery.error && playersQuery.error.message}</p>}

      {playersQuery.data && (
        <>
          {selected.length < 6 && (
            <FFPlayerSearchAdd
              candidates={candidates}
              excludeIds={selectedIds}
              onAdd={(p) => setSelected([...selected, p])}
              placeholder="Search to add a player (up to 6)..."
            />
          )}

          <FFComparisonTable players={selected} values={values} onRemove={(id) => setSelected(selected.filter((p) => p.playerId !== id))} />
        </>
      )}

      {showFullComparison && <FFComparisonModal players={selected} values={values} onClose={() => setShowFullComparison(false)} />}
    </div>
  );
}

/* ----------------------------------------------------------------------
   FANTASY TAB — Trade Analyzer
   Ported from FantasyFootballTool's TradeAnalyzer.tsx. "League" mode (built
   a trade from a real roster) is left out here since it needs linked
   leagues — lands together with League Detail/Onboarding in a later batch.
   Freeform mode (any player or draft pick, either side) works standalone.
---------------------------------------------------------------------- */

const FF_PICK_ROUND_BASE_VALUE = { 1: 5000, 2: 1500, 3: 500, 4: 200 };
const FF_PICK_TIERS = [
  { key: "early", label: "Early", multiplier: 1.15 },
  { key: "mid", label: "Mid", multiplier: 1.0 },
  { key: "late", label: "Late", multiplier: 0.85 },
];
const FF_PICK_YEAR_DISCOUNTS = [1, 0.8, 0.62];

function ffNextDraftYear() {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() + 1 : now.getFullYear();
}

function ffGenerateDraftPickAssets() {
  const startYear = ffNextDraftYear();
  const assets = [];
  FF_PICK_YEAR_DISCOUNTS.forEach((yearDiscount, yearOffset) => {
    const year = startYear + yearOffset;
    for (const round of [1, 2, 3, 4]) {
      for (const tier of FF_PICK_TIERS) {
        const value = Math.round(FF_PICK_ROUND_BASE_VALUE[round] * tier.multiplier * yearDiscount);
        assets.push({ id: `pick-${year}-${round}-${tier.key}`, label: `${year} Round ${round} (${tier.label})`, value });
      }
    }
  });
  return assets;
}

function FFTradeSide({ label, candidates, selected, values, onAdd, onRemove }) {
  const selectedIds = new Set(selected.map((p) => p.playerId));
  const total = selected.reduce((sum, p) => sum + (values[p.playerId] ? values[p.playerId].value : 0), 0);
  const unrankedCount = selected.filter((p) => !values[p.playerId]).length;

  return (
    <div className="trade-side">
      <h3>{label}</h3>
      <FFPlayerSearchAdd candidates={candidates} excludeIds={selectedIds} onAdd={onAdd} />
      <ul className="trade-side__selected">
        {selected.length === 0 && <li className="empty-state">No players added yet.</li>}
        {selected.map((player) => {
          const entry = values[player.playerId];
          return (
            <li key={player.playerId}>
              <span>
                {player.name} ({player.position}
                {player.team ? ` - ${player.team}` : ""})
              </span>
              <span className="trade-side__value">{entry ? entry.value.toLocaleString() : "Unranked"}</span>
              <button type="button" className="trade-side__remove" onClick={() => onRemove(player.playerId)}>
                &times;
              </button>
            </li>
          );
        })}
      </ul>
      <p className="trade-side__total">
        Total value: {total.toLocaleString()}
        {unrankedCount > 0 ? ` (${unrankedCount} unranked player${unrankedCount > 1 ? "s" : ""} not counted)` : ""}
      </p>
    </div>
  );
}

function FFTradeReviewModal({ sideA, sideB, values, verdict, onClose }) {
  return (
    <FFModal title="Review Trade" onClose={onClose}>
      <p className="trade-review-modal__verdict">{verdict}</p>
      <div className="trade-review-modal__columns">
        <div>
          <h3>Side A gives</h3>
          {sideA.length === 0 && <p className="empty-state">No players.</p>}
          <div className="comparison-modal__stack">
            {sideA.map((player) => (
              <FFPlayerDetailCard key={player.playerId} player={player} entry={values[player.playerId]} />
            ))}
          </div>
        </div>
        <div>
          <h3>Side B gives</h3>
          {sideB.length === 0 && <p className="empty-state">No players.</p>}
          <div className="comparison-modal__stack">
            {sideB.map((player) => (
              <FFPlayerDetailCard key={player.playerId} player={player} entry={values[player.playerId]} />
            ))}
          </div>
        </div>
      </div>
    </FFModal>
  );
}

function FFTradeAnalyzerPage() {
  const [dynasty, setDynasty] = useState(false);
  const [sideA, setSideA] = useState([]);
  const [sideB, setSideB] = useState([]);
  const [showReview, setShowReview] = useState(false);

  const playersQuery = ffUseQuery("ff-players", ffGetFantasyRelevantPlayers);
  const tradeValuesQuery = ffUseQuery(`ff-trade-values-${dynasty}-1`, () => ffGetTradeValues(dynasty, 1), [dynasty]);

  const pickAssets = useMemo(() => ffGenerateDraftPickAssets(), []);
  const pickCandidates = useMemo(() => pickAssets.map((asset) => ({ playerId: asset.id, name: asset.label, position: "PICK", team: null })), [pickAssets]);
  const pickValues = useMemo(() => {
    const map = {};
    for (const asset of pickAssets) map[asset.id] = { sleeperId: asset.id, value: asset.value, overallRank: 0, positionRank: 0, trend30Day: 0 };
    return map;
  }, [pickAssets]);

  const values = { ...(tradeValuesQuery.data || {}), ...pickValues };
  const candidates = [...(playersQuery.data || []), ...pickCandidates];

  const totalA = useMemo(() => sideA.reduce((sum, p) => sum + (values[p.playerId] ? values[p.playerId].value : 0), 0), [sideA, values]);
  const totalB = useMemo(() => sideB.reduce((sum, p) => sum + (values[p.playerId] ? values[p.playerId].value : 0), 0), [sideB, values]);
  const diff = totalA - totalB;
  const hasTrade = sideA.length > 0 && sideB.length > 0;

  function verdict() {
    if (!hasTrade) return "Add players to both sides to see a verdict.";
    const threshold = Math.max(totalA, totalB) * 0.1;
    if (Math.abs(diff) <= threshold) return "Roughly even trade.";
    return diff > 0 ? `Side A gives up more value (+${diff.toLocaleString()}) — favors Side B.` : `Side B gives up more value (+${Math.abs(diff).toLocaleString()}) — favors Side A.`;
  }
  function verdictClass() {
    if (!hasTrade) return "trade-verdict--neutral";
    const threshold = Math.max(totalA, totalB) * 0.1;
    return Math.abs(diff) <= threshold ? "trade-verdict--even" : "trade-verdict--lopsided";
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Trade Analyzer</h1>
      </div>

      <div className="filter-bar">
        <select value={dynasty ? "dynasty" : "redraft"} onChange={(e) => setDynasty(e.target.value === "dynasty")}>
          <option value="redraft">Redraft value</option>
          <option value="dynasty">Dynasty value</option>
        </select>
      </div>

      <div className="trade-grid">
        <FFTradeSide label="Side A gives" candidates={candidates} selected={sideA} values={values} onAdd={(p) => setSideA([...sideA, p])} onRemove={(id) => setSideA(sideA.filter((p) => p.playerId !== id))} />
        <div className="trade-vs">VS</div>
        <FFTradeSide label="Side B gives" candidates={candidates} selected={sideB} values={values} onAdd={(p) => setSideB([...sideB, p])} onRemove={(id) => setSideB(sideB.filter((p) => p.playerId !== id))} />
      </div>

      <div className={`trade-verdict ${verdictClass()}`}>{verdict()}</div>

      {hasTrade && (
        <div className="trade-review-trigger">
          <button type="button" onClick={() => setShowReview(true)}>
            Review Trade
          </button>
        </div>
      )}

      {showReview && <FFTradeReviewModal sideA={sideA} sideB={sideB} values={values} verdict={verdict()} onClose={() => setShowReview(false)} />}
    </div>
  );
}

/* ----------------------------------------------------------------------
   FANTASY TAB — Mock Draft
   Ported from mockDraftEngine.ts, draftGrading.ts, and MockDraft.tsx +
   its DraftBoard/DraftRoster/AvailablePlayersPanel components. State persists to
   sessionStorage (survives switching tabs, not a browser restart) — same
   choice the original made, since a draft-in-progress isn't the kind of
   thing that belongs in a permanent backup file.
---------------------------------------------------------------------- */

const FF_SLOT_PRIORITY = ["QB", "RB", "WR", "TE", "FLEX", "K", "DEF"];
const FF_SLOT_POSITIONS = { QB: ["QB"], RB: ["RB"], WR: ["WR"], TE: ["TE"], FLEX: ["RB", "WR", "TE"], K: ["K"], DEF: ["DEF"], BENCH: [] };

function ffDefaultRosterSlots() {
  return { QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, K: 1, DEF: 1, BENCH: 6 };
}
function ffTotalRounds(slots) {
  return Object.values(slots).reduce((sum, n) => sum + n, 0);
}
function ffBuildPickOrder(numTeams, rounds) {
  const picks = [];
  let overallPick = 1;
  for (let round = 0; round < rounds; round++) {
    const teamIndices = Array.from({ length: numTeams }, (_, i) => i);
    const order = round % 2 === 0 ? teamIndices : teamIndices.reverse();
    for (const teamIndex of order) picks.push({ overallPick: overallPick++, round: round + 1, teamIndex });
  }
  return picks;
}
function ffCountFilledSlots(teamPicks) {
  const counts = { QB: 0, RB: 0, WR: 0, TE: 0, FLEX: 0, K: 0, DEF: 0, BENCH: 0 };
  for (const pick of teamPicks) counts[pick.slot]++;
  return counts;
}
function ffRankOf(player, values) {
  return values[player.playerId] ? values[player.playerId].overallRank : Infinity;
}
function ffBestByRank(players, values) {
  return players.reduce((a, b) => (ffRankOf(a, values) <= ffRankOf(b, values) ? a : b));
}
function ffSlotFor(player, filled, rosterSlots) {
  for (const slot of FF_SLOT_PRIORITY) {
    if (filled[slot] < rosterSlots[slot] && FF_SLOT_POSITIONS[slot].includes(player.position)) return slot;
  }
  return "BENCH";
}
function ffHasOpenSlot(player, filled, rosterSlots) {
  for (const slot of FF_SLOT_PRIORITY) {
    if (FF_SLOT_POSITIONS[slot].includes(player.position) && filled[slot] < rosterSlots[slot]) return true;
  }
  return filled.BENCH < rosterSlots.BENCH;
}
function ffIsKickerOrDefense(player) {
  return player.position === "K" || player.position === "DEF";
}
function ffPickForNeed(availablePlayers, filled, rosterSlots, values) {
  for (const slot of FF_SLOT_PRIORITY) {
    if (filled[slot] >= rosterSlots[slot]) continue;
    const eligible = availablePlayers.filter((p) => FF_SLOT_POSITIONS[slot].includes(p.position));
    if (eligible.length === 0) continue;
    return { player: ffBestByRank(eligible, values), slot };
  }
  if (filled.BENCH < rosterSlots.BENCH && availablePlayers.length > 0) {
    return { player: ffBestByRank(availablePlayers, values), slot: "BENCH" };
  }
  return null;
}
function ffChooseBestPick(availablePlayers, teamPicks, rosterSlots, values, round, playersById) {
  const filled = ffCountFilledSlots(teamPicks);
  const rounds = ffTotalRounds(rosterSlots);
  const picksRemaining = rounds - teamPicks.length;
  const unfilledMandatory = FF_SLOT_PRIORITY.reduce((sum, slot) => sum + Math.max(0, rosterSlots[slot] - filled[slot]), 0);

  if (picksRemaining <= unfilledMandatory) {
    return ffPickForNeed(availablePlayers, filled, rosterSlots, values);
  }

  let pool = availablePlayers.filter((p) => ffHasOpenSlot(p, filled, rosterSlots));
  const canDraftKickerDefense = round >= rounds - 1;
  if (!canDraftKickerDefense) {
    const withoutKickerDefense = pool.filter((p) => !ffIsKickerOrDefense(p));
    if (withoutKickerDefense.length > 0) pool = withoutKickerDefense;
  }
  if (pool.length === 0) return ffPickForNeed(availablePlayers, filled, rosterSlots, values);

  const sorted = [...pool].sort((a, b) => ffRankOf(a, values) - ffRankOf(b, values));
  const topCandidates = sorted.slice(0, 3);
  let chosen = topCandidates[0];
  if (topCandidates.length > 1) {
    const rosterByeCounts = new Map();
    for (const pick of teamPicks) {
      const rosterPlayer = playersById.get(pick.playerId);
      const bye = rosterPlayer ? ffByeWeekFor(rosterPlayer.team) : null;
      if (bye !== null) rosterByeCounts.set(bye, (rosterByeCounts.get(bye) || 0) + 1);
    }
    const byeOverlap = (p) => {
      const bye = ffByeWeekFor(p.team);
      return bye !== null ? rosterByeCounts.get(bye) || 0 : 0;
    };
    chosen = topCandidates.reduce((a, b) => {
      const overlapA = byeOverlap(a);
      const overlapB = byeOverlap(b);
      if (overlapA !== overlapB) return overlapA < overlapB ? a : b;
      return ffRankOf(a, values) <= ffRankOf(b, values) ? a : b;
    });
  }
  return { player: chosen, slot: ffSlotFor(chosen, filled, rosterSlots) };
}
function ffSlotForManualPick(player, teamPicks, rosterSlots) {
  return ffSlotFor(player, ffCountFilledSlots(teamPicks), rosterSlots);
}

const FF_GRADE_SCALE = ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"];
function ffSurplusFor(pick, player, values) {
  const rank = values[player.playerId] ? values[player.playerId].overallRank : undefined;
  if (rank === undefined) return 0;
  return pick.overallPick - rank;
}
function ffLetterFor(rankAmongTeams, numTeams) {
  if (numTeams <= 1) return FF_GRADE_SCALE[0];
  const percentile = rankAmongTeams / (numTeams - 1);
  const index = Math.round(percentile * (FF_GRADE_SCALE.length - 1));
  return FF_GRADE_SCALE[index];
}
function ffGradeDraft(picks, numTeams, rosterSlots, values, playersById) {
  const byTeam = new Map();
  for (const pick of picks) {
    const player = playersById.get(pick.playerId);
    if (!player) continue;
    const graded = { pick, player, surplus: ffSurplusFor(pick, player, values) };
    const list = byTeam.get(pick.teamIndex) || [];
    list.push(graded);
    byTeam.set(pick.teamIndex, list);
  }
  const totals = Array.from({ length: numTeams }, (_, teamIndex) => {
    const teamPicks = byTeam.get(teamIndex) || [];
    const totalSurplus = teamPicks.reduce((sum, p) => sum + p.surplus, 0);
    return { teamIndex, teamPicks, totalSurplus };
  });
  const sortedByValue = [...totals].sort((a, b) => b.totalSurplus - a.totalSurplus);
  const rankByTeam = new Map();
  sortedByValue.forEach((t, i) => rankByTeam.set(t.teamIndex, i));

  return totals.map(({ teamIndex, teamPicks, totalSurplus }) => {
    const sortedPicks = [...teamPicks].sort((a, b) => b.surplus - a.surplus);
    const bestPick = sortedPicks[0] || null;
    const worstPick = sortedPicks[sortedPicks.length - 1] || null;
    const notes = [];
    for (const posSlot of ["RB", "WR"]) {
      const firstAtPos = teamPicks.find((p) => p.player.position === posSlot);
      if (firstAtPos && firstAtPos.pick.round >= 5) notes.push(`First ${posSlot} came in Round ${firstAtPos.pick.round}`);
    }
    const firstQb = teamPicks.find((p) => p.player.position === "QB");
    if (firstQb && rosterSlots.QB > 0) notes.push(`First QB in Round ${firstQb.pick.round}`);
    return {
      teamIndex,
      letter: ffLetterFor(rankByTeam.get(teamIndex) || 0, numTeams),
      totalSurplus,
      bestPick,
      worstPick: worstPick && worstPick !== bestPick ? worstPick : null,
      notes,
    };
  });
}

const FF_ROSTER_SLOT_LABELS = [
  { key: "QB", label: "QB" },
  { key: "RB", label: "RB" },
  { key: "WR", label: "WR" },
  { key: "TE", label: "TE" },
  { key: "FLEX", label: "FLEX (RB/WR/TE)" },
  { key: "K", label: "K" },
  { key: "DEF", label: "DEF" },
  { key: "BENCH", label: "Bench" },
];

function FFDraftSettingsForm({ onStart, customRankings }) {
  const [numTeams, setNumTeams] = useState(12);
  const [userTeamIndex, setUserTeamIndex] = useState(0);
  const [valueSourceKey, setValueSourceKey] = useState("builtin:full");
  const [rosterSlots, setRosterSlots] = useState(ffDefaultRosterSlots());
  const customSets = Object.values(customRankings || {});

  function updateSlot(key, value) {
    if (!Number.isFinite(value)) return;
    setRosterSlots({ ...rosterSlots, [key]: Math.max(0, Math.min(10, value)) });
  }
  function updateNumTeams(value) {
    if (!Number.isFinite(value)) return;
    const clamped = Math.min(16, Math.max(2, value));
    setNumTeams(clamped);
    setUserTeamIndex((prev) => (prev === "random" ? prev : Math.min(prev, clamped - 1)));
  }
  function handleStart() {
    const resolvedTeamIndex = userTeamIndex === "random" ? Math.floor(Math.random() * numTeams) : userTeamIndex;
    const valueSource = valueSourceKey.startsWith("custom:") ? { kind: "custom", name: valueSourceKey.slice(7) } : { kind: "builtin", format: valueSourceKey.slice(8) };
    onStart({ numTeams, userTeamIndex: resolvedTeamIndex, valueSource, rosterSlots });
  }

  return (
    <div className="draft-settings">
      <div className="draft-settings__row">
        <label>
          Number of teams
          <input type="number" min={2} max={16} value={numTeams} onChange={(e) => updateNumTeams(Number(e.target.value))} />
        </label>
        <label>
          Your draft slot
          <select value={userTeamIndex} onChange={(e) => setUserTeamIndex(e.target.value === "random" ? "random" : Number(e.target.value))}>
            <option value="random">Randomize</option>
            {Array.from({ length: numTeams }, (_, i) => (
              <option key={i} value={i}>
                Pick {i + 1}
              </option>
            ))}
          </select>
        </label>
        <label>
          Scoring format
          <select value={valueSourceKey} onChange={(e) => setValueSourceKey(e.target.value)}>
            <option value="builtin:standard">Standard</option>
            <option value="builtin:half">Half PPR</option>
            <option value="builtin:full">Full PPR</option>
            <option value="builtin:dynasty">Dynasty</option>
            {customSets.length > 0 && (
              <optgroup label="Custom">
                {customSets.map((set) => (
                  <option key={set.name} value={`custom:${set.name}`}>
                    {set.name}
                  </option>
                ))}
              </optgroup>
            )}
          </select>
        </label>
      </div>

      <h2>Roster Slots</h2>
      <div className="draft-settings__slots">
        {FF_ROSTER_SLOT_LABELS.map(({ key, label }) => (
          <label key={key} className="draft-settings__slot">
            {label}
            <input type="number" min={0} max={10} value={rosterSlots[key]} onChange={(e) => updateSlot(key, Number(e.target.value))} />
          </label>
        ))}
      </div>

      <p className="empty-state">
        {ffTotalRounds(rosterSlots)} rounds &middot; {numTeams * ffTotalRounds(rosterSlots)} total picks
      </p>

      <button type="button" onClick={handleStart}>
        Start Draft
      </button>
    </div>
  );
}

function FFDraftBoardGrid({ numTeams, rounds, picks, currentPick, playersById, teamLabel }) {
  const byRoundTeam = new Map();
  for (const pick of picks) byRoundTeam.set(`${pick.round}-${pick.teamIndex}`, pick);
  const teamIndices = Array.from({ length: numTeams }, (_, i) => i);
  const roundNumbers = Array.from({ length: rounds }, (_, i) => i + 1);

  return (
    <div className="draft-board-scroll">
      <table className="draft-board">
        <thead>
          <tr>
            <th className="draft-board__corner">Rd</th>
            {teamIndices.map((teamIndex) => (
              <th key={teamIndex}>{teamLabel(teamIndex)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {roundNumbers.map((round) => (
            <tr key={round}>
              <td className="draft-board__round">{round}</td>
              {teamIndices.map((teamIndex) => {
                const pick = byRoundTeam.get(`${round}-${teamIndex}`);
                const player = pick ? playersById.get(pick.playerId) : undefined;
                const isCurrent = currentPick && currentPick.round === round && currentPick.teamIndex === teamIndex;
                return (
                  <td key={teamIndex} className={`draft-board__cell ${isCurrent ? "draft-board__cell--current" : ""}`}>
                    {player ? (
                      <>
                        <span className="draft-board__player-name">{player.name}</span>
                        <FFPositionBadge position={player.position} />
                      </>
                    ) : isCurrent ? (
                      <span className="draft-board__on-clock">On the clock</span>
                    ) : (
                      <span className="draft-board__empty">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const FF_ALL_SLOTS = [...FF_SLOT_PRIORITY, "BENCH"];
function FFDraftRosterPanel({ picks, rosterSlots, playersById }) {
  const bySlot = new Map();
  for (const pick of picks) {
    const list = bySlot.get(pick.slot) || [];
    list.push(pick);
    bySlot.set(pick.slot, list);
  }
  return (
    <div className="draft-roster-panel">
      {FF_ALL_SLOTS.map((slot) => {
        const slotPicks = bySlot.get(slot) || [];
        const count = rosterSlots[slot];
        if (count === 0) return null;
        return (
          <div key={slot} className="draft-roster-panel__group">
            <span className="draft-roster-panel__slot-label">{slot}</span>
            {Array.from({ length: count }, (_, i) => {
              const pick = slotPicks[i];
              const player = pick ? playersById.get(pick.playerId) : undefined;
              return (
                <div key={i} className="draft-roster-panel__row">
                  {player ? (
                    <>
                      <span>{player.name}</span>
                      <FFPositionBadge position={player.position} />
                    </>
                  ) : (
                    <span className="empty-state">Empty</span>
                  )}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

const FF_AVAILABLE_POSITIONS = ["ALL", "QB", "RB", "WR", "TE", "K", "DEF"];
function FFAvailablePlayersPanel({ players, values, onDraft, canDraft }) {
  const [position, setPosition] = useState("ALL");
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return players
      .filter((p) => (position === "ALL" ? true : p.position === position))
      .filter((p) => (query === "" ? true : p.name.toLowerCase().includes(query)))
      .sort((a, b) => ffRankOf(a, values) - ffRankOf(b, values))
      .slice(0, 100);
  }, [players, position, search, values]);

  return (
    <div className="available-players">
      <div className="available-players__tabs">
        {FF_AVAILABLE_POSITIONS.map((pos) => (
          <button key={pos} type="button" className={`available-players__tab ${position === pos ? "available-players__tab--active" : ""}`} onClick={() => setPosition(pos)}>
            {pos}
          </button>
        ))}
      </div>
      <input type="text" placeholder="Search available players..." value={search} onChange={(e) => setSearch(e.target.value)} />
      <div className="available-players__scroll">
        <table className="data-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Player</th>
              <th>Pos</th>
              <th>Team</th>
              <th>Bye</th>
              <th>Value</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((player) => {
              const entry = values[player.playerId];
              return (
                <tr key={player.playerId}>
                  <td>{entry ? <span className={ffMedalClass(entry.overallRank)}>#{entry.overallRank}</span> : "—"}</td>
                  <td>
                    <span className="table-player-link">
                      <FFPlayerAvatar playerId={player.playerId} name={player.name} position={player.position} team={player.team} size="sm" />
                      {player.name}
                    </span>
                  </td>
                  <td><FFPositionBadge position={player.position} /></td>
                  <td><FFTeamTag team={player.team} /></td>
                  <td>{ffByeWeekFor(player.team) ?? "—"}</td>
                  <td>{entry ? entry.value.toLocaleString() : "Unranked"}</td>
                  <td>
                    <button type="button" disabled={!canDraft} onClick={() => onDraft(player.playerId)}>
                      Draft
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="empty-state">
                  No players match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const FF_MOCK_DRAFT_STORAGE_KEY = "vantage.fantasyMockDraft.state";
const FF_BOT_PICK_DELAY_MS = 500;

function ffLoadStoredDraft() {
  try {
    const raw = sessionStorage.getItem(FF_MOCK_DRAFT_STORAGE_KEY);
    return raw ? JSON.parse(raw) : { settings: null, picks: [] };
  } catch (e) {
    return { settings: null, picks: [] };
  }
}

function FFMockDraftPage({ customRankings }) {
  const [settings, setSettings] = useState(() => ffLoadStoredDraft().settings);
  const [picks, setPicks] = useState(() => ffLoadStoredDraft().picks);

  useEffect(() => {
    try {
      sessionStorage.setItem(FF_MOCK_DRAFT_STORAGE_KEY, JSON.stringify({ settings, picks }));
    } catch (e) {
      /* sessionStorage unavailable — draft just won't survive a tab switch */
    }
  }, [settings, picks]);

  const playersQuery = ffUseQuery("ff-players", ffGetFantasyRelevantPlayers);
  const valueSource = settings && settings.valueSource;
  const formatParams = valueSource && valueSource.kind === "builtin" ? FF_FORMAT_PARAMS[valueSource.format] : null;
  const tradeValuesQuery = ffUseQuery(
    formatParams ? `ff-trade-values-${formatParams.dynasty}-${formatParams.ppr}` : "ff-trade-values-none",
    () => (formatParams ? ffGetTradeValues(formatParams.dynasty, formatParams.ppr) : Promise.resolve({})),
    [formatParams && `${formatParams.dynasty}-${formatParams.ppr}`]
  );

  const players = playersQuery.data || [];
  const values = useMemo(() => {
    if (valueSource && valueSource.kind === "custom") {
      const set = (customRankings || {})[valueSource.name];
      return set ? set.entries : {};
    }
    return tradeValuesQuery.data || {};
  }, [valueSource, customRankings, tradeValuesQuery.data]);
  const playersById = useMemo(() => new Map(players.map((p) => [p.playerId, p])), [players]);

  const rounds = settings ? ffTotalRounds(settings.rosterSlots) : 0;
  const pickOrder = useMemo(() => (settings ? ffBuildPickOrder(settings.numTeams, rounds) : []), [settings, rounds]);

  const draftedIds = useMemo(() => new Set(picks.map((p) => p.playerId)), [picks]);
  const availablePlayers = useMemo(() => players.filter((p) => !draftedIds.has(p.playerId)), [players, draftedIds]);

  const currentPickIndex = picks.length;
  const currentPick = pickOrder[currentPickIndex];
  const draftLoaded = settings !== null && players.length > 0 && Object.keys(values).length > 0;
  const draftComplete = settings !== null && currentPickIndex >= pickOrder.length && pickOrder.length > 0;
  const isBotTurn = draftLoaded && currentPick && currentPick.teamIndex !== settings.userTeamIndex;

  const grades = useMemo(() => {
    if (!settings || !draftComplete) return [];
    return ffGradeDraft(picks, settings.numTeams, settings.rosterSlots, values, playersById);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings, draftComplete, picks, values, playersById]);

  function makePick(playerId) {
    if (!settings || !currentPick) return;
    const player = playersById.get(playerId);
    if (!player) return;
    const pickSlot = currentPick;
    const rosterSlots = settings.rosterSlots;
    setPicks((prev) => {
      const teamPicks = prev.filter((p) => p.teamIndex === pickSlot.teamIndex);
      const slot = ffSlotForManualPick(player, teamPicks, rosterSlots);
      return [...prev, { ...pickSlot, playerId, slot }];
    });
  }

  useEffect(() => {
    if (!isBotTurn || !settings) return;
    const teamPicks = picks.filter((p) => p.teamIndex === currentPick.teamIndex);
    const timer = setTimeout(() => {
      const result = ffChooseBestPick(availablePlayers, teamPicks, settings.rosterSlots, values, currentPick.round, playersById);
      if (result) makePick(result.player.playerId);
    }, FF_BOT_PICK_DELAY_MS);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isBotTurn, currentPickIndex]);

  function teamLabel(teamIndex) {
    if (settings && teamIndex === settings.userTeamIndex) return "You";
    return `Team ${teamIndex + 1}`;
  }

  function restart() {
    setSettings(null);
    setPicks([]);
    try {
      sessionStorage.removeItem(FF_MOCK_DRAFT_STORAGE_KEY);
    } catch (e) {
      /* ignore */
    }
  }

  if (!settings) {
    return (
      <div className="page">
        <div className="page-header">
          <h1>Mock Draft</h1>
        </div>
        <FFDraftSettingsForm onStart={setSettings} customRankings={customRankings} />
      </div>
    );
  }

  if (!draftLoaded) {
    return (
      <div className="page">
        <p>Loading player pool...</p>
      </div>
    );
  }

  if (draftComplete) {
    return (
      <div className="page page--wide">
        <div className="page-header">
          <h1>Draft Complete</h1>
          <button type="button" onClick={restart}>
            New Draft
          </button>
        </div>
        <FFDraftBoardGrid numTeams={settings.numTeams} rounds={rounds} picks={picks} currentPick={undefined} playersById={playersById} teamLabel={teamLabel} />

        <h2>Draft Grades</h2>
        <p className="data-source-note">Graded on value vs. pick slot — how each pick's rank compared to where it was taken, relative to the rest of this draft.</p>
        <div className="draft-grades-grid">
          {grades.map((grade) => (
            <div key={grade.teamIndex} className={`draft-grade-card draft-grade-card--${grade.letter[0]} ${grade.teamIndex === settings.userTeamIndex ? "draft-grade-card--you" : ""}`}>
              <div className="draft-grade-card__header">
                <span className="draft-grade-card__team">{teamLabel(grade.teamIndex)}</span>
                <span className="draft-grade-card__letter">{grade.letter}</span>
              </div>
              <p className="draft-grade-card__surplus">
                {grade.totalSurplus > 0 ? "+" : ""}
                {grade.totalSurplus} value vs. pick slot
              </p>
              {grade.bestPick && (
                <p className="draft-grade-card__line">
                  <strong>Best value:</strong> {grade.bestPick.player.name} (Rd {grade.bestPick.pick.round}) {grade.bestPick.surplus > 0 ? `+${grade.bestPick.surplus}` : grade.bestPick.surplus}
                </p>
              )}
              {grade.worstPick && (
                <p className="draft-grade-card__line">
                  <strong>Biggest reach:</strong> {grade.worstPick.player.name} (Rd {grade.worstPick.pick.round}) {grade.worstPick.surplus}
                </p>
              )}
              {grade.notes.length > 0 && (
                <ul className="draft-grade-card__notes">
                  {grade.notes.map((note) => (
                    <li key={note}>{note}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>

        <div className="draft-summary-grid">
          {Array.from({ length: settings.numTeams }, (_, teamIndex) => (
            <div key={teamIndex} className="draft-summary-team">
              <h2>{teamLabel(teamIndex)}</h2>
              <FFDraftRosterPanel picks={picks.filter((p) => p.teamIndex === teamIndex)} rosterSlots={settings.rosterSlots} playersById={playersById} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!currentPick) {
    return (
      <div className="page">
        <p className="error-text">Something went wrong setting up this draft (invalid settings). Please start over.</p>
        <button type="button" onClick={restart}>
          Start Over
        </button>
      </div>
    );
  }

  const userTeamPicks = picks.filter((p) => p.teamIndex === settings.userTeamIndex);

  return (
    <div className="page page--wide">
      <div className="page-header">
        <h1>Mock Draft</h1>
        <button type="button" onClick={restart}>
          Restart
        </button>
      </div>

      <div className="draft-clock">
        Pick {currentPick.round}.{String(currentPick.overallPick).padStart(3, "0")} — on the clock: <strong>{teamLabel(currentPick.teamIndex)}</strong>
      </div>

      <FFDraftBoardGrid numTeams={settings.numTeams} rounds={rounds} picks={picks} currentPick={currentPick} playersById={playersById} teamLabel={teamLabel} />

      <div className="draft-layout">
        <div>
          <h2>Your Roster</h2>
          <FFDraftRosterPanel picks={userTeamPicks} rosterSlots={settings.rosterSlots} playersById={playersById} />
          {!isBotTurn && (
            <div className="draft-pick-controls">
              <button
                type="button"
                onClick={() => {
                  const result = ffChooseBestPick(availablePlayers, userTeamPicks, settings.rosterSlots, values, currentPick.round, playersById);
                  if (result) makePick(result.player.playerId);
                }}
              >
                Draft Best Available
              </button>
            </div>
          )}
        </div>

        <div>
          <h2>Available Players</h2>
          <FFAvailablePlayersPanel players={availablePlayers} values={values} onDraft={makePick} canDraft={!isBotTurn} />
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------------------------------------------
   FANTASY TAB — Cheat Sheets
   Ported from CheatSheets.tsx + CheatSheetEditor.tsx. cheatSheets is a
   plain {id: CheatSheet} map in localStorage (see STORAGE_KEYS.fantasy
   CheatSheets) — no API layer needed, just direct state updates.
---------------------------------------------------------------------- */

const FF_CHEAT_SHEET_FORMAT_LABELS = { standard: "Standard", half: "Half PPR", full: "Full PPR", dynasty: "Dynasty" };

function ffEmptyCheatSheet(id) {
  return { id, name: "", scoringFormat: "full", numTeams: 12, notes: "", players: [], updatedAt: Date.now() };
}

function FFCheatSheetsPage({ cheatSheets, setCheatSheets }) {
  const sheets = Object.values(cheatSheets).sort((a, b) => b.updatedAt - a.updatedAt);

  function deleteSheet(id) {
    const next = { ...cheatSheets };
    delete next[id];
    setCheatSheets(next);
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1>Cheat Sheets</h1>
        <a href="#fantasy/cheat-sheets/new" className="button-link">
          + New Cheat Sheet
        </a>
      </div>
      <p className="data-source-note">Build a custom draft cheat sheet per league — rounds, notes, and live draft-day checkoffs.</p>

      {sheets.length === 0 && <p className="empty-state">No cheat sheets yet. Create one to get started.</p>}

      <div className="cheat-sheet-grid">
        {sheets.map((sheet) => (
          <div key={sheet.id} className="cheat-sheet-card">
            <a href={`#fantasy/cheat-sheets/${sheet.id}`} className="cheat-sheet-card__body">
              <h3>{sheet.name || "Untitled Cheat Sheet"}</h3>
              <p className="cheat-sheet-card__meta">
                {sheet.numTeams}-team &middot; {FF_CHEAT_SHEET_FORMAT_LABELS[sheet.scoringFormat]} &middot; {sheet.players.length} players
              </p>
            </a>
            <button
              type="button"
              className="cheat-sheet-card__delete"
              onClick={() => {
                if (confirm(`Delete "${sheet.name || "Untitled Cheat Sheet"}"?`)) {
                  deleteSheet(sheet.id);
                }
              }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function FFCheatSheetEditorPage({ sheetId, cheatSheets, setCheatSheets }) {
  const playersQuery = ffUseQuery("ff-players", ffGetFantasyRelevantPlayers);
  const sheet = cheatSheets[sheetId] || ffEmptyCheatSheet(sheetId);

  const format = sheet.scoringFormat;
  const { dynasty, ppr } = FF_FORMAT_PARAMS[format];
  const tradeValuesQuery = ffUseQuery(`ff-trade-values-${dynasty}-${ppr}`, () => ffGetTradeValues(dynasty, ppr), [dynasty, ppr]);
  const values = tradeValuesQuery.data || {};

  function updateSheet(patch) {
    setCheatSheets({ ...cheatSheets, [sheetId]: { ...sheet, ...patch, updatedAt: Date.now() } });
  }
  function updatePlayerEntry(playerId, patch) {
    updateSheet({ players: sheet.players.map((p) => (p.playerId === playerId ? { ...p, ...patch } : p)) });
  }
  function addPlayer(playerId) {
    updateSheet({ players: [...sheet.players, { playerId, round: null, note: "", drafted: false }] });
  }
  function removePlayer(playerId) {
    updateSheet({ players: sheet.players.filter((p) => p.playerId !== playerId) });
  }

  const players = playersQuery.data || [];
  const playersById = useMemo(() => new Map(players.map((p) => [p.playerId, p])), [players]);
  const excludeIds = new Set(sheet.players.map((p) => p.playerId));

  const sortedPlayers = [...sheet.players].sort((a, b) => {
    const roundA = a.round ?? Infinity;
    const roundB = b.round ?? Infinity;
    if (roundA !== roundB) return roundA - roundB;
    const rankA = values[a.playerId] ? values[a.playerId].overallRank : Infinity;
    const rankB = values[b.playerId] ? values[b.playerId].overallRank : Infinity;
    return rankA - rankB;
  });

  return (
    <div className="page page--wide">
      <a href="#fantasy/cheat-sheets" className="back-link">
        &larr; All cheat sheets
      </a>

      <div className="page-header">
        <input
          type="text"
          className="cheat-sheet-editor__name"
          placeholder="Cheat sheet name (e.g. The Sopranos — 2026 Draft)"
          value={sheet.name}
          onChange={(e) => updateSheet({ name: e.target.value })}
        />
      </div>

      <div className="filter-bar">
        <select value={sheet.scoringFormat} onChange={(e) => updateSheet({ scoringFormat: e.target.value })}>
          <option value="standard">Standard</option>
          <option value="half">Half PPR</option>
          <option value="full">Full PPR</option>
          <option value="dynasty">Dynasty</option>
        </select>
        <label className="cheat-sheet-editor__teams-field">
          <input type="number" min={4} max={20} value={sheet.numTeams} onChange={(e) => updateSheet({ numTeams: Number(e.target.value) || sheet.numTeams })} />
          teams
        </label>
      </div>

      <textarea
        className="cheat-sheet-editor__notes"
        rows={3}
        placeholder="General draft notes — strategy, sleepers, players to avoid..."
        value={sheet.notes}
        onChange={(e) => updateSheet({ notes: e.target.value })}
      />

      <h2>Add Players</h2>
      <FFPlayerSearchAdd candidates={players} excludeIds={excludeIds} onAdd={(p) => addPlayer(p.playerId)} />

      <h2>Draft Board</h2>
      {sortedPlayers.length === 0 ? (
        <p className="empty-state">Search above to add players to your cheat sheet.</p>
      ) : (
        <div className="cheat-sheet-list">
          {sortedPlayers.map((entry) => {
            const player = playersById.get(entry.playerId);
            if (!player) return null;
            const value = values[entry.playerId];
            return (
              <div key={entry.playerId} className={`cheat-sheet-row ${entry.drafted ? "cheat-sheet-row--drafted" : ""}`}>
                <input
                  type="number"
                  className="cheat-sheet-row__round"
                  placeholder="Rd"
                  min={1}
                  value={entry.round ?? ""}
                  onChange={(e) => updatePlayerEntry(entry.playerId, { round: e.target.value === "" ? null : Number(e.target.value) })}
                />
                <FFPlayerAvatar playerId={player.playerId} name={player.name} position={player.position} team={player.team} size="sm" />
                <a href={`#fantasy/players/${player.playerId}`} className="cheat-sheet-row__name">
                  {player.name}
                </a>
                <FFPositionBadge position={player.position} />
                <FFTeamTag team={player.team} />
                <span className="cheat-sheet-row__rank">{value ? `#${value.overallRank}` : "—"}</span>
                <input type="text" className="cheat-sheet-row__note" placeholder="Note..." value={entry.note} onChange={(e) => updatePlayerEntry(entry.playerId, { note: e.target.value })} />
                <label className="cheat-sheet-row__drafted-toggle">
                  <input type="checkbox" checked={entry.drafted} onChange={(e) => updatePlayerEntry(entry.playerId, { drafted: e.target.checked })} />
                  Drafted
                </label>
                <button type="button" className="trade-side__remove" onClick={() => removePlayer(entry.playerId)}>
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------
   FANTASY TAB — Import Rankings
   Ported from ImportRankings.tsx + parseRankingImport.ts. customRankings
   is a plain {name: {entries, createdAt}} map in localStorage.
---------------------------------------------------------------------- */

function ffParseRankingList(text, players) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
  const matched = [];
  const ambiguous = [];
  const unmatched = [];

  lines.forEach((line, lineIndex) => {
    const lower = line.toLowerCase();
    const candidates = players.filter((p) => lower.includes(p.name.toLowerCase()));
    if (candidates.length === 0) {
      unmatched.push({ line, lineIndex });
      return;
    }
    if (candidates.length === 1) {
      matched.push({ line, lineIndex, player: candidates[0] });
      return;
    }
    const byTeam = candidates.filter((p) => p.team && lower.includes(p.team.toLowerCase()));
    if (byTeam.length === 1) {
      matched.push({ line, lineIndex, player: byTeam[0] });
    } else {
      ambiguous.push({ line, lineIndex, candidates });
    }
  });

  return { matched, ambiguous, unmatched };
}

function ffBuildValueEntries(resolvedMatches) {
  const ordered = [...resolvedMatches].sort((a, b) => a.lineIndex - b.lineIndex);
  const positionCounts = {};
  const entries = {};
  ordered.forEach(({ player }, index) => {
    const positionRank = (positionCounts[player.position] || 0) + 1;
    positionCounts[player.position] = positionRank;
    entries[player.playerId] = { sleeperId: player.playerId, value: (ordered.length - index) * 10, overallRank: index + 1, positionRank, trend30Day: 0 };
  });
  return entries;
}

const FF_IMPORT_POSITION_FILTERS = ["ALL", "QB", "RB", "WR", "TE", "K", "DEF"];

function FFImportRankingsPage({ customRankings, setCustomRankings }) {
  const playersQuery = ffUseQuery("ff-players", ffGetFantasyRelevantPlayers);
  const players = playersQuery.data || [];
  const playersById = useMemo(() => new Map(players.map((p) => [p.playerId, p])), [players]);

  const [name, setName] = useState("");
  const [rawText, setRawText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [resolved, setResolved] = useState(new Map());
  const [skipped, setSkipped] = useState(new Set());

  const [viewingSetName, setViewingSetName] = useState(null);
  const [positionFilter, setPositionFilter] = useState("ALL");

  function handlePreview() {
    if (players.length === 0) return;
    setParsed(ffParseRankingList(rawText, players));
    setResolved(new Map());
    setSkipped(new Set());
  }
  function resolveLine(lineIndex, player) {
    setResolved((prev) => new Map(prev).set(lineIndex, { lineIndex, player }));
  }
  function skipLine(lineIndex) {
    setSkipped((prev) => new Set(prev).add(lineIndex));
  }

  const finalMatches = useMemo(() => {
    if (!parsed) return [];
    const all = [...parsed.matched.map((m) => ({ lineIndex: m.lineIndex, player: m.player })), ...Array.from(resolved.values())];
    return all.filter((entry) => !skipped.has(entry.lineIndex)).sort((a, b) => a.lineIndex - b.lineIndex);
  }, [parsed, resolved, skipped]);

  const pendingAmbiguous = (parsed ? parsed.ambiguous : []).filter((line) => !resolved.has(line.lineIndex) && !skipped.has(line.lineIndex));
  const pendingUnmatched = (parsed ? parsed.unmatched : []).filter((line) => !resolved.has(line.lineIndex) && !skipped.has(line.lineIndex));
  const matchedIds = new Set(finalMatches.map((m) => m.player.playerId));

  function handleSave() {
    if (!name.trim() || finalMatches.length === 0) return;
    setCustomRankings({ ...customRankings, [name.trim()]: { name: name.trim(), entries: ffBuildValueEntries(finalMatches), createdAt: Date.now() } });
  }
  function handleDelete(setName) {
    const next = { ...customRankings };
    delete next[setName];
    setCustomRankings(next);
    if (viewingSetName === setName) setViewingSetName(null);
  }

  const viewingSet = viewingSetName ? customRankings[viewingSetName] : undefined;
  const viewingRows = useMemo(() => {
    if (!viewingSet) return [];
    const rows = Object.entries(viewingSet.entries)
      .map(([playerId, entry]) => ({ entry, player: playersById.get(playerId) }))
      .filter((row) => !!row.player)
      .sort((a, b) => a.entry.overallRank - b.entry.overallRank);
    return positionFilter === "ALL" ? rows : rows.filter((row) => row.player.position === positionFilter);
  }, [viewingSet, playersById, positionFilter]);

  return (
    <div className="page">
      <div className="page-header">
        <h1>Import Rankings</h1>
      </div>
      <p className="empty-state">
        Paste a ranked player list from any site or expert — one player per line, in rank order. We'll match each line to a player in our database so you can draft off of it in Mock Draft. This
        is a manual, one-time import — paste a fresh list whenever you want to refresh it.
      </p>

      <div className="import-rankings__form">
        <label>
          <span className="import-rankings__step">1</span> Ranking set name
          <input type="text" placeholder="e.g. Expert Redraft Big Board" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label>
          <span className="import-rankings__step">2</span> Paste your list
          <textarea rows={12} placeholder={"1. Ja'Marr Chase WR CIN\n2. Bijan Robinson RB ATL\n3. ..."} value={rawText} onChange={(e) => setRawText(e.target.value)} />
        </label>
        <button type="button" onClick={handlePreview} disabled={rawText.trim().length === 0}>
          Preview
        </button>
      </div>

      {parsed && (
        <div className="import-rankings__review">
          <h2>Review</h2>
          <p className="empty-state">
            {finalMatches.length} matched &middot; {pendingAmbiguous.length} need disambiguation &middot; {pendingUnmatched.length} unmatched
          </p>

          {pendingAmbiguous.length > 0 && (
            <div className="import-rankings__section">
              <h3>Multiple matches — pick the right player</h3>
              {pendingAmbiguous.map((line) => (
                <div key={line.lineIndex} className="import-rankings__line">
                  <span className="import-rankings__line-text">{line.line}</span>
                  <select
                    defaultValue=""
                    onChange={(e) => {
                      const player = line.candidates.find((c) => c.playerId === e.target.value);
                      if (player) resolveLine(line.lineIndex, player);
                    }}
                  >
                    <option value="" disabled>
                      Choose player...
                    </option>
                    {line.candidates.map((c) => (
                      <option key={c.playerId} value={c.playerId}>
                        {c.name} ({c.position} - {c.team})
                      </option>
                    ))}
                  </select>
                  <button type="button" onClick={() => skipLine(line.lineIndex)}>
                    Skip
                  </button>
                </div>
              ))}
            </div>
          )}

          {pendingUnmatched.length > 0 && (
            <div className="import-rankings__section">
              <h3>No match — search to assign</h3>
              {pendingUnmatched.map((line) => (
                <div key={line.lineIndex} className="import-rankings__line">
                  <span className="import-rankings__line-text">{line.line}</span>
                  <div className="import-rankings__search">
                    <FFPlayerSearchAdd candidates={players} excludeIds={matchedIds} onAdd={(player) => resolveLine(line.lineIndex, player)} placeholder="Search players..." />
                  </div>
                  <button type="button" onClick={() => skipLine(line.lineIndex)}>
                    Skip
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="import-rankings__save">
            <button type="button" onClick={handleSave} disabled={!name.trim() || finalMatches.length === 0}>
              Save Ranking Set
            </button>
            {customRankings[name.trim()] && <p className="success-text">Saved. Select "{name}" as a scoring format next time you set up a Mock Draft.</p>}
          </div>
        </div>
      )}

      {Object.keys(customRankings).length > 0 && (
        <div className="import-rankings__saved">
          <h2>Saved Ranking Sets</h2>
          <div className="ranking-set-grid">
            {Object.values(customRankings).map((set) => {
              const entries = Object.entries(set.entries);
              const positionCounts = {};
              for (const [playerId] of entries) {
                const pos = playersById.get(playerId) ? playersById.get(playerId).position : "UNK";
                positionCounts[pos] = (positionCounts[pos] || 0) + 1;
              }
              return (
                <button
                  key={set.name}
                  type="button"
                  className={`ranking-set-card ${viewingSetName === set.name ? "ranking-set-card--active" : ""}`}
                  onClick={() => setViewingSetName(viewingSetName === set.name ? null : set.name)}
                >
                  <span className="ranking-set-card__name">{set.name}</span>
                  <span className="ranking-set-card__count">{entries.length} players</span>
                  <div className="ranking-set-card__bar">
                    {Object.entries(positionCounts).map(([pos, count]) => (
                      <span key={pos} className={`ranking-set-card__bar-segment ranking-set-card__bar-segment--${pos}`} style={{ width: `${(count / entries.length) * 100}%` }} title={`${pos}: ${count}`} />
                    ))}
                  </div>
                </button>
              );
            })}
          </div>

          {viewingSet && (
            <div className="ranking-set-viewer">
              <div className="ranking-set-viewer__header">
                <h3>{viewingSetName}</h3>
                <div className="ranking-set-viewer__actions">
                  <div className="ranking-set-viewer__filters">
                    {FF_IMPORT_POSITION_FILTERS.map((pos) => (
                      <button key={pos} type="button" className={`ranking-set-filter-chip ${positionFilter === pos ? "ranking-set-filter-chip--active" : ""}`} onClick={() => setPositionFilter(pos)}>
                        {pos === "ALL" ? "All" : pos}
                      </button>
                    ))}
                  </div>
                  <button type="button" className="ranking-set-viewer__delete" onClick={() => handleDelete(viewingSetName)}>
                    Delete Set
                  </button>
                </div>
              </div>

              <div className="ranking-set-list">
                {viewingRows.length === 0 && <p className="empty-state">No players at this position.</p>}
                {viewingRows.map(({ entry, player }) => (
                  <a key={player.playerId} href={`#fantasy/players/${player.playerId}`} className="ranking-set-row">
                    <span className={`ranking-set-row__rank ${ffMedalClass(entry.overallRank)}`}>#{entry.overallRank}</span>
                    <FFPlayerAvatar playerId={player.playerId} name={player.name} position={player.position} team={player.team} size="sm" />
                    <span className="ranking-set-row__name">{player.name}</span>
                    <FFPositionBadge position={player.position} />
                    <FFTeamTag team={player.team} />
                    <span className="ranking-set-row__pos-rank">Pos #{entry.positionRank}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------
   FANTASY TAB — League linking (Onboarding) + League Detail
   Ported from Onboarding.tsx and LeagueDetail.tsx + StandingsTable/
   RosterTable/LeagueSettingsSummary/TransactionsFeed. Sleeper needs no
   credentials (findUserByUsername + getLeaguesForUser, already in the data
   layer) — linked league IDs/username live in fantasySleeper (localStorage).
   Yahoo needs the OAuth backend from netlify/functions/yahoo-*.js — linked
   league keys live in fantasyYahoo (localStorage), but the tokens themselves
   never leave the server, so every Yahoo league READ also goes through the
   backend (ffGetYahooLeagueDetail etc.), not just the initial connect.
---------------------------------------------------------------------- */

async function ffPreviewSleeperLeagues(username) {
  const user = await ffFindUserByUsername(username);
  const leagues = await ffGetLeaguesForUser(user.user_id);
  return { userId: user.user_id, leagues };
}

function FFOnboardingPage({ sleeper, setSleeper, yahoo, setYahoo }) {
  const [username, setUsername] = useState("");
  const [lookupUsername, setLookupUsername] = useState(null);
  const [selectedSleeperIds, setSelectedSleeperIds] = useState(new Set());
  const [selectedYahooKeys, setSelectedYahooKeys] = useState(new Set());
  const [linkError, setLinkError] = useState(null);
  const [justAdded, setJustAdded] = useState(false);

  const sleeperPreviewQuery = ffUseQuery(
    lookupUsername ? `ff-sleeper-preview-${lookupUsername}` : "ff-sleeper-preview-none",
    () => (lookupUsername ? ffPreviewSleeperLeagues(lookupUsername) : Promise.resolve(null)),
    [lookupUsername]
  );

  const yahooStatusQuery = ffUseQuery("ff-yahoo-status", ffGetYahooStatus);
  const yahooConnected = Boolean(yahooStatusQuery.data && yahooStatusQuery.data.connected);
  const yahooPreviewQuery = ffUseQuery(
    yahooConnected ? "ff-yahoo-preview" : "ff-yahoo-preview-none",
    () => (yahooConnected ? ffGetYahooPreview() : Promise.resolve(null)),
    [yahooConnected]
  );

  function toggle(set, setSet, id) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSet(next);
  }

  function handleFinish() {
    setLinkError(null);
    try {
      if (lookupUsername && selectedSleeperIds.size > 0) {
        const userId = (sleeperPreviewQuery.data && sleeperPreviewQuery.data.userId) || sleeper.userId;
        const merged = [...new Set([...(sleeper.linkedLeagueIds || []), ...selectedSleeperIds])];
        setSleeper({ username: lookupUsername, userId, linkedLeagueIds: merged });
      }
      if (selectedYahooKeys.size > 0) {
        const merged = [...new Set([...(yahoo.linkedLeagueKeys || []), ...selectedYahooKeys])];
        setYahoo({ linkedLeagueKeys: merged });
      }
      setSelectedSleeperIds(new Set());
      setSelectedYahooKeys(new Set());
      setJustAdded(true);
    } catch (err) {
      setLinkError(err.message);
    }
  }

  const hasSelections = selectedSleeperIds.size > 0 || selectedYahooKeys.size > 0;

  return (
    <div className="page">
      <div className="page-header">
        <h1>Connect your leagues</h1>
      </div>

      <section className="onboarding-section onboarding-section--sleeper">
        <h2>Sleeper</h2>
        {sleeper && sleeper.username && (
          <p className="data-source-note">
            Already connected as <strong>{sleeper.username}</strong> &middot; {(sleeper.linkedLeagueIds || []).length} league(s) linked. Search another username below to add more.
          </p>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLookupUsername(username.trim());
          }}
        >
          <input type="text" placeholder="Sleeper username" value={username} onChange={(e) => setUsername(e.target.value)} />
          <button type="submit">Find leagues</button>
        </form>

        {sleeperPreviewQuery.isLoading && lookupUsername && <p>Looking up leagues...</p>}
        {sleeperPreviewQuery.isError && <p className="error-text">{sleeperPreviewQuery.error && sleeperPreviewQuery.error.message}</p>}
        {sleeperPreviewQuery.data && (
          <ul className="checklist">
            {sleeperPreviewQuery.data.leagues.map((league) => (
              <li key={league.league_id}>
                <label>
                  <input type="checkbox" checked={selectedSleeperIds.has(league.league_id)} onChange={() => toggle(selectedSleeperIds, setSelectedSleeperIds, league.league_id)} />
                  {league.name} ({league.season})
                </label>
              </li>
            ))}
            {sleeperPreviewQuery.data.leagues.length === 0 && <li>No leagues found for this username.</li>}
          </ul>
        )}
      </section>

      <section className="onboarding-section onboarding-section--yahoo">
        <h2>Yahoo</h2>
        {!yahooConnected && (
          <a className="button-link" href={FF_YAHOO_CONNECT_URL}>
            Connect Yahoo
          </a>
        )}
        {yahooConnected && (yahoo.linkedLeagueKeys || []).length > 0 && (
          <p className="data-source-note">{yahoo.linkedLeagueKeys.length} league(s) linked already.</p>
        )}
        {yahooConnected && yahooPreviewQuery.data && (
          <ul className="checklist">
            {yahooPreviewQuery.data.leagues.map((league) => (
              <li key={league.league_key}>
                <label>
                  <input type="checkbox" checked={selectedYahooKeys.has(league.league_key)} onChange={() => toggle(selectedYahooKeys, setSelectedYahooKeys, league.league_key)} />
                  {league.name} ({league.season})
                </label>
              </li>
            ))}
            {yahooPreviewQuery.data.leagues.length === 0 && <li>No leagues found on this Yahoo account.</li>}
          </ul>
        )}
        {yahooConnected && yahooPreviewQuery.isError && <p className="error-text">{yahooPreviewQuery.error && yahooPreviewQuery.error.message}</p>}
      </section>

      {linkError && <p className="error-text">{linkError}</p>}
      {justAdded && !hasSelections && <p className="success-text">Added. Check the Dashboard to see your leagues.</p>}
      <button disabled={!hasSelections} onClick={handleFinish}>
        Add selected leagues to dashboard
      </button>
    </div>
  );
}

function FFStandingsTable({ standings }) {
  if (standings.length === 0) {
    return <p className="empty-state">No standings data available.</p>;
  }
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>#</th>
          <th>Team</th>
          <th>Record</th>
          <th>PF</th>
          <th>PA</th>
        </tr>
      </thead>
      <tbody>
        {standings.map((team) => (
          <tr key={team.teamId}>
            <td>{team.rank}</td>
            <td>{team.teamName}</td>
            <td>
              {team.record.wins}-{team.record.losses}
              {team.record.ties > 0 ? `-${team.record.ties}` : ""}
            </td>
            <td>{team.pointsFor.toFixed(1)}</td>
            <td>{team.pointsAgainst.toFixed(1)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FFRosterTable({ roster }) {
  if (!roster || roster.length === 0) {
    return (
      <p className="empty-state">
        No roster yet — this league likely hasn't drafted. Try a <a href="#fantasy/mock-draft">mock draft</a> while you wait.
      </p>
    );
  }
  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Player</th>
          <th>Pos</th>
          <th>Team</th>
          <th>Bye</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {roster.map((player) => (
          <tr key={player.playerId}>
            <td>
              <a href={`#fantasy/players/${player.playerId}`} className="table-player-link">
                <FFPlayerAvatar playerId={player.playerId} name={player.name} position={player.position} team={player.team} size="sm" />
                <span>{player.name}</span>
              </a>
            </td>
            <td><FFPositionBadge position={player.position} /></td>
            <td>{player.team || "FA"}</td>
            <td>{ffByeWeekFor(player.team) ?? "—"}</td>
            <td>{player.injuryStatus ? <span className="injury-badge">{player.injuryStatus}</span> : "Healthy"}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function FFLeagueSettingsSummary({ settings }) {
  return (
    <div className="ranking-cards">
      <div className="ranking-card">
        <span className="ranking-card__label">Scoring</span>
        <span className="ranking-card__value">{settings.scoringType}</span>
      </div>
      <div className="ranking-card">
        <span className="ranking-card__label">Teams</span>
        <span className="ranking-card__value">{settings.totalRosters}</span>
      </div>
      <div className="ranking-card">
        <span className="ranking-card__label">Playoff Teams</span>
        <span className="ranking-card__value">{settings.playoffTeams ?? "—"}</span>
      </div>
      {settings.rosterPositions.length > 0 && (
        <div className="ranking-card">
          <span className="ranking-card__label">Roster</span>
          <span className="ranking-card__value league-settings__positions">
            {settings.rosterPositions.map((pos, i) => (
              <FFPositionBadge key={`${pos}-${i}`} position={pos} />
            ))}
          </span>
        </div>
      )}
    </div>
  );
}

const FF_TX_TYPE_LABELS = { trade: "Trade", waiver: "Waiver Claim", free_agent: "Free Agent Move" };
function ffFormatTxDate(ms) {
  return new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
function FFTransactionsFeed({ transactions }) {
  if (transactions.length === 0) {
    return <p className="empty-state">No recent league activity.</p>;
  }
  return (
    <ul className="transactions-feed">
      {transactions.map((tx) => (
        <li key={tx.id} className="transactions-feed__row">
          <span className="transactions-feed__type">{FF_TX_TYPE_LABELS[tx.type] || tx.type}</span>
          <div className="transactions-feed__body">
            {tx.adds.map((ref) => (
              <p key={`add-${ref.playerId}`}>
                <strong>{ref.teamName}</strong> added {ref.playerName}
              </p>
            ))}
            {tx.drops.map((ref) => (
              <p key={`drop-${ref.playerId}`}>
                <strong>{ref.teamName}</strong> dropped {ref.playerName}
              </p>
            ))}
          </div>
          <span className="transactions-feed__date">{ffFormatTxDate(tx.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}

function FFLeagueDetailPage({ platform, leagueId, sleeper }) {
  const detailQuery = ffUseQuery(`ff-league-${platform}-${leagueId}`, () => ffGetLeagueDetailByPlatform(platform, leagueId, sleeper.userId), [platform, leagueId]);
  const transactionsQuery = ffUseQuery(
    `ff-league-tx-${platform}-${leagueId}`,
    () => (platform === "sleeper" ? ffGetLeagueTransactions(leagueId) : Promise.resolve([])),
    [platform, leagueId]
  );
  const draftQuery = ffUseQuery(
    `ff-league-draft-${platform}-${leagueId}`,
    () => (platform === "sleeper" ? ffGetLeagueDraft(leagueId) : Promise.resolve({ status: "not_started", numTeams: 0, rounds: 0, picks: [] })),
    [platform, leagueId]
  );

  const [selectedTeamId, setSelectedTeamId] = useState("");
  const data = detailQuery.data;

  return (
    <div className="page">
      <a href="#fantasy" className="back-link">
        &larr; Back to dashboard
      </a>

      {detailQuery.isLoading && <p>Loading league...</p>}
      {detailQuery.isError && <p className="error-text">{detailQuery.error && detailQuery.error.message}</p>}

      {data && (
        <>
          <div className="page-header">
            <h1>
              {data.name} <FFPlatformBadge platform={data.platform} />
            </h1>
          </div>

          <div className="filter-bar">
            <a href="#fantasy/trade-analyzer" className="back-link">
              Analyze a trade for this league &rarr;
            </a>
            <a href="#fantasy/waiver-wire" className="back-link">
              Check the waiver wire &rarr;
            </a>
          </div>

          {data.currentMatchup && (
            <section>
              <h2>Week {data.currentMatchup.week} Matchup</h2>
              <div className="matchup-card">
                <div className={`matchup-card__team ${data.currentMatchup.myScore >= data.currentMatchup.opponentScore ? "matchup-card__team--leading" : ""}`}>
                  <span className="matchup-card__name">{data.myTeam.teamName}</span>
                  <span className="matchup-card__score">{data.currentMatchup.myScore.toFixed(1)}</span>
                </div>
                <span className="matchup-card__vs">VS</span>
                <div className={`matchup-card__team ${data.currentMatchup.opponentScore > data.currentMatchup.myScore ? "matchup-card__team--leading" : ""}`}>
                  <span className="matchup-card__name">{data.currentMatchup.opponentTeamName}</span>
                  <span className="matchup-card__score">{data.currentMatchup.opponentScore.toFixed(1)}</span>
                </div>
              </div>
            </section>
          )}

          <section>
            <h2>League Settings</h2>
            <FFLeagueSettingsSummary settings={data.settings} />
          </section>

          <section>
            <h2>Rosters</h2>
            <div className="filter-bar">
              <select value={selectedTeamId || data.myTeam.teamId} onChange={(e) => setSelectedTeamId(e.target.value)}>
                {data.teams.map((team) => (
                  <option key={team.teamId} value={team.teamId}>
                    {team.teamId === data.myTeam.teamId ? `${team.teamName} (Me)` : team.teamName}
                  </option>
                ))}
              </select>
            </div>
            <FFRosterTable roster={(data.teams.find((t) => t.teamId === (selectedTeamId || data.myTeam.teamId)) || {}).roster || data.myTeam.roster} />
          </section>

          <section>
            <h2>Standings</h2>
            <FFStandingsTable standings={data.standings} />
          </section>

          <section>
            <h2>Draft Recap</h2>
            {draftQuery.data && draftQuery.data.picks.length > 0 ? (
              <FFDraftBoardGrid
                numTeams={draftQuery.data.numTeams}
                rounds={draftQuery.data.rounds}
                picks={draftQuery.data.picks}
                currentPick={undefined}
                playersById={new Map(draftQuery.data.picks.map((p) => [p.playerId, { name: p.playerName, position: p.playerPosition }]))}
                teamLabel={(teamIndex) => {
                  const pick = draftQuery.data.picks.find((p) => p.teamIndex === teamIndex);
                  return pick ? pick.teamName : `Team ${teamIndex + 1}`;
                }}
              />
            ) : (
              <p className="empty-state">{data.platform === "yahoo" ? "Draft recap isn't available for Yahoo leagues yet." : "This league hasn't drafted yet."}</p>
            )}
          </section>

          <section>
            <h2>Recent Activity</h2>
            <FFTransactionsFeed transactions={transactionsQuery.data || []} />
          </section>
        </>
      )}
    </div>
  );
}

function FFPage({ theme, cheatSheets, setCheatSheets, customRankings, setCustomRankings, watchlist, setWatchlist, sleeper, setSleeper, yahoo, setYahoo }) {
  const [segments, navigateFF] = useFantasySubRoute();
  const sub = segments[0] || "";

  // "cheat-sheets/new" mints a real id and redirects, same as the original
  // app's crypto.randomUUID()-then-navigate — a bookmarked/shared URL always
  // points at a real sheet, never at the literal word "new".
  useEffect(() => {
    if (sub === "cheat-sheets" && segments[1] === "new") {
      navigateFF(`cheat-sheets/${crypto.randomUUID()}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sub, segments[1]]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
      <div>
        <div
          style={{
            color: theme.sectionLabelColor,
            fontSize: "12px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            textTransform: "uppercase",
            marginBottom: "6px",
          }}
        >
          Fantasy Football
        </div>
        <h1 style={{ margin: 0, fontSize: "24px", fontWeight: theme.headerWeight, color: theme.text }}>The War Room</h1>
      </div>

      <FFSubNav theme={theme} active={sub} onNavigate={navigateFF} />

      <FFShadowRoot theme={theme}>
        {sub === "" && <FFDashboard watchlist={watchlist} setWatchlist={setWatchlist} sleeper={sleeper} yahoo={yahoo} />}
        {sub === "players" && segments[1] && <FFPlayerProfilePage playerId={segments[1]} watchlist={watchlist} setWatchlist={setWatchlist} />}
        {sub === "players" && !segments[1] && <FFPlayersPage watchlist={watchlist} setWatchlist={setWatchlist} />}
        {sub === "compare" && <FFPlayerComparisonPage />}
        {sub === "waiver-wire" && <FFWaiverWirePage watchlist={watchlist} setWatchlist={setWatchlist} />}
        {sub === "trade-analyzer" && <FFTradeAnalyzerPage />}
        {sub === "mock-draft" && <FFMockDraftPage customRankings={customRankings} />}
        {sub === "cheat-sheets" && !segments[1] && <FFCheatSheetsPage cheatSheets={cheatSheets} setCheatSheets={setCheatSheets} />}
        {sub === "cheat-sheets" && segments[1] && segments[1] !== "new" && (
          <FFCheatSheetEditorPage sheetId={segments[1]} cheatSheets={cheatSheets} setCheatSheets={setCheatSheets} />
        )}
        {sub === "import-rankings" && <FFImportRankingsPage customRankings={customRankings} setCustomRankings={setCustomRankings} />}
        {sub === "onboarding" && <FFOnboardingPage sleeper={sleeper} setSleeper={setSleeper} yahoo={yahoo} setYahoo={setYahoo} />}
        {sub === "leagues" && segments[1] && segments[2] && <FFLeagueDetailPage platform={segments[1]} leagueId={segments[2]} sleeper={sleeper} />}
      </FFShadowRoot>
    </div>
  );
}

window.__vChunks.fantasy = { FFPage };
