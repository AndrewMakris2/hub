// Raven's Eye chunk — compiled separately by build.js and lazy-loaded
// via loadChunk("ravenseye", ...) only when the user actually opens the
// Raven's Eye page, instead of shipping with every page load. See app.jsx
// for the loadChunk()/window.__v bridge this depends on.
const { useState, useEffect, useMemo, useRef } = React;
const {
  loadPdfJs, moDownload, vantageIsDarkTheme, IconRavenEye,
  RAVEN_THREAT_MODEL_STATUS, RAVEN_PENTEST_STATUS, RAVEN_FINDING_STATUS, RAVEN_SEVERITY,
  ravenEmptyThreatModel, ravenEmptyPenTest, ravenLoadPdfMake,
} = window.__v;

/* ----------------------------------------------------------------------
   RAVEN'S EYE — pentest / threat-model tracking dashboard
   Ported from a separate app (repo: CorroDash, package name "corrodash"),
   which tracked real internal findings via a dev-only Vite middleware that
   read/wrote a JSON file on disk. That backend doesn't exist here, so all
   reads/writes below are plain usePersistentState + IndexedDB, and the tab
   ships with zero seeded products — CorroDash's real data stays in that
   repo and never gets copied into this one (both are public repos).
   Every ported identifier is prefixed Raven/raven/RAVEN_ to avoid collisions.
---------------------------------------------------------------------- */

const RAVEN_CSS = `
:host {
  color-scheme: dark;
  --page-bg: #08070b;
  --surface: #16141d;
  --surface-raised: #1d1a26;
  --text-primary: #ffffff;
  --text-secondary: #c6c2d4;
  --text-muted: #8b869a;
  --border: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.16);
  --gridline: #221f2c;
  --baseline: #3c3750;
  --status-info: #3987e5;
  --accent: #a855f7;
  --accent-strong: #c084fc;
  --accent-soft: rgba(168, 85, 247, 0.16);
  --shadow-card: 0 1px 0 rgba(255, 255, 255, 0.02) inset, 0 8px 24px -16px rgba(0, 0, 0, 0.6);
  --shadow-card-hover: 0 1px 0 rgba(255, 255, 255, 0.03) inset, 0 12px 28px -14px rgba(0, 0, 0, 0.65);
  --scrollbar-thumb: rgba(255, 255, 255, 0.16);
  --scrollbar-thumb-hover: rgba(255, 255, 255, 0.28);
  --status-good: #0ca30c;
  --status-warning: #fab219;
  --status-serious: #ec835a;
  --status-critical: #d03b3b;
  --status-muted: #8b869a;
  --radius-sm: 6px;
  --radius-md: 10px;
  --radius-lg: 14px;
  --radius-pill: 999px;
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 24px;
  --space-6: 32px;
  --space-7: 48px;
  --font-sans:
    system-ui, -apple-system, 'Segoe UI', sans-serif;
  --shadow-focus: 0 0 0 3px var(--accent-soft);
  --theme-transition: background-color 0.45s ease, color 0.45s ease, border-color 0.45s ease,
    box-shadow 0.45s ease, fill 0.45s ease;
}

:host([data-theme=light]) {
  color-scheme: light;
  --page-bg: #f7f6f9;
  --surface: #ffffff;
  --surface-raised: #ffffff;
  --text-primary: #100e17;
  --text-secondary: #55516a;
  --text-muted: #8a8598;
  --border: rgba(16, 14, 23, 0.1);
  --border-strong: rgba(16, 14, 23, 0.18);
  --gridline: #e6e3ed;
  --baseline: #c9c4d6;
  --status-info: #2a78d6;
  --accent: #7c3aed;
  --accent-strong: #6d28d9;
  --accent-soft: rgba(124, 58, 237, 0.1);
  --shadow-card: 0 1px 2px rgba(11, 11, 11, 0.03), 0 6px 20px -16px rgba(11, 11, 11, 0.14);
  --shadow-card-hover: 0 2px 4px rgba(11, 11, 11, 0.04), 0 10px 24px -14px rgba(11, 11, 11, 0.18);
  --scrollbar-thumb: rgba(11, 11, 11, 0.16);
  --scrollbar-thumb-hover: rgba(11, 11, 11, 0.28);
}

:host([data-theme=dark]) {
  color-scheme: dark;
  --page-bg: #08070b;
  --surface: #16141d;
  --surface-raised: #1d1a26;
  --text-primary: #ffffff;
  --text-secondary: #c6c2d4;
  --text-muted: #8b869a;
  --border: rgba(255, 255, 255, 0.08);
  --border-strong: rgba(255, 255, 255, 0.16);
  --gridline: #221f2c;
  --baseline: #3c3750;
  --status-info: #3987e5;
  --accent: #a855f7;
  --accent-strong: #c084fc;
  --accent-soft: rgba(168, 85, 247, 0.16);
  --shadow-card: 0 1px 0 rgba(255, 255, 255, 0.02) inset, 0 8px 24px -16px rgba(0, 0, 0, 0.6);
  --shadow-card-hover: 0 1px 0 rgba(255, 255, 255, 0.03) inset, 0 12px 28px -14px rgba(0, 0, 0, 0.65);
  --scrollbar-thumb: rgba(255, 255, 255, 0.16);
  --scrollbar-thumb-hover: rgba(255, 255, 255, 0.28);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.raven-app {
  min-height: 100vh;
  min-height: 100dvh;
  background: radial-gradient(900px 480px at 12% -8%, color-mix(in srgb, var(--accent) 9%, transparent), transparent 60%), var(--page-bg);
  color: var(--text-primary);
  font-family: var(--font-sans);
  font-size: 15px;
  line-height: 1.5;
  letter-spacing: -0.006em;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-feature-settings: "ss01" 1, "cv01" 1;
  transition: var(--theme-transition);
}

::selection {
  background: var(--accent-soft);
  color: var(--text-primary);
}

h1,
h2,
h3,
h4 {
  margin: 0;
  font-weight: 700;
}

p {
  margin: 0;
}

table {
  border-collapse: collapse;
  width: 100%;
}

dl,
dd {
  margin: 0;
}

:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}

/* Firefox */
* {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) transparent;
}

/* WebKit */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb);
  border-radius: var(--radius-pill);
  border: 2px solid transparent;
  background-clip: content-box;
}

::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover);
  background-clip: content-box;
}

@media (prefers-reduced-motion: no-preference) {
  .product-card,
  .stat-tile {
    animation: fade-up 0.35s ease both;
  }
}
@keyframes fade-up {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
.app-shell {
  max-width: 1240px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-5) var(--space-7);
}

.app-main {
  display: flex;
  flex-direction: column;
  gap: var(--space-7);
}

.app-topbar {
  position: sticky;
  top: 0;
  z-index: 10;
  margin: 0 calc(var(--space-5) * -1);
  padding: 0 var(--space-5);
  background: var(--page-bg);
  border-bottom: 1px solid var(--border);
  transition: var(--theme-transition);
}

.app-header {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-4);
  padding: var(--space-4) 0 var(--space-4);
  flex-wrap: wrap;
}

.app-header__title {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.app-header__logo {
  flex-shrink: 0;
  filter: drop-shadow(0 4px 12px var(--accent-soft));
}

.app-header__logo-button {
  appearance: none;
  background: none;
  border: none;
  padding: 4px;
  margin: -4px;
  border-radius: var(--radius-md);
  line-height: 0;
  cursor: pointer;
  transition: transform 0.15s ease, background-color 0.15s ease;
}
.app-header__logo-button:hover {
  background: var(--accent-soft);
  transform: scale(1.06);
}
.app-header__logo-button:active {
  transform: scale(0.94);
}

.app-header__eye {
  transform-box: fill-box;
  transform-origin: center;
}

@media (prefers-reduced-motion: no-preference) {
  .app-header__eye--blinking {
    animation: eye-blink 0.55s ease-in-out;
  }
}
@keyframes eye-blink {
  0%, 100% {
    transform: scaleY(1);
  }
  40%, 60% {
    transform: scaleY(0.05);
  }
}
.app-header__title h1 {
  font-size: 22px;
  letter-spacing: -0.01em;
}

.app-header__subtitle {
  color: var(--text-secondary);
  font-size: 13px;
  margin-top: 1px;
}

.app-header__meta {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.app-header__meta-label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.app-header__meta-value {
  font-size: 13px;
  color: var(--text-secondary);
  font-variant-numeric: tabular-nums;
}

.nav-bar {
  display: flex;
  gap: var(--space-2);
  padding-bottom: var(--space-3);
  overflow-x: auto;
}

.nav-bar__link {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-secondary);
  text-decoration: none;
  text-align: center;
  white-space: nowrap;
  flex-shrink: 0;
  padding: 6px 14px;
  border-radius: var(--radius-pill);
  border: 1px solid transparent;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}
.nav-bar__link:hover {
  color: var(--text-primary);
  background: color-mix(in srgb, var(--text-primary) 6%, transparent);
}
.nav-bar__link--active {
  color: var(--text-primary);
  background: var(--accent-soft);
  border-color: color-mix(in srgb, var(--accent) 30%, transparent);
}
.nav-bar__link--active:hover {
  background: var(--accent-soft);
}

.badge {
  --tone-color: var(--status-muted);
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 3px 10px 3px 8px;
  border-radius: var(--radius-pill);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
  white-space: nowrap;
  color: var(--text-primary);
  background: color-mix(in srgb, var(--tone-color) 13%, var(--surface));
  border: 1px solid color-mix(in srgb, var(--tone-color) 32%, transparent);
  transition: var(--theme-transition);
}
.badge::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tone-color);
  flex-shrink: 0;
}
.badge--good {
  --tone-color: var(--status-good);
}
.badge--warning {
  --tone-color: var(--status-warning);
}
.badge--serious {
  --tone-color: var(--status-serious);
}
.badge--critical {
  --tone-color: var(--status-critical);
}
.badge--info {
  --tone-color: var(--status-info);
}
.badge--muted {
  --tone-color: var(--status-muted);
}
.badge--editable {
  position: relative;
  padding: 3px 8px 3px 8px;
  cursor: pointer;
}
.badge--editable:hover {
  border-color: var(--tone-color);
}
.badge--editable::after {
  content: "";
  width: 6px;
  height: 6px;
  border-right: 1.5px solid currentColor;
  border-bottom: 1.5px solid currentColor;
  opacity: 0.6;
  transform: rotate(45deg) translateY(-2px);
  margin-left: 2px;
  pointer-events: none;
}
.badge--editable select {
  appearance: none;
  background: transparent;
  border: none;
  color: inherit;
  font: inherit;
  font-weight: 600;
  cursor: pointer;
  padding-right: 14px;
  margin: -3px -8px -3px 0;
  padding: 3px 22px 3px 0;
}
.badge--editable select:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
  border-radius: var(--radius-sm);
}
.badge--editable select option {
  background: var(--surface-raised);
  color: var(--text-primary);
}

.summary-bar {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: var(--space-3);
  margin-top: var(--space-5);
}

.stat-tile {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 2px;
  overflow: hidden;
  transition: transform 0.18s ease, var(--theme-transition);
}
.stat-tile::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 2px;
  background: var(--tile-accent, var(--border-strong));
  opacity: 0.8;
}
.stat-tile:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--border-strong);
}

.stat-tile__value {
  font-size: 28px;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
  letter-spacing: -0.01em;
}

.stat-tile__label {
  font-size: 13px;
  color: var(--text-secondary);
}

.stat-tile__hint {
  font-size: 12px;
  color: var(--text-muted);
}

.stat-tile--critical {
  --tile-accent: var(--status-critical);
}
.stat-tile--critical .stat-tile__value {
  color: var(--status-critical);
}

.stat-tile--warning {
  --tile-accent: var(--status-warning);
}
.stat-tile--warning .stat-tile__value {
  color: var(--status-warning);
}

.stat-tile--good {
  --tile-accent: var(--status-good);
}
.stat-tile--good .stat-tile__value {
  color: var(--status-good);
}

.dashboard-section__header {
  margin-bottom: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding-left: var(--space-3);
  border-left: 3px solid var(--accent);
}

.dashboard-section__header h2 {
  font-size: 19px;
}

.dashboard-section__subtitle {
  color: var(--text-secondary);
  font-size: 13px;
}

.product-card-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
  align-items: start;
}

.status-filter {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  margin-bottom: var(--space-4);
}

.status-filter__pill {
  --tone-color: var(--text-muted);
  appearance: none;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 6px 12px 6px 10px;
  border-radius: var(--radius-pill);
  border: 1px solid var(--border-strong);
  background: var(--surface);
  color: var(--text-secondary);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--theme-transition), transform 0.1s ease;
}
.status-filter__pill::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--tone-color);
  flex-shrink: 0;
}
.status-filter__pill:hover {
  border-color: var(--tone-color);
  color: var(--text-primary);
}
.status-filter__pill:active {
  transform: scale(0.96);
}
.status-filter__pill--active {
  background: color-mix(in srgb, var(--tone-color) 18%, var(--surface));
  border-color: color-mix(in srgb, var(--tone-color) 48%, transparent);
  color: var(--text-primary);
}
.status-filter__pill--all {
  --tone-color: var(--accent);
}
.status-filter__pill--good {
  --tone-color: var(--status-good);
}
.status-filter__pill--warning {
  --tone-color: var(--status-warning);
}
.status-filter__pill--serious {
  --tone-color: var(--status-serious);
}
.status-filter__pill--critical {
  --tone-color: var(--status-critical);
}
.status-filter__pill--info {
  --tone-color: var(--status-info);
}
.status-filter__pill--muted {
  --tone-color: var(--status-muted);
}

.status-filter__count {
  font-variant-numeric: tabular-nums;
  opacity: 0.7;
}

.product-card {
  position: relative;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  transition: transform 0.18s ease, var(--theme-transition);
}
.product-card::before {
  content: "";
  position: absolute;
  inset: 0 0 auto 0;
  height: 2px;
  background: var(--card-accent, var(--status-muted));
  opacity: 0.85;
}
.product-card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-card-hover);
  border-color: var(--border-strong);
}

.product-card__header {
  padding: var(--space-4);
  padding-top: calc(var(--space-4) + 2px);
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
  border-bottom: 1px solid var(--gridline);
}

.product-card__heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-2);
}
.product-card__heading h3 {
  font-size: 16px;
  letter-spacing: -0.005em;
}

.product-card__facts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: var(--space-3);
}
.product-card__facts dt {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  margin-bottom: 2px;
}
.product-card__facts dd {
  font-size: 13px;
  color: var(--text-primary);
  overflow-wrap: anywhere;
}
.product-card__facts dd a {
  color: var(--accent);
  text-decoration: none;
}
.product-card__facts dd a:hover {
  text-decoration: underline;
}

.email-draft {
  margin-top: var(--space-3);
}

.email-draft__panel {
  margin-top: var(--space-3);
  padding: var(--space-3);
  background: var(--page-bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: var(--theme-transition);
}

.email-draft__subject {
  font-size: 13px;
  margin-bottom: var(--space-2);
  color: var(--text-primary);
}

.email-draft__body {
  font-family: inherit;
  font-size: 13px;
  color: var(--text-secondary);
  white-space: pre-wrap;
  margin: 0 0 var(--space-3);
  line-height: 1.6;
}

.email-draft__actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}
.email-draft__actions .btn--ghost:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
}

.email-draft__attach {
  margin: var(--space-3) 0 0;
  font-size: 12px;
  color: var(--text-muted);
}
.email-draft__attach a {
  color: var(--accent);
  text-decoration: none;
}
.email-draft__attach a:hover {
  text-decoration: underline;
}

.email-draft > .btn--ghost:hover:not(:disabled) {
  color: var(--accent);
  border-color: var(--accent);
}

.retest-notice {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-3);
  background: var(--accent-soft);
  border: 1px solid color-mix(in srgb, var(--accent) 24%, transparent);
  border-radius: var(--radius-md);
  font-size: 13px;
  transition: var(--theme-transition);
}
.retest-notice > *:last-child {
  margin-left: auto;
}

.retest-notice__label {
  color: var(--text-secondary);
  font-weight: 600;
}

.retest-notice__date {
  color: var(--text-primary);
  font-variant-numeric: tabular-nums;
}

@media (max-width: 560px) {
  .product-card__facts {
    grid-template-columns: 1fr 1fr;
  }
}
.risk-table-wrap {
  overflow-x: auto;
}

.risk-table {
  font-size: 13px;
}
.risk-table th,
.risk-table td {
  text-align: left;
  padding: var(--space-3) var(--space-3);
  vertical-align: top;
  border-bottom: 1px solid var(--gridline);
}
.risk-table thead th {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
  border-bottom: 1px solid var(--baseline);
  white-space: nowrap;
}
.risk-table tbody tr:last-child th,
.risk-table tbody tr:last-child td {
  border-bottom: none;
}
.risk-table tbody tr {
  transition: background-color 0.12s ease;
}
.risk-table tbody tr:nth-child(even) {
  background: color-mix(in srgb, var(--text-primary) 2.5%, transparent);
}
.risk-table tbody tr:hover {
  background: var(--accent-soft);
}
.risk-table th[scope=row] {
  font-weight: 600;
}

.risk-table__title {
  display: block;
  font-weight: 600;
  color: var(--text-primary);
}

.risk-table__description {
  display: block;
  margin-top: 2px;
  font-weight: 400;
  font-size: 12px;
  color: var(--text-secondary);
  max-width: 34ch;
}

.risk-table__retest {
  display: flex;
  flex-direction: column;
  gap: 4px;
  align-items: flex-start;
}

@media (max-width: 720px) {
  .risk-table thead {
    display: none;
  }
  .risk-table,
  .risk-table tbody,
  .risk-table tr,
  .risk-table th,
  .risk-table td {
    display: block;
    width: 100%;
  }
  .risk-table tr {
    border: 1px solid var(--gridline);
    border-radius: var(--radius-md);
    padding: var(--space-2) var(--space-3);
    margin-bottom: var(--space-3);
  }
  .risk-table th,
  .risk-table td {
    border-bottom: none;
    padding: var(--space-1) 0;
  }
  .risk-table td {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-3);
  }
  .risk-table td::before {
    content: attr(data-label);
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--text-muted);
    flex-shrink: 0;
  }
  .risk-table__retest {
    align-items: flex-end;
  }
}
.empty-state {
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--text-primary) 1.5%, transparent);
  padding: var(--space-6) var(--space-5);
  text-align: center;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.empty-state__icon {
  color: var(--text-muted);
  margin-bottom: var(--space-1);
}

.empty-state__title {
  font-weight: 600;
  color: var(--text-secondary);
}

.empty-state__message {
  font-size: 13px;
  color: var(--text-muted);
  max-width: 42ch;
}

.empty-state--compact {
  padding: var(--space-4);
  border-radius: var(--radius-md);
}
.empty-state--compact .empty-state__icon svg {
  width: 18px;
  height: 18px;
}

.btn {
  appearance: none;
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  padding: 8px 16px;
  cursor: pointer;
  transition: transform 0.15s ease, opacity 0.15s ease, var(--theme-transition);
}
.btn:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.btn--primary {
  background: var(--accent);
  color: #ffffff;
  border-color: var(--accent);
}
.btn--primary:hover:not(:disabled) {
  transform: translateY(-1px);
  background: var(--accent-strong);
  border-color: var(--accent-strong);
}

.btn--ghost {
  background: transparent;
  color: var(--text-secondary);
  border-color: var(--border-strong);
  font-size: 12px;
  padding: 6px 10px;
}
.btn--ghost:hover:not(:disabled) {
  color: var(--status-critical);
  border-color: var(--status-critical);
}

.upload-form {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  margin-bottom: var(--space-4);
  transition: var(--theme-transition);
}

.upload-form__row {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-end;
  gap: var(--space-4);
}

.upload-form__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  min-width: 180px;
}

.upload-form input[type=text],
.upload-form input[type=file],
.upload-form input[type=date],
.upload-form select,
.upload-review input[type=text],
.upload-review input[type=date],
.upload-review select,
.upload-review textarea {
  background: var(--page-bg);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 13px;
  padding: 7px 10px;
  transition: var(--theme-transition);
}
.upload-form input[type=text]:focus-visible,
.upload-form input[type=file]:focus-visible,
.upload-form input[type=date]:focus-visible,
.upload-form select:focus-visible,
.upload-review input[type=text]:focus-visible,
.upload-review input[type=date]:focus-visible,
.upload-review select:focus-visible,
.upload-review textarea:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 1px;
}

.upload-form input[type=file] {
  padding: 4px;
}
.upload-form input[type=file]::file-selector-button {
  appearance: none;
  background: var(--accent-soft);
  border: 1px solid color-mix(in srgb, var(--accent) 32%, transparent);
  border-radius: var(--radius-sm);
  color: var(--text-primary);
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  margin-right: 10px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease;
}
.upload-form input[type=file]::file-selector-button:hover {
  background: color-mix(in srgb, var(--accent) 24%, var(--surface));
  border-color: var(--accent);
}

.upload-form__error {
  color: var(--status-critical);
  font-size: 13px;
  margin-top: var(--space-3);
}

.upload-form__success {
  color: var(--status-good);
  font-size: 13px;
  margin-top: var(--space-3);
}

.upload-review {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: var(--space-4);
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
  transition: var(--theme-transition);
}

.upload-review__header {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: flex-end;
  gap: var(--space-4);
  font-size: 13px;
  color: var(--text-secondary);
}

.upload-review__meta {
  display: flex;
  gap: var(--space-3);
}
.upload-review__meta label {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--text-muted);
}

.upload-review__table input[type=text] {
  width: 100%;
  margin-bottom: 4px;
}

.upload-review__table textarea {
  width: 100%;
  min-height: 60px;
  resize: vertical;
}

.upload-review__actions {
  display: flex;
  align-items: center;
  gap: var(--space-3);
}

.export-panel {
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-card);
  padding: var(--space-5);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-5);
  transition: var(--theme-transition);
}

.export-panel__info h3 {
  font-size: 15px;
  margin-bottom: var(--space-2);
}
.export-panel__info p {
  font-size: 13px;
  color: var(--text-secondary);
  max-width: 56ch;
  line-height: 1.55;
}

.export-panel__note {
  margin-top: var(--space-2) !important;
  color: var(--text-muted) !important;
  font-size: 12px !important;
}

.export-panel__actions {
  display: flex;
  flex-direction: column;
  gap: var(--space-2);
  flex-shrink: 0;
}

.export-panel .btn {
  padding: 10px 20px;
  white-space: nowrap;
}

@media (max-width: 640px) {
  .export-panel {
    flex-direction: column;
    align-items: flex-start;
  }
  .export-panel__actions {
    flex-direction: row;
    width: 100%;
  }
  .export-panel__actions .btn {
    flex: 1;
  }
}

/* Hover/focus tooltip for icon-only buttons — mirrors the same rule in
   index.shell.html. Shadow DOM doesn't inherit that document-level <style>,
   so this chunk carries its own copy; the JS delegate that swaps title ->
   data-tip lives once in core app.jsx and reaches in here via composedPath(). */
[data-tip] { position: relative; }
[data-tip]::after {
  content: attr(data-tip);
  position: absolute; bottom: calc(100% + 6px); left: 50%; transform: translateX(-50%);
  background: rgba(20,20,24,0.96); color: #fff; font-size: 12px; font-weight: 600;
  padding: 5px 9px; border-radius: 6px; white-space: normal; max-width: 220px;
  text-align: center; pointer-events: none; opacity: 0; z-index: 1200;
  transition: opacity 0.12s ease 0.35s;
}
[data-tip]:hover::after, [data-tip]:focus-visible::after { opacity: 1; }
`;



// Theme-bridge stylesheet for Raven's Eye — same rationale as secxThemeCSS
// above: remaps the ported CSS's own custom properties to Vantage's active
// theme object so the tab reads as a native Vantage page instead of keeping
// its own fixed black/purple/white brand palette. Injected as a *second*
// <style> tag after RAVEN_CSS inside the shadow root (see RavenShadowRoot),
// so equal-or-higher specificity + later source order wins without needing
// !important everywhere — :host([data-theme]) matches both the light and
// dark base blocks regardless of which value is set, and beats a bare
// :host{} by specificity, so !important is kept only as a safety margin.
// Severity/status colors (--status-*) are deliberately left alone: they're
// functional signal colors, not brand colors, and remapping a 5-step
// severity ramp onto a theme with only 1-2 semantic colors would make
// critical/high/medium/low indistinguishable.
function ravenThemeCSS(theme) {
  return `
:host([data-theme]) {
  --page-bg: ${theme.pageBg} !important;
  --surface: ${theme.cardBg} !important;
  --surface-raised: color-mix(in srgb, ${theme.pageBg} 85%, ${theme.text} 15%) !important;
  --text-primary: ${theme.text} !important;
  --text-secondary: ${theme.textMuted} !important;
  --text-muted: ${theme.textFaint} !important;
  --border: ${theme.divider} !important;
  --border-strong: ${theme.cardBorder} !important;
  --gridline: ${theme.divider} !important;
  --baseline: ${theme.divider} !important;
  --accent: ${theme.accent} !important;
  --accent-strong: color-mix(in srgb, ${theme.accent} 80%, black) !important;
  --accent-soft: ${theme.accentSoft} !important;
  --accent-contrast: ${theme.accentText} !important;
  --shadow-card: ${theme.cardShadow} !important;
  --shadow-card-hover: ${theme.cardShadow} !important;
  --scrollbar-thumb: color-mix(in srgb, ${theme.text} 20%, transparent) !important;
  --scrollbar-thumb-hover: color-mix(in srgb, ${theme.text} 32%, transparent) !important;
  --radius-sm: calc(${theme.cardRadius} * 0.45) !important;
  --radius-md: calc(${theme.cardRadius} * 0.7) !important;
  --radius-lg: ${theme.cardRadius} !important;
  --font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  color-scheme: ${vantageIsDarkTheme(theme) ? "dark" : "light"} !important;
}
/* .btn--primary hardcodes white text on an accent background — flatten to
   the theme's own contrast color so it stays legible on light accents
   (e.g. the Glassmorphic theme's white accent). */
.btn--primary {
  color: var(--accent-contrast);
}
`;
}



// Renders children inside a real Shadow DOM subtree carrying RAVEN_CSS —
// same style-isolation rationale as FFShadowRoot above: ~1,100 lines of a
// completely different app's CSS (bare h1/body-turned-.raven-app/table
// selectors) can be pasted in near-verbatim with no collision risk in
// either direction. data-theme on the host picks light vs dark (see
// ravenIsDarkTheme) since :host([data-theme=...]) inside the shadow
// stylesheet reads attributes on this host element.
function RavenShadowRoot({ theme, children }) {
  const hostRef = useRef(null);
  const [shadowRoot, setShadowRoot] = useState(null);
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;
    setShadowRoot(host.shadowRoot || host.attachShadow({ mode: "open" }));
  }, []);
  const skin = useMemo(() => ravenThemeCSS(theme), [theme]);
  return (
    <div ref={hostRef} data-theme={vantageIsDarkTheme(theme) ? "dark" : "light"} style={{ display: "block" }}>
      {shadowRoot &&
        ReactDOM.createPortal(
          <>
            <style>{RAVEN_CSS}</style>
            <style>{skin}</style>
            {children}
          </>,
          shadowRoot
        )}
    </div>
  );
}

// Uploaded report files (PDF/DOCX/XLSX) — IndexedDB only, local to this
// browser, excluded from JSON backup, same rationale as the golf-photo and
// Mechanical Orchard policy-doc stores above.
const RAVEN_DB_NAME = "vantage-ravenreports";
const RAVEN_STORE = "reports";

function openRavenDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("This browser doesn't support local file storage."));
      return;
    }
    const req = indexedDB.open(RAVEN_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(RAVEN_STORE)) {
        db.createObjectStore(RAVEN_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function dbPutRavenReport(record) {
  const db = await openRavenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RAVEN_STORE, "readwrite");
    tx.objectStore(RAVEN_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

async function dbGetRavenReport(id) {
  if (!id) return null;
  const db = await openRavenDB();
  return new Promise((resolve) => {
    const req = db.transaction(RAVEN_STORE, "readonly").objectStore(RAVEN_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => resolve(null);
  });
}

async function dbDeleteRavenReport(id) {
  const db = await openRavenDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(RAVEN_STORE, "readwrite");
    tx.objectStore(RAVEN_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---- Pure status/severity maps + helpers (ported from status.js) ----
const RAVEN_RETEST_URGENCY = {
  overdue: { label: "Overdue", tone: "critical" },
  "due-soon": { label: "Due soon", tone: "warning" },
  scheduled: { label: "Scheduled", tone: "info" },
  passed: { label: "Passed", tone: "good" },
  none: { label: "Not scheduled", tone: "muted" },
};

const RAVEN_SEVERITY_ORDER = ["critical", "high", "medium", "low", "info"];

function ravenSortBySeverity(items, getSeverity = (i) => i.severity) {
  return [...items].sort(
    (a, b) => RAVEN_SEVERITY_ORDER.indexOf(getSeverity(a)) - RAVEN_SEVERITY_ORDER.indexOf(getSeverity(b))
  );
}

function ravenCountBySeverity(items, getSeverity = (i) => i.severity) {
  const counts = Object.fromEntries(RAVEN_SEVERITY_ORDER.map((s) => [s, 0]));
  for (const item of items) {
    const sev = getSeverity(item);
    if (sev in counts) counts[sev] += 1;
  }
  return counts;
}

function ravenIsOpenFinding(item) {
  return item.status === "open" || item.status === "in_progress";
}

function ravenDominantTone(items) {
  if (!items || items.length === 0) return "muted";
  const open = items.filter(ravenIsOpenFinding);
  if (open.length === 0) return "good";
  return RAVEN_SEVERITY[ravenSortBySeverity(open)[0].severity]?.tone ?? "muted";
}

// ---- Dates (ported from dates.js) ----
const RAVEN_DATE_FMT = { year: "numeric", month: "short", day: "numeric" };
const RAVEN_DATETIME_FMT = { ...RAVEN_DATE_FMT, hour: "numeric", minute: "2-digit" };
const RAVEN_DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;

function ravenToLocalDate(value) {
  if (value instanceof Date) return value;
  if (typeof value === "string" && RAVEN_DATE_ONLY_RE.test(value)) {
    const [year, month, day] = value.split("-").map(Number);
    return new Date(year, month - 1, day);
  }
  return new Date(value);
}

function ravenFormatDate(value) {
  if (!value) return "—";
  const d = ravenToLocalDate(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", RAVEN_DATE_FMT);
}

function ravenFormatDateTime(value) {
  if (!value) return "—";
  const d = ravenToLocalDate(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-US", RAVEN_DATETIME_FMT);
}

function ravenDaysUntil(value) {
  if (!value) return null;
  const target = ravenToLocalDate(value);
  if (Number.isNaN(target.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function ravenRetestUrgency(retestDate, retestStatus) {
  if (retestStatus === "passed") return "passed";
  if (!retestDate) return retestStatus === "scheduled" ? "scheduled" : "none";
  const days = ravenDaysUntil(retestDate);
  if (days === null) return "none";
  if (days < 0) return "overdue";
  if (days <= 14) return "due-soon";
  return "scheduled";
}

// ---- Per-product / report summaries (ported from aggregate.js + reportData.js) ----
function ravenScopedSummary(products, getItems, isComplete) {
  const items = products.flatMap(getItems);
  const openItems = items.filter(ravenIsOpenFinding);

  let overdueRetests = 0;
  let dueSoonRetests = 0;
  for (const item of items) {
    const urgency = ravenRetestUrgency(item.retestDate, item.retestStatus);
    if (urgency === "overdue") overdueRetests += 1;
    if (urgency === "due-soon") dueSoonRetests += 1;
  }

  return {
    productsCount: products.length,
    completeCount: products.filter(isComplete).length,
    openFindingsBySeverity: ravenCountBySeverity(openItems),
    openFindingsTotal: openItems.length,
    overdueRetests,
    dueSoonRetests,
  };
}

function ravenComputeThreatModelSummary(products) {
  return ravenScopedSummary(
    products,
    (p) => p.threatModel?.risks ?? [],
    (p) => p.threatModel?.status === "complete"
  );
}

function ravenComputePenTestSummary(products) {
  return ravenScopedSummary(
    products,
    (p) => p.penTest?.findings ?? [],
    (p) => p.penTest?.status === "complete"
  );
}

function ravenCountOpen(items) {
  return (items ?? []).filter(ravenIsOpenFinding).length;
}

function ravenNextRetestDate(product) {
  const dates = [product.threatModel?.nextRetestDue, product.penTest?.nextRetestDue].filter(Boolean).sort();
  return dates[0] ?? null;
}

function ravenSummarizeProduct(product) {
  const tm = product.threatModel ?? {};
  const pt = product.penTest ?? {};
  const retestDate = ravenNextRetestDate(product);
  const retestTone = retestDate ? RAVEN_RETEST_URGENCY[ravenRetestUrgency(retestDate)]?.tone ?? "muted" : "muted";

  return {
    name: product.name,
    team: product.owner || "—",
    tmStatusLabel: RAVEN_THREAT_MODEL_STATUS[tm.status]?.label ?? "Not started",
    tmStatusTone: RAVEN_THREAT_MODEL_STATUS[tm.status]?.tone ?? "muted",
    tmLastReviewed: ravenFormatDate(tm.lastReviewed),
    tmOpenRisks: ravenCountOpen(tm.risks),
    ptStatusLabel: RAVEN_PENTEST_STATUS[pt.status]?.label ?? "Not started",
    ptStatusTone: RAVEN_PENTEST_STATUS[pt.status]?.tone ?? "muted",
    ptLastEngagement: ravenFormatDate(pt.lastEngagementDate),
    ptOpenFindings: ravenCountOpen(pt.findings),
    retestLabel: retestDate ? ravenFormatDate(retestDate) : "Not scheduled",
    retestTone,
  };
}

function ravenSummarizeReport(products, { generatedAt = new Date() } = {}) {
  return {
    generatedAt,
    productsCount: products.length,
    tmComplete: products.filter((p) => p.threatModel?.status === "complete").length,
    ptComplete: products.filter((p) => p.penTest?.status === "complete").length,
    rows: products.map(ravenSummarizeProduct),
  };
}

// ---- Report-builder color palette (ported from reportColors.js) ----
const RAVEN_TONE_COLORS = {
  good: { hex: "0CA30C", textHex: "FFFFFF" },
  warning: { hex: "FAB219", textHex: "241C05" },
  serious: { hex: "EC835A", textHex: "FFFFFF" },
  critical: { hex: "D03B3B", textHex: "FFFFFF" },
  muted: { hex: "8B869A", textHex: "FFFFFF" },
  info: { hex: "3987E5", textHex: "FFFFFF" },
};

const RAVEN_BRAND = {
  header: "2E1065",
  title: "6D28D9",
  band: "F6F4FB",
  border: "E0DCE8",
};

// ---- Local replacements for DataContext.jsx's fetch calls + vite.config.js's
// /api/update-status and /api/import handlers — same shapes, but synchronous
// against the in-memory products array instead of round-tripping to a
// filesystem-backed dev server. Callers do setProducts(result) themselves. ----
function ravenSlugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function ravenUpdateStatus(products, productId, category, status) {
  return products.map((p) => {
    if (p.id !== productId) return p;
    const current = p[category] ?? (category === "threatModel" ? ravenEmptyThreatModel() : ravenEmptyPenTest());
    return { ...p, [category]: { ...current, status } };
  });
}

function ravenApplyImport(product, category, mapped, { engagementDate, source, tester, reportFileId }) {
  if (category === "threatModel") {
    const tm = product.threatModel ?? ravenEmptyThreatModel();
    const risks = [...tm.risks, ...mapped];
    return {
      ...product,
      threatModel: {
        ...tm,
        risks,
        lastReviewed: engagementDate,
        reviewedBy: tester || tm.reviewedBy,
        reportRef: source || tm.reportRef,
        reportFileId: reportFileId || tm.reportFileId || null,
        status: risks.some(ravenIsOpenFinding) ? "needs_review" : "complete",
      },
    };
  }
  const pt = product.penTest ?? ravenEmptyPenTest();
  const findings = [...pt.findings, ...mapped];
  return {
    ...product,
    penTest: {
      ...pt,
      findings,
      lastEngagementDate: engagementDate,
      tester: tester || pt.tester,
      reportRef: source || pt.reportRef,
      reportFileId: reportFileId || pt.reportFileId || null,
      status: findings.some(ravenIsOpenFinding) ? "needs_retest" : "complete",
    },
  };
}

// Creates the product by slug if it doesn't exist yet (the only place new
// Raven's Eye products get created, same as the original /api/import route)
// and appends the extracted findings/risks to it. Returns the new products
// array plus the product id, so the caller can also key an IndexedDB report
// blob to the same import.
function ravenImportFindings(products, { productName, category, items, meta = {} }) {
  const id = ravenSlugify(productName);
  const today = new Date().toISOString().slice(0, 10);
  const source = meta.reportRef || "";
  const engagementDate = meta.date || today;

  const mapped = items.map((item, i) => ({
    id: `${ravenSlugify(item.title || "finding")}-${Date.now()}-${i}`,
    title: item.title,
    description: item.description || "",
    severity: item.severity,
    status: item.status,
    [category === "threatModel" ? "identifiedDate" : "discoveredDate"]: engagementDate,
    fix: item.fix || "",
    fixedDate: item.status === "fixed" ? engagementDate : null,
    retestDate: null,
    retestStatus: "not_scheduled",
    source,
  }));

  const importCtx = { engagementDate, source, tester: meta.tester, reportFileId: meta.reportFileId };
  let found = false;
  const updated = products.map((p) => {
    if (p.id !== id) return p;
    found = true;
    return ravenApplyImport(p, category, mapped, importCtx);
  });

  const finalProducts = found
    ? updated
    : [
        ...updated,
        ravenApplyImport(
          { id, name: productName.trim(), owner: "", threatModel: ravenEmptyThreatModel(), penTest: ravenEmptyPenTest() },
          category,
          mapped,
          importCtx
        ),
      ];

  return { products: finalProducts, productId: id, imported: mapped.length };
}

// Top-level shell for the tab — sub-nav + the four ported pages get filled
// in over the next few batches; this is the empty-state skeleton so the tab
// is wired end-to-end (routing, shadow CSS, theming) before that lands.
function ravenFromMap(map, key) {
  return map[key] ?? { label: key ?? "Unknown", tone: "muted" };
}

function RavenBadge({ tone = "muted", children }) {
  return <span className={`badge badge--${tone}`}>{children}</span>;
}

function RavenThreatModelStatusBadge({ status }) {
  const { label, tone } = ravenFromMap(RAVEN_THREAT_MODEL_STATUS, status);
  return <RavenBadge tone={tone}>{label}</RavenBadge>;
}

function RavenPenTestStatusBadge({ status }) {
  const { label, tone } = ravenFromMap(RAVEN_PENTEST_STATUS, status);
  return <RavenBadge tone={tone}>{label}</RavenBadge>;
}

function RavenFindingStatusBadge({ status }) {
  const { label, tone } = ravenFromMap(RAVEN_FINDING_STATUS, status);
  return <RavenBadge tone={tone}>{label}</RavenBadge>;
}

function RavenSeverityBadge({ severity }) {
  const { label, tone } = ravenFromMap(RAVEN_SEVERITY, severity);
  return <RavenBadge tone={tone}>{label}</RavenBadge>;
}

function RavenRetestBadge({ urgency }) {
  const { label, tone } = ravenFromMap(RAVEN_RETEST_URGENCY, urgency);
  return <RavenBadge tone={tone}>{label}</RavenBadge>;
}

// A badge that's also a native <select> overlaid on top — same dot + tint
// visual language as the read-only badges, doubles as an in-place control.
function RavenStatusEditor({ status, statusMap, onChange, disabled }) {
  const { tone } = ravenFromMap(statusMap, status);
  return (
    <span className={`badge badge--${tone} badge--editable`}>
      <select value={status} disabled={disabled} onChange={(e) => onChange(e.target.value)} aria-label="Status">
        {Object.entries(statusMap).map(([key, { label }]) => (
          <option key={key} value={key}>
            {label}
          </option>
        ))}
      </select>
    </span>
  );
}

function RavenThreatModelStatusEditor({ status, onChange, disabled }) {
  return <RavenStatusEditor status={status} statusMap={RAVEN_THREAT_MODEL_STATUS} onChange={onChange} disabled={disabled} />;
}

function RavenPenTestStatusEditor({ status, onChange, disabled }) {
  return <RavenStatusEditor status={status} statusMap={RAVEN_PENTEST_STATUS} onChange={onChange} disabled={disabled} />;
}

function RavenStatTile({ label, value, tone = "default", hint }) {
  return (
    <div className={`stat-tile stat-tile--${tone}`}>
      <span className="stat-tile__value">{value}</span>
      <span className="stat-tile__label">{label}</span>
      {hint && <span className="stat-tile__hint">{hint}</span>}
    </div>
  );
}

function RavenSummaryBar({ summary, completeLabel }) {
  const { critical, high } = summary.openFindingsBySeverity;
  return (
    <section className="summary-bar" aria-label="Summary">
      <RavenStatTile label="Products tracked" value={summary.productsCount} />
      <RavenStatTile label={completeLabel} value={summary.completeCount} hint={`of ${summary.productsCount}`} />
      <RavenStatTile
        label="Open findings"
        value={summary.openFindingsTotal}
        tone={critical + high > 0 ? "critical" : "default"}
        hint={`${critical} critical, ${high} high`}
      />
      <RavenStatTile label="Retests overdue" value={summary.overdueRetests} tone={summary.overdueRetests > 0 ? "critical" : "good"} />
      <RavenStatTile
        label="Retests due in 14 days"
        value={summary.dueSoonRetests}
        tone={summary.dueSoonRetests > 0 ? "warning" : "default"}
      />
    </section>
  );
}

function RavenRetestNotice({ date, retestStatus, label = "Next retest" }) {
  const urgency = ravenRetestUrgency(date, retestStatus);
  return (
    <div className="retest-notice">
      <span className="retest-notice__label">{label}</span>
      {date && <span className="retest-notice__date">{ravenFormatDate(date)}</span>}
      <RavenRetestBadge urgency={urgency} />
    </div>
  );
}

function RavenStatusFilter({ statusMap, counts, totalCount, value, onChange }) {
  return (
    <div className="status-filter" role="group" aria-label="Filter by status">
      <button
        type="button"
        className={`status-filter__pill status-filter__pill--all${value === "all" ? " status-filter__pill--active" : ""}`}
        onClick={() => onChange("all")}
      >
        All
        <span className="status-filter__count">{totalCount}</span>
      </button>
      {Object.entries(statusMap).map(([key, { label, tone }]) => (
        <button
          key={key}
          type="button"
          className={`status-filter__pill status-filter__pill--${tone}${value === key ? " status-filter__pill--active" : ""}`}
          onClick={() => onChange(key)}
        >
          {label}
          <span className="status-filter__count">{counts[key] ?? 0}</span>
        </button>
      ))}
    </div>
  );
}

function RavenEmptyIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
      <path
        d="M11 2.5 L17.5 5.5 V10 C17.5 14.5 14.9 17.5 11 18.8 C7.1 17.5 4.5 14.5 4.5 10 V5.5 Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <line x1="8" y1="10.4" x2="14" y2="10.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function RavenEmptyState({ title, message, compact = false }) {
  return (
    <div className={`empty-state${compact ? " empty-state--compact" : ""}`}>
      <span className="empty-state__icon">
        <RavenEmptyIcon />
      </span>
      <p className="empty-state__title">{title}</p>
      {message && <p className="empty-state__message">{message}</p>}
    </div>
  );
}

function RavenRiskTable({ items, dateField, dateLabel, emptyMessage }) {
  if (!items || items.length === 0) {
    return <RavenEmptyState compact title={emptyMessage ?? "No items logged yet."} />;
  }
  const sorted = ravenSortBySeverity(items);
  return (
    <div className="risk-table-wrap">
      <table className="risk-table">
        <thead>
          <tr>
            <th scope="col">Title</th>
            <th scope="col">Severity</th>
            <th scope="col">Status</th>
            <th scope="col">{dateLabel}</th>
            <th scope="col">Fix</th>
            <th scope="col">Fixed</th>
            <th scope="col">Retest</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((item) => {
            const urgency = ravenRetestUrgency(item.retestDate, item.retestStatus);
            return (
              <tr key={item.id}>
                <th scope="row" data-label="Title">
                  <span className="risk-table__title">{item.title}</span>
                  {item.description && <span className="risk-table__description">{item.description}</span>}
                </th>
                <td data-label="Severity">
                  <RavenSeverityBadge severity={item.severity} />
                </td>
                <td data-label="Status">
                  <RavenFindingStatusBadge status={item.status} />
                </td>
                <td data-label={dateLabel}>{ravenFormatDate(item[dateField])}</td>
                <td data-label="Fix">{item.fix || "—"}</td>
                <td data-label="Fixed">{ravenFormatDate(item.fixedDate)}</td>
                <td data-label="Retest">
                  <div className="risk-table__retest">
                    {item.retestDate && <span>{ravenFormatDate(item.retestDate)}</span>}
                    <RavenRetestBadge urgency={urgency} />
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ravenBuildEmail(productName, items, categoryLabel) {
  const openItems = ravenSortBySeverity(items.filter(ravenIsOpenFinding));
  const subject = `${categoryLabel} Follow-up — ${productName}`;
  const intro = `Hey ${productName} team,\n\nI hope you are all doing well today, just reaching out to see if these issues from the past ${categoryLabel.toLowerCase()} have been resolved yet?`;
  const list = openItems.length
    ? `\n\nOpen items:\n${openItems.map((i) => `- [${RAVEN_SEVERITY[i.severity]?.label ?? i.severity}] ${i.title}`).join("\n")}`
    : "";
  const outro = `\n\nIf you have any questions please let us know,\nThank you.`;
  return { subject, body: `${intro}${list}${outro}` };
}

function RavenEmailDraftButton({ productName, items = [], hasReport, reportLabel, categoryLabel }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { subject, body } = ravenBuildEmail(productName, items, categoryLabel);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  }

  const mailtoHref = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

  return (
    <div className="email-draft">
      <button type="button" className="btn btn--ghost" onClick={() => setOpen((o) => !o)}>
        {open ? "Hide email draft" : "Draft email"}
      </button>
      {open && (
        <div className="email-draft__panel">
          <p className="email-draft__subject">
            <strong>Subject:</strong> {subject}
          </p>
          <pre className="email-draft__body">{body}</pre>
          <div className="email-draft__actions">
            <a className="btn btn--primary" href={mailtoHref}>
              Open in email
            </a>
            <button type="button" className="btn btn--ghost" onClick={handleCopy}>
              {copied ? "Copied!" : "Copy text"}
            </button>
          </div>
          {hasReport && (
            <p className="email-draft__attach">
              Email links can't carry attachments — download {reportLabel || "the report"} from the card above and attach it
              manually.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Downloads a report blob straight out of IndexedDB on click — replaces the
// original's static /reports/<file> href, since there's no server to serve
// static files from here (see RAVEN_DB_NAME above).
function RavenReportLink({ fileId, label }) {
  const [busy, setBusy] = useState(false);
  if (!fileId) return null;
  async function handleClick(e) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      const record = await dbGetRavenReport(fileId);
      if (!record || !record.blob) return;
      const url = URL.createObjectURL(record.blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = record.name || "report";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setBusy(false);
    }
  }
  return (
    <a href="#" onClick={handleClick}>
      {busy ? "Preparing…" : label || "Download"}
    </a>
  );
}

function RavenPenTestCard({ product, onUpdateStatus }) {
  const pt = product.penTest ?? {};
  const accent = { "--card-accent": `var(--status-${ravenDominantTone(pt.findings)})` };

  return (
    <article className="product-card" style={accent}>
      <header className="product-card__header">
        <div className="product-card__heading">
          <h3>{product.name}</h3>
          <RavenPenTestStatusEditor status={pt.status} onChange={(status) => onUpdateStatus(product.id, "penTest", status)} />
        </div>
        <dl className="product-card__facts">
          {product.owner && (
            <div>
              <dt>Point of contact</dt>
              <dd>{product.owner}</dd>
            </div>
          )}
          <div>
            <dt>Last engagement</dt>
            <dd>{ravenFormatDate(pt.lastEngagementDate)}</dd>
          </div>
          <div>
            <dt>Tester</dt>
            <dd>{pt.tester || "—"}</dd>
          </div>
          <div>
            <dt>Report</dt>
            <dd>
              {pt.reportFileId ? (
                <RavenReportLink fileId={pt.reportFileId} label={pt.reportRef || "Download"} />
              ) : (
                pt.reportRef || "—"
              )}
            </dd>
          </div>
        </dl>
        <RavenRetestNotice date={pt.nextRetestDue} label="Next retest" />
        <RavenEmailDraftButton
          productName={product.name}
          items={pt.findings ?? []}
          hasReport={!!pt.reportFileId}
          reportLabel={pt.reportRef}
          categoryLabel="Pen Test"
        />
      </header>
      <RavenRiskTable
        items={pt.findings}
        dateField="discoveredDate"
        dateLabel="Discovered"
        emptyMessage={
          pt.status === "complete" || pt.status === "needs_retest"
            ? "No findings — clean report."
            : "No findings logged for this engagement yet."
        }
      />
    </article>
  );
}

function RavenThreatModelCard({ product, onUpdateStatus }) {
  const tm = product.threatModel ?? {};
  const accent = { "--card-accent": `var(--status-${ravenDominantTone(tm.risks)})` };

  return (
    <article className="product-card" style={accent}>
      <header className="product-card__header">
        <div className="product-card__heading">
          <h3>{product.name}</h3>
          <RavenThreatModelStatusEditor
            status={tm.status}
            onChange={(status) => onUpdateStatus(product.id, "threatModel", status)}
          />
        </div>
        <dl className="product-card__facts">
          {product.owner && (
            <div>
              <dt>Point of contact</dt>
              <dd>{product.owner}</dd>
            </div>
          )}
          <div>
            <dt>Version</dt>
            <dd>{tm.version || "—"}</dd>
          </div>
          <div>
            <dt>Last reviewed</dt>
            <dd>{ravenFormatDate(tm.lastReviewed)}</dd>
          </div>
          <div>
            <dt>Reviewed by</dt>
            <dd>{tm.reviewedBy || "—"}</dd>
          </div>
          {(tm.reportRef || tm.reportFileId) && (
            <div>
              <dt>Report</dt>
              <dd>
                {tm.reportFileId ? (
                  <RavenReportLink fileId={tm.reportFileId} label={tm.reportRef || "Download"} />
                ) : (
                  tm.reportRef
                )}
              </dd>
            </div>
          )}
        </dl>
        <RavenRetestNotice date={tm.nextRetestDue} label="Next threat model review" />
        <RavenEmailDraftButton
          productName={product.name}
          items={tm.risks ?? []}
          hasReport={!!tm.reportFileId}
          reportLabel={tm.reportRef}
          categoryLabel="Threat Model"
        />
      </header>
      <RavenRiskTable
        items={tm.risks}
        dateField="identifiedDate"
        dateLabel="Identified"
        emptyMessage="No risks logged for this threat model yet."
      />
    </article>
  );
}

function RavenPenTestSection({ products, totalCount, onUpdateStatus }) {
  const isFilteredEmpty = products.length === 0 && totalCount > 0;
  return (
    <section className="dashboard-section" aria-labelledby="pentest-heading">
      <div className="dashboard-section__header">
        <h2 id="pentest-heading">Pen testing progress</h2>
        <p className="dashboard-section__subtitle">Engagement status, findings, remediation, and retest schedule.</p>
      </div>
      {products.length === 0 ? (
        <RavenEmptyState
          title={isFilteredEmpty ? "No matches" : "No pen test engagements yet"}
          message={
            isFilteredEmpty
              ? "No products have this status. Try a different filter."
              : "Upload a pen test report to populate this section."
          }
        />
      ) : (
        <div className="product-card-grid">
          {products.map((p) => (
            <RavenPenTestCard key={p.id} product={p} onUpdateStatus={onUpdateStatus} />
          ))}
        </div>
      )}
    </section>
  );
}

function RavenThreatModelSection({ products, totalCount, onUpdateStatus }) {
  const isFilteredEmpty = products.length === 0 && totalCount > 0;
  return (
    <section className="dashboard-section" aria-labelledby="threat-model-heading">
      <div className="dashboard-section__header">
        <h2 id="threat-model-heading">Threat model status</h2>
        <p className="dashboard-section__subtitle">Per-product threat modeling coverage, open risks, and review schedule.</p>
      </div>
      {products.length === 0 ? (
        <RavenEmptyState
          title={isFilteredEmpty ? "No matches" : "No threat models yet"}
          message={
            isFilteredEmpty
              ? "No products have this status. Try a different filter."
              : "Upload a threat model report to populate this section."
          }
        />
      ) : (
        <div className="product-card-grid">
          {products.map((p) => (
            <RavenThreatModelCard key={p.id} product={p} onUpdateStatus={onUpdateStatus} />
          ))}
        </div>
      )}
    </section>
  );
}

function RavenPenTestPage({ products, onUpdateStatus }) {
  const summary = ravenComputePenTestSummary(products);
  const [statusFilter, setStatusFilter] = useState("all");

  const counts = useMemo(() => {
    const c = {};
    for (const p of products) {
      const status = p.penTest?.status ?? "not_started";
      c[status] = (c[status] ?? 0) + 1;
    }
    return c;
  }, [products]);

  const filtered =
    statusFilter === "all" ? products : products.filter((p) => (p.penTest?.status ?? "not_started") === statusFilter);

  return (
    <>
      <RavenSummaryBar summary={summary} completeLabel="Pen tests complete" />
      <RavenStatusFilter
        statusMap={RAVEN_PENTEST_STATUS}
        counts={counts}
        totalCount={products.length}
        value={statusFilter}
        onChange={setStatusFilter}
      />
      <RavenPenTestSection products={filtered} totalCount={products.length} onUpdateStatus={onUpdateStatus} />
    </>
  );
}

function RavenThreatModelPage({ products, onUpdateStatus }) {
  const summary = ravenComputeThreatModelSummary(products);
  const [statusFilter, setStatusFilter] = useState("all");

  const counts = useMemo(() => {
    const c = {};
    for (const p of products) {
      const status = p.threatModel?.status ?? "not_started";
      c[status] = (c[status] ?? 0) + 1;
    }
    return c;
  }, [products]);

  const filtered =
    statusFilter === "all" ? products : products.filter((p) => (p.threatModel?.status ?? "not_started") === statusFilter);

  return (
    <>
      <RavenSummaryBar summary={summary} completeLabel="Threat models complete" />
      <RavenStatusFilter
        statusMap={RAVEN_THREAT_MODEL_STATUS}
        counts={counts}
        totalCount={products.length}
        value={statusFilter}
        onChange={setStatusFilter}
      />
      <RavenThreatModelSection products={filtered} totalCount={products.length} onUpdateStatus={onUpdateStatus} />
    </>
  );
}

function RavenHeader() {
  return (
    <header className="app-header">
      <div className="app-header__title">
        <span className="app-header__logo-button" aria-hidden="true" style={{ color: "var(--accent)" }}>
          <IconRavenEye size={26} />
        </span>
        <div>
          <h1>Raven&rsquo;s Eye</h1>
          <p className="app-header__subtitle">Threat model &amp; pen test tracking</p>
        </div>
      </div>
    </header>
  );
}

const RAVEN_NAV_ITEMS = [
  { id: "pentest", label: "Pen Testing" },
  { id: "threatmodels", label: "Threat Models" },
  { id: "upload", label: "Upload Report" },
  { id: "export", label: "Export" },
];

function RavenNavBar({ tab, onChange }) {
  return (
    <nav className="nav-bar" aria-label="Sections">
      {RAVEN_NAV_ITEMS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-bar__link${tab === item.id ? " nav-bar__link--active" : ""}`}
          style={{ background: "transparent", border: "1px solid transparent", font: "inherit", cursor: "pointer" }}
          onClick={() => onChange(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}

// Lazily pull ExcelJS from its CDN only when an .xlsx/.xlsm report is
// uploaded or an Excel report is exported (batch 5) — same rationale as
// moLoadSheetJS above. Not reused for that loader: the report builder needs
// ExcelJS's cell-styling API (fills/borders/merges), which SheetJS doesn't
// expose the same way.
function ravenLoadExcelJS() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  if (window.__ravenExcelJSPromise) return window.__ravenExcelJSPromise;
  window.__ravenExcelJSPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js";
    s.integrity = "sha384-Pqp51FUN2/qzfxZxBCtF0stpc9ONI6MYZpVqmo8m20SoaQCzf+arZvACkLkirlPz";
    s.crossOrigin = "anonymous";
    s.onload = () => (window.ExcelJS ? resolve(window.ExcelJS) : reject(new Error("Spreadsheet library failed to initialize.")));
    s.onerror = () => {
      window.__ravenExcelJSPromise = null;
      reject(new Error("Couldn't load the spreadsheet library (are you offline?)."));
    };
    document.head.appendChild(s);
  });
  return window.__ravenExcelJSPromise;
}

// Lazily pull mammoth from its CDN only when a .docx report is uploaded.
function ravenLoadMammoth() {
  if (window.mammoth) return Promise.resolve(window.mammoth);
  if (window.__ravenMammothPromise) return window.__ravenMammothPromise;
  window.__ravenMammothPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/mammoth@1.12.0/mammoth.browser.min.js";
    s.integrity = "sha384-fWLn06AIo00H32MDcWUZTT+4Ru3OuoYn1DRH0o6JkhDl89YFSF4tJ4odze9bI+4r";
    s.crossOrigin = "anonymous";
    s.onload = () => (window.mammoth ? resolve(window.mammoth) : reject(new Error("Word-document library failed to initialize.")));
    s.onerror = () => {
      window.__ravenMammothPromise = null;
      reject(new Error("Couldn't load the Word-document library (are you offline?)."));
    };
    document.head.appendChild(s);
  });
  return window.__ravenMammothPromise;
}

// ---- Report text extraction (ported from fileText.js) ----
// .pdf reuses loadPdfJs() (defined near extractPdfText, top of file) — same
// on-demand pdf.js used by the Transactions PDF-statement import.
async function ravenExtractTextFromPdf(file) {
  await loadPdfJs();
  const buffer = await file.arrayBuffer();
  const doc = await window.pdfjsLib.getDocument({ data: buffer }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => item.str).join(" "));
  }
  return pages.join("\n\n");
}

async function ravenExtractTextFromDocx(file) {
  const mammoth = await ravenLoadMammoth();
  const buffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
}

async function ravenExtractTextFromXlsx(file) {
  const ExcelJS = await ravenLoadExcelJS();
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const lines = [];
  workbook.eachSheet((sheet) => {
    lines.push(`--- Sheet: ${sheet.name} ---`);
    sheet.eachRow((row) => {
      const cells = row.values
        .slice(1)
        .map((v) => (v == null ? "" : String(v)))
        .filter((v) => v !== "");
      if (cells.length > 0) lines.push(cells.join(" | "));
    });
  });
  return lines.join("\n");
}

async function ravenExtractTextFromFile(file) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return ravenExtractTextFromPdf(file);
  if (name.endsWith(".docx")) return ravenExtractTextFromDocx(file);
  if (name.endsWith(".xlsx") || name.endsWith(".xlsm")) return ravenExtractTextFromXlsx(file);
  throw new Error(`Unsupported file type: ${file.name}. Use .pdf, .docx, or .xlsx.`);
}

// ---- Deterministic, regex-based finding extraction (ported from
// extractFindings.js, unchanged) — pattern-matches against the report
// structures CorroDash was built against (TrollEye/CyberOptix-style pentest
// reports, STRIDE threat model docs, tabular xlsx risk registers). No AI
// involved; always a best-effort parse, review before importing. ----
const RAVEN_FINDING_SEVERITY_PATTERN = /\b(CRITICAL|HIGH|MEDIUM|LOW|INFORMATIONAL|INFO)\b/i;
const RAVEN_OPEN_STATUS_PATTERN = /\b(OPEN|UNRESOLVED)\b/i;
const RAVEN_FIXED_STATUS_PATTERN = /\b(CLOSED|FIXED|RESOLVED|REMEDIATED|MITIGATED)\b/i;
const RAVEN_STRIDE_PATTERN =
  /\[(Spoofing|Tampering|Repudiation|Information Disclosure|Denial of Service|Elevation of Privilege)\s*[—\-–]\s*([^\]]+)\]/gi;
const RAVEN_FINDING_HEADER_PATTERN = /\bFinding\s+(\d+)\b/gi;

function ravenNormalizeSeverity(text) {
  const match = text.match(RAVEN_FINDING_SEVERITY_PATTERN);
  if (!match) return "medium";
  const word = match[1].toUpperCase();
  if (word === "CRITICAL") return "critical";
  if (word === "HIGH") return "high";
  if (word === "MEDIUM") return "medium";
  if (word === "LOW") return "low";
  return "info";
}

function ravenNormalizeStatus(text) {
  if (RAVEN_FIXED_STATUS_PATTERN.test(text) && !RAVEN_OPEN_STATUS_PATTERN.test(text)) return "fixed";
  return "open";
}

function ravenExtractSection(block, headerPattern, stopPattern) {
  const start = block.search(headerPattern);
  if (start === -1) return "";
  const afterHeader = block.slice(start).replace(headerPattern, "");
  const stop = afterHeader.search(stopPattern);
  return (stop === -1 ? afterHeader : afterHeader.slice(0, stop)).trim().slice(0, 600);
}

function ravenFirstSentences(text, maxChars = 300) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > maxChars ? clean.slice(0, maxChars).trim() + "…" : clean;
}

function ravenStripTocLines(text) {
  return text
    .split("\n")
    .filter((line) => !/\.{3,}\s*\d{1,4}\s*$/.test(line.trim()))
    .join("\n");
}

function ravenDedupeByTitle(items) {
  const byTitle = new Map();
  for (const item of items) {
    const key = item.title.toLowerCase().trim();
    const existing = byTitle.get(key);
    if (!existing || item.description.length > existing.description.length) {
      byTitle.set(key, item);
    }
  }
  return [...byTitle.values()];
}

function ravenExtractByFindingHeaders(text) {
  const matches = [...text.matchAll(RAVEN_FINDING_HEADER_PATTERN)];
  if (matches.length === 0) return [];

  const blocks = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : text.length;
    blocks.push(text.slice(start, end));
  }

  return blocks.map((block) => {
    const lines = block
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);
    const title =
      lines.slice(1, 4).find((l) => l.length > 3 && !RAVEN_FINDING_SEVERITY_PATTERN.test(l) && !/^finding\s+\d+$/i.test(l)) ||
      lines[0] ||
      "Untitled finding";

    const summary = ravenExtractSection(block, /SUMMARY/i, /PENETRATION TESTER NOTES|Test Procedure|Remediation|References/i);
    const notes = ravenExtractSection(
      block,
      /PENETRATION TESTER NOTES/i,
      /Test Procedure|Primary Remediation|Secondary Remediation|Remediation|References/i
    );
    const fix = ravenExtractSection(block, /Primary Remediation[^\n]*|Remediation[^\n]*/i, /Secondary Remediation|References|\n\n\n/i);

    return {
      title: ravenFirstSentences(title, 120),
      description: ravenFirstSentences(summary || notes || block, 300),
      severity: ravenNormalizeSeverity(block),
      status: ravenNormalizeStatus(block),
      fix: ravenFirstSentences(fix, 300),
    };
  });
}

function ravenExtractByStrideBrackets(text) {
  const matches = [...text.matchAll(RAVEN_STRIDE_PATTERN)];
  if (matches.length === 0) return [];

  const blocks = [];
  for (let i = 0; i < matches.length; i++) {
    const start = matches[i].index;
    const end = i + 1 < matches.length ? matches[i + 1].index : Math.min(text.length, start + 800);
    blocks.push({ category: matches[i][1], component: matches[i][2].trim(), text: text.slice(start, end) });
  }

  return blocks.map(({ category, component, text: block }) => {
    const afterBracket = block.replace(RAVEN_STRIDE_PATTERN, "").trim();
    const fixMatch = block.match(/Mitigated(?: by)?[:\s]([^.]+\.)/i) || block.match(/(?:Fix|Recommend(?:ation)?s?)[:\s]([^.]+\.)/i);

    return {
      title: `${category}: ${component}`.slice(0, 120),
      description: ravenFirstSentences(afterBracket, 300),
      severity: ravenNormalizeSeverity(block),
      status: /Mitigated/i.test(block) ? "fixed" : "open",
      fix: fixMatch ? ravenFirstSentences(fixMatch[1], 300) : "",
    };
  });
}

function ravenExtractByTableRows(text) {
  const rows = text.split("\n").filter((l) => l.includes("|") && RAVEN_FINDING_SEVERITY_PATTERN.test(l));
  return rows.map((row) => {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    const title = cells.find((c) => !RAVEN_FINDING_SEVERITY_PATTERN.test(c) && c.length > 3) || cells[0] || "Untitled finding";
    return {
      title: ravenFirstSentences(title, 120),
      description: ravenFirstSentences(cells.join(" — "), 300),
      severity: ravenNormalizeSeverity(row),
      status: ravenNormalizeStatus(row),
      fix: ravenFirstSentences(cells[cells.length - 1] || "", 300),
    };
  });
}

function ravenExtractByParagraphs(text) {
  const paragraphs = text.split(/\n{2,}/).filter((p) => p.trim().length > 40 && RAVEN_FINDING_SEVERITY_PATTERN.test(p));
  return paragraphs.slice(0, 40).map((p) => ({
    title: ravenFirstSentences(p, 90),
    description: ravenFirstSentences(p, 300),
    severity: ravenNormalizeSeverity(p),
    status: ravenNormalizeStatus(p),
    fix: "",
  }));
}

const RAVEN_KNOWN_VENDORS = ["TrollEye Security", "CyberOptix", "Aergo Solutions"];

function ravenExtractReportMeta(text) {
  const head = text.slice(0, 3000);
  const vendor = RAVEN_KNOWN_VENDORS.find((v) => head.includes(v));
  const preparedByMatch = head.match(/Prepared by:\s*([^\n]+)/i);

  const isoDate = head.match(/\b(\d{4}-\d{2}-\d{2})\b/);
  const longDate = head.match(
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{1,2}),?\s+(\d{4})\b/
  );

  let date = null;
  if (isoDate) {
    date = isoDate[1];
  } else if (longDate) {
    const d = new Date(`${longDate[1]} ${longDate[2]}, ${longDate[3]}`);
    if (!Number.isNaN(d.getTime())) date = d.toISOString().slice(0, 10);
  }

  return {
    tester: vendor || (preparedByMatch ? preparedByMatch[1].trim() : ""),
    date,
  };
}

function ravenExtractFindings(rawText) {
  const text = ravenStripTocLines(rawText);
  const strategies = [ravenExtractByFindingHeaders(text), ravenExtractByStrideBrackets(text), ravenExtractByTableRows(text)];
  const best = strategies.reduce((a, b) => (b.length > a.length ? b : a), []);
  const result = best.length > 0 ? best : ravenExtractByParagraphs(text);
  return ravenDedupeByTitle(result);
}

const RAVEN_UPLOAD_SEVERITY_OPTIONS = Object.keys(RAVEN_SEVERITY);
const RAVEN_UPLOAD_STATUS_OPTIONS = Object.keys(RAVEN_FINDING_STATUS);

function RavenUploadPage({ products, setProducts }) {
  const [file, setFile] = useState(null);
  const [category, setCategory] = useState("penTest");
  const [productName, setProductName] = useState("");
  const [meta, setMeta] = useState({ tester: "", date: "" });
  const [candidates, setCandidates] = useState(null);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const productNames = [...new Set(products.map((p) => p.name))];

  async function handleExtract() {
    if (!file) return;
    setExtracting(true);
    setExtractError("");
    setCandidates(null);
    setImportResult(null);
    try {
      const text = await ravenExtractTextFromFile(file);
      const found = ravenExtractFindings(text);
      const reportMeta = ravenExtractReportMeta(text);
      setMeta({ tester: reportMeta.tester, date: reportMeta.date || "" });
      setCandidates(found);
    } catch (err) {
      setExtractError(err.message || String(err));
    } finally {
      setExtracting(false);
    }
  }

  function updateCandidate(index, patch) {
    setCandidates((prev) => prev.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  }

  function removeCandidate(index) {
    setCandidates((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleImport() {
    if (!candidates || candidates.length === 0 || !productName.trim()) return;
    setImporting(true);
    setImportResult(null);
    try {
      let reportFileId = null;
      if (file) {
        reportFileId = `${ravenSlugify(productName)}-${category}-${Date.now()}`;
        await dbPutRavenReport({ id: reportFileId, name: file.name, blob: file });
      }
      const result = ravenImportFindings(products, {
        productName: productName.trim(),
        category,
        items: candidates,
        meta: { tester: meta.tester, date: meta.date || null, reportRef: file?.name || "", reportFileId },
      });
      setProducts(result.products);
      setImportResult({ ok: true, imported: result.imported });
      setCandidates(null);
      setFile(null);
    } catch (err) {
      setImportResult({ ok: false, error: err.message || String(err) });
    } finally {
      setImporting(false);
    }
  }

  return (
    <section className="dashboard-section" aria-labelledby="upload-heading">
      <div className="dashboard-section__header">
        <h2 id="upload-heading">Upload a report</h2>
        <p className="dashboard-section__subtitle">
          Extracts findings by pattern-matching the report text — no AI involved. Review and edit before importing.
        </p>
      </div>

      <div className="upload-form">
        <div className="upload-form__row">
          <label className="upload-form__field">
            <span>Report file</span>
            <input
              type="file"
              accept=".pdf,.docx,.xlsx,.xlsm"
              onChange={(e) => {
                setFile(e.target.files[0] || null);
                setCandidates(null);
                setImportResult(null);
              }}
            />
          </label>

          <label className="upload-form__field">
            <span>Add to</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="penTest">Pen Testing</option>
              <option value="threatModel">Threat Models</option>
            </select>
          </label>

          <label className="upload-form__field">
            <span>Product</span>
            <input
              type="text"
              list="raven-product-names"
              placeholder="e.g. WISER"
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
            />
            <datalist id="raven-product-names">
              {productNames.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
          </label>

          <button type="button" className="btn btn--primary" disabled={!file || extracting} onClick={handleExtract}>
            {extracting ? "Extracting…" : "Extract findings"}
          </button>
        </div>

        {extractError && <p className="upload-form__error">{extractError}</p>}
      </div>

      {candidates && (
        <div className="upload-review">
          <div className="upload-review__header">
            <p>
              <strong>{candidates.length}</strong> candidate finding{candidates.length === 1 ? "" : "s"} extracted from{" "}
              <strong>{file?.name}</strong>. Review and correct before importing — pattern-matching is best-effort.
            </p>
            <div className="upload-review__meta">
              <label>
                <span>Tester / vendor</span>
                <input type="text" value={meta.tester} onChange={(e) => setMeta((m) => ({ ...m, tester: e.target.value }))} />
              </label>
              <label>
                <span>Report date</span>
                <input type="date" value={meta.date} onChange={(e) => setMeta((m) => ({ ...m, date: e.target.value }))} />
              </label>
            </div>
          </div>

          {candidates.length === 0 ? (
            <p className="upload-form__error">
              No findings matched. Try a different file, or this report's format isn't recognized yet.
            </p>
          ) : (
            <div className="risk-table-wrap">
              <table className="risk-table upload-review__table">
                <thead>
                  <tr>
                    <th scope="col">Title</th>
                    <th scope="col">Severity</th>
                    <th scope="col">Status</th>
                    <th scope="col">Fix</th>
                    <th scope="col"></th>
                  </tr>
                </thead>
                <tbody>
                  {candidates.map((c, i) => (
                    <tr key={i}>
                      <td data-label="Title">
                        <input type="text" value={c.title} onChange={(e) => updateCandidate(i, { title: e.target.value })} />
                        {c.description && <span className="risk-table__description">{c.description}</span>}
                      </td>
                      <td data-label="Severity">
                        <select value={c.severity} onChange={(e) => updateCandidate(i, { severity: e.target.value })}>
                          {RAVEN_UPLOAD_SEVERITY_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {RAVEN_SEVERITY[s].label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td data-label="Status">
                        <select value={c.status} onChange={(e) => updateCandidate(i, { status: e.target.value })}>
                          {RAVEN_UPLOAD_STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {RAVEN_FINDING_STATUS[s].label}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td data-label="Fix">
                        <textarea value={c.fix} onChange={(e) => updateCandidate(i, { fix: e.target.value })} />
                      </td>
                      <td data-label="">
                        <button type="button" className="btn btn--ghost" onClick={() => removeCandidate(i)}>
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="upload-review__actions">
            <button
              type="button"
              className="btn btn--primary"
              disabled={importing || candidates.length === 0 || !productName.trim()}
              onClick={handleImport}
            >
              {importing
                ? "Importing…"
                : `Import ${candidates.length} finding${candidates.length === 1 ? "" : "s"} to ${productName || "…"}`}
            </button>
            {!productName.trim() && <span className="upload-form__error">Enter a product name above first.</span>}
          </div>
        </div>
      )}

      {importResult && (
        <p className={importResult.ok ? "upload-form__success" : "upload-form__error"}>
          {importResult.ok
            ? `Imported ${importResult.imported} finding${importResult.imported === 1 ? "" : "s"} — it's live on the dashboard now.`
            : `Import failed: ${importResult.error}`}
        </p>
      )}
    </section>
  );
}



// ---- Product-status report builders (ported from exportReport.js +
// exportReportPdf.js) — same per-row summarization (ravenSummarizeReport)
// feeds both the Excel and PDF builders, so "what a row means" only lives
// in one place. ----
const RAVEN_REPORT_COLUMNS = [
  { header: "Product", key: "product", width: 26 },
  { header: "Team / Point of Contact", key: "team", width: 34 },
  { header: "Threat Model Status", key: "tmStatus", width: 18 },
  { header: "TM Last Reviewed", key: "tmLastReviewed", width: 16 },
  { header: "TM Open Risks", key: "tmOpenRisks", width: 14 },
  { header: "Pen Test Status", key: "ptStatus", width: 18 },
  { header: "PT Last Engagement", key: "ptLastEngagement", width: 16 },
  { header: "PT Open Findings", key: "ptOpenFindings", width: 14 },
  { header: "Next Retest Due", key: "nextRetest", width: 16 },
];

function ravenStyleStatusCell(cell, label, tone) {
  const colors = RAVEN_TONE_COLORS[tone] ?? RAVEN_TONE_COLORS.muted;
  cell.value = label;
  cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${colors.hex}` } };
  cell.font = { color: { argb: `FF${colors.textHex}` }, bold: true, size: 11 };
  cell.alignment = { horizontal: "center", vertical: "middle" };
}

async function ravenBuildProductStatusWorkbook(products, { generatedAt = new Date() } = {}) {
  const ExcelJS = await ravenLoadExcelJS();
  const report = ravenSummarizeReport(products, { generatedAt });
  const border = { style: "thin", color: { argb: `FF${RAVEN_BRAND.border}` } };

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Raven's Eye";
  workbook.created = generatedAt;

  const sheet = workbook.addWorksheet("Product Status", { views: [{ state: "frozen", ySplit: 6 }] });
  sheet.columns = RAVEN_REPORT_COLUMNS;

  sheet.mergeCells(1, 1, 1, RAVEN_REPORT_COLUMNS.length);
  const titleCell = sheet.getCell(1, 1);
  titleCell.value = "Raven's Eye — Product Security Status Report";
  titleCell.font = { size: 16, bold: true, color: { argb: "FFFFFFFF" } };
  titleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${RAVEN_BRAND.title}` } };
  titleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet.getRow(1).height = 28;

  sheet.mergeCells(2, 1, 2, RAVEN_REPORT_COLUMNS.length);
  const subtitleCell = sheet.getCell(2, 1);
  subtitleCell.value = `Generated ${generatedAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`;
  subtitleCell.font = { size: 10, italic: true, color: { argb: "FFFFFFFF" } };
  subtitleCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${RAVEN_BRAND.title}` } };
  subtitleCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };

  sheet.mergeCells(3, 1, 3, RAVEN_REPORT_COLUMNS.length);
  const summaryCell = sheet.getCell(3, 1);
  summaryCell.value = `Threat models complete: ${report.tmComplete} of ${report.productsCount}      Pen tests complete: ${report.ptComplete} of ${report.productsCount}`;
  summaryCell.font = { size: 11, bold: true, color: { argb: `FF${RAVEN_BRAND.header}` } };
  summaryCell.alignment = { vertical: "middle", horizontal: "left", indent: 1 };
  sheet.getRow(3).height = 20;

  sheet.getRow(4).height = 8;

  const headerRow = sheet.getRow(5);
  headerRow.values = RAVEN_REPORT_COLUMNS.map((c) => c.header);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${RAVEN_BRAND.header}` } };
    cell.alignment = { vertical: "middle", horizontal: "left", wrapText: true };
    cell.border = { bottom: { style: "medium", color: { argb: `FF${RAVEN_BRAND.header}` } } };
  });
  headerRow.height = 30;

  sheet.autoFilter = { from: { row: 5, column: 1 }, to: { row: 5, column: RAVEN_REPORT_COLUMNS.length } };

  report.rows.forEach((r, i) => {
    const row = sheet.getRow(6 + i);

    row.getCell(1).value = r.name;
    row.getCell(1).font = { bold: true };
    row.getCell(2).value = r.team;
    ravenStyleStatusCell(row.getCell(3), r.tmStatusLabel, r.tmStatusTone);
    row.getCell(4).value = r.tmLastReviewed;
    row.getCell(5).value = r.tmOpenRisks;
    ravenStyleStatusCell(row.getCell(6), r.ptStatusLabel, r.ptStatusTone);
    row.getCell(7).value = r.ptLastEngagement;
    row.getCell(8).value = r.ptOpenFindings;
    ravenStyleStatusCell(row.getCell(9), r.retestLabel, r.retestTone);

    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      cell.border = { ...cell.border, top: border, bottom: border, left: border, right: border };
      if (colNumber === 5 || colNumber === 8) cell.alignment = { horizontal: "center" };
      if (i % 2 === 1 && ![3, 6, 9].includes(colNumber)) {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: `FF${RAVEN_BRAND.band}` } };
      }
    });
    row.height = 20;
  });

  return workbook;
}

const RAVEN_PDF_COLUMNS = [
  { label: "Product", width: 85 },
  { label: "Team / Point of Contact", width: "*" },
  { label: "Threat Model", width: 62 },
  { label: "TM Reviewed", width: 52 },
  { label: "TM Open", width: 34 },
  { label: "Pen Test", width: 62 },
  { label: "PT Engaged", width: 52 },
  { label: "PT Open", width: 34 },
  { label: "Next Retest", width: 58 },
];

function ravenPdfStatusCell(label, tone) {
  const colors = RAVEN_TONE_COLORS[tone] ?? RAVEN_TONE_COLORS.muted;
  return {
    text: label,
    fillColor: `#${colors.hex}`,
    color: `#${colors.textHex}`,
    bold: true,
    fontSize: 8,
    alignment: "center",
    margin: [0, 3, 0, 3],
  };
}

function ravenPdfCentered(value) {
  return { text: String(value), alignment: "center" };
}

function ravenBuildProductStatusDocDefinition(products, { generatedAt = new Date() } = {}) {
  const report = ravenSummarizeReport(products, { generatedAt });

  const body = [
    RAVEN_PDF_COLUMNS.map((c) => ({ text: c.label, style: "tableHeader" })),
    ...report.rows.map((r) => [
      { text: r.name, bold: true, fontSize: 8 },
      { text: r.team, fontSize: 8 },
      ravenPdfStatusCell(r.tmStatusLabel, r.tmStatusTone),
      { text: r.tmLastReviewed, fontSize: 8 },
      ravenPdfCentered(r.tmOpenRisks),
      ravenPdfStatusCell(r.ptStatusLabel, r.ptStatusTone),
      { text: r.ptLastEngagement, fontSize: 8 },
      ravenPdfCentered(r.ptOpenFindings),
      ravenPdfStatusCell(r.retestLabel, r.retestTone),
    ]),
  ];

  return {
    pageSize: "A4",
    pageOrientation: "landscape",
    pageMargins: [28, 28, 28, 32],
    content: [
      { text: "Raven's Eye — Product Security Status Report", style: "title" },
      {
        text: `Generated ${generatedAt.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}`,
        style: "subtitle",
      },
      {
        text: `Threat models complete: ${report.tmComplete} of ${report.productsCount}      Pen tests complete: ${report.ptComplete} of ${report.productsCount}`,
        style: "summary",
      },
      {
        table: {
          headerRows: 1,
          widths: RAVEN_PDF_COLUMNS.map((c) => c.width),
          body,
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) return `#${RAVEN_BRAND.header}`;
            return rowIndex % 2 === 0 ? `#${RAVEN_BRAND.band}` : null;
          },
          hLineColor: () => `#${RAVEN_BRAND.border}`,
          vLineColor: () => `#${RAVEN_BRAND.border}`,
          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,
          paddingTop: () => 4,
          paddingBottom: () => 4,
          paddingLeft: () => 5,
          paddingRight: () => 5,
        },
      },
    ],
    styles: {
      title: { fontSize: 16, bold: true, color: `#${RAVEN_BRAND.title}`, margin: [0, 0, 0, 2] },
      subtitle: { fontSize: 9, italics: true, color: "#6b6478", margin: [0, 0, 0, 6] },
      summary: { fontSize: 11, bold: true, color: `#${RAVEN_BRAND.header}`, margin: [0, 0, 0, 10] },
      tableHeader: { bold: true, color: "#FFFFFF", fontSize: 9 },
    },
    defaultStyle: { font: "Roboto", fontSize: 9 },
  };
}

function ravenTodayStamp() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function RavenExportPage({ products }) {
  const [generating, setGenerating] = useState(null);
  const [error, setError] = useState("");

  const ownerCount = products.filter((p) => p.owner).length;

  async function handleExportExcel() {
    setGenerating("xlsx");
    setError("");
    try {
      const workbook = await ravenBuildProductStatusWorkbook(products);
      const buffer = await workbook.xlsx.writeBuffer();
      moDownload(
        `ravens-eye-product-status-${ravenTodayStamp()}.xlsx`,
        buffer,
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      );
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setGenerating(null);
    }
  }

  async function handleExportPdf() {
    setGenerating("pdf");
    setError("");
    try {
      const pdfMake = await ravenLoadPdfMake();
      const docDefinition = ravenBuildProductStatusDocDefinition(products);
      await pdfMake.createPdf(docDefinition).download(`ravens-eye-product-status-${ravenTodayStamp()}.pdf`);
    } catch (err) {
      setError(err.message || String(err));
    } finally {
      setGenerating(null);
    }
  }

  return (
    <section className="dashboard-section" aria-labelledby="export-heading">
      <div className="dashboard-section__header">
        <h2 id="export-heading">Export report</h2>
        <p className="dashboard-section__subtitle">
          A ready-to-send report of every product with its team, threat model status, and pen test status — for status
          requests without digging through the dashboard.
        </p>
      </div>

      <div className="export-panel">
        <div className="export-panel__info">
          <h3>Product Status Report</h3>
          <p>
            One row per product ({products.length} total): point of contact, threat model status &amp; last review, pen
            test status &amp; last engagement, open risk/finding counts, and next retest due — color-coded to match the
            dashboard.
          </p>
          {ownerCount < products.length && (
            <p className="export-panel__note">
              {products.length - ownerCount} of {products.length} products don't have a point of contact on file yet —
              those rows will show "—" in the Team column.
            </p>
          )}
        </div>
        <div className="export-panel__actions">
          <button type="button" className="btn btn--primary" onClick={handleExportExcel} disabled={generating !== null}>
            {generating === "xlsx" ? "Generating…" : "Download Excel (.xlsx)"}
          </button>
          <button type="button" className="btn btn--primary" onClick={handleExportPdf} disabled={generating !== null}>
            {generating === "pdf" ? "Generating…" : "Download PDF (.pdf)"}
          </button>
        </div>
      </div>

      {error && <p className="upload-form__error">Export failed: {error}</p>}
    </section>
  );
}

function RavenSection({ theme, products, setProducts }) {
  const [tab, setTab] = useState("pentest");

  function handleUpdateStatus(productId, category, status) {
    setProducts((prev) => ravenUpdateStatus(prev, productId, category, status));
  }

  return (
    <RavenShadowRoot theme={theme}>
      <div className="raven-app">
        <div className="app-shell">
          <div className="app-topbar">
            <RavenHeader />
            <RavenNavBar tab={tab} onChange={setTab} />
          </div>
          <main className="app-main">
            {tab === "pentest" && <RavenPenTestPage products={products} onUpdateStatus={handleUpdateStatus} />}
            {tab === "threatmodels" && <RavenThreatModelPage products={products} onUpdateStatus={handleUpdateStatus} />}
            {tab === "upload" && <RavenUploadPage products={products} setProducts={setProducts} />}
            {tab === "export" && <RavenExportPage products={products} />}
          </main>
        </div>
      </div>
    </RavenShadowRoot>
  );
}


window.__vChunks = window.__vChunks || {};
window.__vChunks.ravenseye = { RavenSection };
