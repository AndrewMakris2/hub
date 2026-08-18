// Mechanical Orchard security-tooling suite + SecurityX chunk — compiled
// separately by build.js and lazy-loaded via loadChunk("mechanicalorchard",
// ...) only when a tool is actually opened (from the sidebar menu, Cmd-K
// search, or the SecurityX page route) instead of shipping with every page
// load. See app.jsx for the loadChunk()/window.__v bridge this depends on.
const { useState, useEffect, useMemo, useRef, useContext } = React;
const {
  loadPdfJs, moDownload, moFormatTs, moDefaultPolicies, useOverlayBehaviour, MoEmbedContext,
  Card, EmptyState, SectionLabel, IconClose,
  DEFAULT_APP_NOTICE, DEFAULT_DAILY_LOG, DEFAULT_KEV,
  IconCertificate, IconClipboard, IconDeck, IconEnvelope, IconMegaphone, IconShield, IconWrench,
  MoButton, STORAGE_KEYS, cardBackgroundStyle, formatBytes, saveJSON, timeAgo, truncate, usePersistentState,
  toast, IconBookOpen, IconBulb, IconChecklist, IconLock, IconShare, IconTrendingUp, IconUpload,
  MO_SEVERITY_ORDER, MO_SOURCE_HINTS, moFindingKeyOf, moDiffFindings,
} = window.__v;

/* ----------------------------------------------------------------------
   MECHANICAL ORCHARD — security tooling suite
   Pulled in from a separate branch (claude/site-review-t0e6yk) at the
   user's request: Vulnerability Analyzer (S1/IRU CSV severity breakdown +
   daily log), PKI Report Generator, Policy & Procedure tracker (with
   IndexedDB-backed document uploads), and a weekly PowerPoint deck builder
   (.pptx template filler via the inlined fflate zip library). Ported
   verbatim from that branch's index.html — none of this depends on or
   overlaps with the Fantasy tab or anything else in this file.
---------------------------------------------------------------------- */



// Starter field set for the PKI report. Edit/extend this list to change the
// generated report — `multiline: true` renders a textarea. `id` is the
// persistence key, so keep ids stable when tweaking labels.
const PKI_REPORT_FIELDS = [
  { id: "title", label: "Report Title", placeholder: "PKI Certificate Report" },
  { id: "date", label: "Report Date", placeholder: "2026-08-10" },
  { id: "preparedBy", label: "Prepared By", placeholder: "Your name" },
  { id: "environment", label: "Environment / System", placeholder: "Production" },
  { id: "caName", label: "Certificate Authority (CA) Name", placeholder: "Issuing CA 01" },
  { id: "caType", label: "CA Type", placeholder: "Root / Issuing / Subordinate" },
  { id: "commonName", label: "Certificate Common Name (CN)", placeholder: "*.example.com" },
  { id: "serial", label: "Serial Number", placeholder: "00:a1:b2:c3…" },
  { id: "validFrom", label: "Valid From", placeholder: "2026-01-01" },
  { id: "validTo", label: "Valid To", placeholder: "2027-01-01" },
  { id: "keyAlg", label: "Key Algorithm / Size", placeholder: "RSA 2048 / ECDSA P-256" },
  { id: "sigAlg", label: "Signature Algorithm", placeholder: "SHA-256 with RSA" },
  { id: "thumbprint", label: "Thumbprint (SHA-256)", placeholder: "AB:CD:…" },
  { id: "summary", label: "Summary / Findings", placeholder: "Overview of certificate posture…", multiline: true },
  { id: "recommendations", label: "Recommendations", placeholder: "Next steps / remediation…", multiline: true },
];

// Ordered severity buckets + fixed colors that read on any Vantage theme.
// MO_SEVERITY_ORDER itself lives in core (bridged in below) — MoDashboard
// needs it before this chunk has loaded.
const MO_SEVERITY_COLORS = {
  Critical: "#c0392b",
  High: "#e07a20",
  Medium: "#c9a227",
  Low: "#2f8f4e",
  Info: "#5b7a99",
  Unrated: "#9a9a94",
};

const MO_SEVERITY_WORDS = {
  critical: "Critical", crit: "Critical", "very high": "Critical", urgent: "Critical", sev1: "Critical",
  high: "High", important: "High", severe: "High", major: "High", sev2: "High",
  medium: "Medium", moderate: "Medium", med: "Medium", warning: "Medium", sev3: "Medium",
  low: "Low", minor: "Low", sev4: "Low",
  info: "Info", informational: "Info", information: "Info", none: "Info", negligible: "Info", note: "Info",
};
function moNormalizeSeverity(raw) {
  const s = String(raw == null ? "" : raw).toLowerCase().trim();
  if (!s) return "Unrated";
  // Whole-token match first. Substring matching used to turn "Modified" into
  // Medium and "Windows Media Player" into Medium, and it missed Microsoft's
  // own vocabulary ("Important", "Severe") entirely.
  if (MO_SEVERITY_WORDS[s]) return MO_SEVERITY_WORDS[s];
  const word = s.match(/[a-z]+(?: [a-z]+)?/);
  if (word && MO_SEVERITY_WORDS[word[0]]) return MO_SEVERITY_WORDS[word[0]];
  if (/\bcrit/.test(s)) return "Critical";
  if (/\bhigh\b/.test(s)) return "High";
  if (/\bmedium\b|\bmoderate\b/.test(s)) return "Medium";
  if (/\blow\b/.test(s)) return "Low";
  if (/\binfo/.test(s) || /\bnone\b/.test(s) || /\bnegli/.test(s)) return "Info";
  // Fall back to a CVSS-style numeric score if present.
  const n = parseFloat(s);
  if (!isNaN(n)) {
    if (n >= 9) return "Critical";
    if (n >= 7) return "High";
    if (n >= 4) return "Medium";
    if (n > 0) return "Low";
    return "Info";
  }
  return "Unrated";
}

// Minimal RFC-4180-ish CSV parser (handles quoted fields, embedded commas,
// escaped quotes, and CRLF). Returns an array of string rows.
// Excel writes ';' in many locales and some exports are tab-separated. Sniff
// the header line so those don't silently parse as one giant column.
function moSniffDelimiter(text) {
  const line = String(text || "").split(/\r?\n/)[0] || "";
  let best = ",", bestN = 0;
  [",", ";", "\t", "|"].forEach((d) => {
    let n = 0, q = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') q = !q;
      else if (c === d && !q) n++;
    }
    if (n > bestN) { bestN = n; best = d; }
  });
  return best;
}

function moParseCSV(text, delimiter) {
  const delim = delimiter || moSniffDelimiter(text);
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === delim) {
      row.push(field); field = "";
    } else if (c === "\n") {
      row.push(field); rows.push(row); row = []; field = "";
    } else if (c !== "\r") {
      field += c;
    }
  }
  if (field.length > 0 || row.length > 0) { row.push(field); rows.push(row); }
  return rows;
}

// First non-empty row becomes headers; the rest become {header: value} records.
function moRowsToRecords(rows) {
  const clean = rows.filter((r) => r.some((c) => String(c).trim() !== ""));
  if (clean.length === 0) return { headers: [], records: [] };
  const seen = {};
  const headers = clean[0].map((h, i) => {
    let name = String(h).trim() || `Column ${i + 1}`;
    if (seen[name]) { seen[name] += 1; name = `${name} (${seen[name]})`; }
    else seen[name] = 1;
    return name;
  });
  const records = clean.slice(1).map((r) => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = r[i] == null ? "" : String(r[i]); });
    return obj;
  });
  return { headers, records };
}

// Best-guess column match: first header whose lowercased name contains any
// of the candidate substrings.
function moDetectColumn(headers, candidates, taken) {
  const claimed = taken || [];
  const lower = headers.map((h) => h.toLowerCase());
  for (const cand of candidates) {
    const idx = lower.findIndex((h, i) => h.includes(cand) && claimed.indexOf(headers[i]) === -1);
    if (idx !== -1) return headers[idx];
  }
  return "";
}

// Column hints per source. Auto-detection tries these in order, but the user
// can always override via the mapping dropdowns. MO_SOURCE_HINTS itself lives
// in core (bridged in below) — MoDashboard needs it before this chunk has
// loaded.

// Lazily pull SheetJS from its CDN only when an .xlsx/.xls file is dropped —
// CSV never needs it, and this keeps the initial page weightless.
function moLoadSheetJS() {
  if (window.XLSX) return Promise.resolve(window.XLSX);
  if (window.__moXlsxPromise) return window.__moXlsxPromise;
  window.__moXlsxPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js";
    s.integrity = "sha384-EnyY0/GSHQGSxSgMwaIPzSESbqoOLSexfnSMN2AP+39Ckmn92stwABZynq1JyzdT";
    s.crossOrigin = "anonymous";
    s.onload = () => (window.XLSX ? resolve(window.XLSX) : reject(new Error("Spreadsheet library failed to initialize.")));
    s.onerror = () => { window.__moXlsxPromise = null; reject(new Error("Couldn't load the spreadsheet library (are you offline?). Export as CSV and try again.")); };
    document.head.appendChild(s);
  });
  return window.__moXlsxPromise;
}

async function moParseSpreadsheet(file) {
  const name = (file.name || "").toLowerCase();
  const isCsv = name.endsWith(".csv") || file.type === "text/csv" || name.endsWith(".txt");
  if (isCsv) {
    const text = await file.text();
    return moRowsToRecords(moParseCSV(text));
  }
  const XLSX = await moLoadSheetJS();
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const arr = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: "" });
  return moRowsToRecords(arr.map((r) => r.map((c) => (c == null ? "" : String(c)))));
}



function moCsvCell(v) {
  const s = String(v == null ? "" : v);
  return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}



/* ---- Policy & Procedure tracker: statuses, starter catalog, doc storage ---- */
const POLICY_STATUSES = [
  { id: "todo", label: "Not started", color: "#9a9a94" },
  { id: "in_progress", label: "In progress", color: "#c9a227" },
  { id: "review", label: "In review", color: "#5b7a99" },
  { id: "done", label: "Complete", color: "#2f8f4e" },
];
const POLICY_STATUS_LABEL = {};
const POLICY_STATUS_COLOR = {};
POLICY_STATUSES.forEach((s) => { POLICY_STATUS_LABEL[s.id] = s.label; POLICY_STATUS_COLOR[s.id] = s.color; });



// Uploaded policy documents live in IndexedDB (like the video library) so real
// PDFs/DOCX don't blow the localStorage quota. Metadata stays on the record.
const POLICY_DB_NAME = "vantage-policydocs";
const POLICY_STORE = "docs";
function openPolicyDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) { reject(new Error("This browser doesn't support local document storage.")); return; }
    const req = indexedDB.open(POLICY_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(POLICY_STORE)) db.createObjectStore(POLICY_STORE, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbPutPolicyDoc(record) {
  const db = await openPolicyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(POLICY_STORE, "readwrite");
    tx.objectStore(POLICY_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbGetPolicyDoc(id) {
  const db = await openPolicyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(POLICY_STORE, "readonly");
    const req = tx.objectStore(POLICY_STORE).get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}
async function dbDeletePolicyDoc(id) {
  const db = await openPolicyDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(POLICY_STORE, "readwrite");
    tx.objectStore(POLICY_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ---- PowerPoint (.pptx) template filler ----
   A .pptx is a zip of XML. We find {{token}} placeholders in the slide XML,
   collect them into a form, then swap the typed values back in and re-zip a
   fresh deck — layout/fonts/branding untouched. All in-browser via fflate.
   The template blob is reused from the policy IndexedDB store under a
   reserved id; the token list + typed values persist in localStorage. */
const DECK_TEMPLATE_ID = "__deck_template__";
// Which parts of the package we scan/fill (slide + speaker-note text).
// Lazily pull fflate from its CDN only when a .pptx template is scanned or
// filled — used to ship inlined so the deck builder worked offline, but that
// meant every page load parsed and ran it even for sessions that never touch
// the deck builder. Same rationale as moLoadSheetJS above.
function loadFflate() {
  if (window.fflate) return Promise.resolve(window.fflate);
  if (window.__fflatePromise) return window.__fflatePromise;
  window.__fflatePromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "fflate.min.js";
    s.onload = () => (window.fflate ? resolve(window.fflate) : reject(new Error("Zip engine failed to initialize.")));
    s.onerror = () => {
      window.__fflatePromise = null;
      reject(new Error("Couldn't load the zip engine (are you offline?)."));
    };
    document.head.appendChild(s);
  });
  return window.__fflatePromise;
}

const DECK_XML_RE = /^ppt\/(slides|notesSlides)\/[^/]+\.xml$/;

function xmlEscape(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&apos;")
    .replace(/\r?\n/g, " ");
}

// PowerPoint often splits a typed token across runs (…{{bloc</a:t>…<a:t>ked}}).
// Stripping the tags that fall *inside* a {{…}} span re-joins it into one run
// so token matching is reliable.
function deckDesplitTokens(xml) {
  const stitch = (chunk) => chunk.replace(/\{\{[^{}]*?\}\}/g, (m) => m.replace(/<[^>]*>/g, ""));
  // Bounded to one paragraph: PowerPoint splits a token across runs inside a
  // paragraph, never across paragraphs, so this still stitches every real
  // token while an unclosed "{{" can no longer swallow the rest of the slide.
  const hasParas = /<a:p[ >]/.test(xml);
  return hasParas ? xml.replace(/<a:p(?:\s[^>]*)?>[\s\S]*?<\/a:p>/g, stitch) : stitch(xml);
}

function deckFindTokens(xml) {
  const clean = deckDesplitTokens(xml);
  const out = [];
  const re = /\{\{\s*([^{}]+?)\s*\}\}/g;
  const VALID = /^[A-Za-z0-9 _.-]{1,60}$/;
  let m;
  // A malformed placeholder (stray tag, runaway brace) must not become a field.
  while ((m = re.exec(clean)) !== null) {
    const name = m[1].trim();
    if (VALID.test(name)) out.push(name);
  }
  return out;
}

function deckFillXml(xml, values) {
  const clean = deckDesplitTokens(xml);
  return clean.replace(/\{\{\s*([^{}]+?)\s*\}\}/g, (full, name) => {
    const key = name.trim();
    return Object.prototype.hasOwnProperty.call(values, key) ? xmlEscape(values[key]) : full;
  });
}

// Read a .pptx File → { tokens: [unique, in first-seen order], fileCount }.
async function deckScanTemplate(file) {
  await loadFflate();
  const buf = new Uint8Array(await file.arrayBuffer());
  const files = window.fflate.unzipSync(buf);
  const dec = new TextDecoder();
  const seen = new Set();
  const tokens = [];
  let malformed = 0;
  Object.keys(files).forEach((path) => {
    if (!DECK_XML_RE.test(path)) return;
    const xml = dec.decode(files[path]);
    const found = deckFindTokens(xml);
    found.forEach((t) => {
      if (!seen.has(t)) { seen.add(t); tokens.push(t); }
    });
    // Every "{{" should have produced a token. Anything left over is a typo
    // (usually a missing closing brace) and the user needs to know.
    const opens = (deckDesplitTokens(xml).match(/\{\{/g) || []).length;
    if (opens > found.length) malformed += opens - found.length;
  });
  return { tokens, malformed };
}

// Read the stored template blob, fill every slide, and return a new .pptx Blob.
async function deckGenerate(values) {
  await loadFflate();
  const rec = await dbGetPolicyDoc(DECK_TEMPLATE_ID);
  if (!rec || !rec.blob) throw new Error("No template stored — upload your deck first.");
  const buf = new Uint8Array(await rec.blob.arrayBuffer());
  const files = window.fflate.unzipSync(buf);
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  Object.keys(files).forEach((path) => {
    if (!DECK_XML_RE.test(path)) return;
    const filled = deckFillXml(dec.decode(files[path]), values);
    files[path] = enc.encode(filled);
  });
  const out = window.fflate.zipSync(files);
  return new Blob([out], { type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" });
}









/* ---- Shared modal shell for MO tools ---- */
/* ----------------------------------------------------------------------
   MO tool onboarding.

   Each Mechanical Orchard tool opens with a short worked example of how it
   fits an analyst's actual workflow. Once it's understood, "Got it" hides
   it for good (per tool, persisted); the "?" in the header brings it back.
   Steps reference the real control labels, so they stay useful rather than
   decorative.
---------------------------------------------------------------------- */
const MO_HELP = {
  "vuln-s1": {
    headline: "Turn a raw scanner export into a prioritized list",
    steps: [
      "Pick the source tab at the top — S1 and IRU keep completely separate uploads and snapshots.",
      "Drop the export in (.csv, .xlsx or .xls), or click to browse.",
      "Check the detected Severity / Asset / Vulnerability columns and correct them if the export uses different headers.",
      "Review the severity breakdown and the filtered findings table.",
      "Hit “Save snapshot” — that is what the Daily InfoSec Log and Vulnerability Trends read from.",
    ],
    example: {
      title: "A typical Monday",
      body: "Export last week's SentinelOne findings to CSV, drop it here, confirm the column mapping, then save a snapshot. Repeat on the IRU tab. Open Vulnerability Trends and both sources now chart week over week.",
    },
    tip: "Snapshots are per source and per day. Save S1 and IRU on the same day so the trend lines stay comparable.",
  },
  pki: {
    headline: "Assemble a certificate report you can paste anywhere",
    steps: [
      "Fill in the certificate fields — anything left blank is simply omitted.",
      "Watch the Preview pane build the formatted report as you type.",
      "Use “Copy report” for chat or email, or “Download .txt” to attach it.",
    ],
    example: {
      title: "Renewal summary",
      body: "Title it “Q3 Certificate Renewals”, list the expiring CNs and their dates in the multi-line fields, then copy the output straight into the change ticket.",
    },
    tip: "Values persist between visits, so next week you only edit what actually changed.",
  },
  policy: {
    headline: "Track which policies exist and store the documents",
    steps: [
      "Work down the list and set each policy's status — Not started, In progress, In review or Complete.",
      "Upload the finished document against its policy; files are stored on this device, not uploaded anywhere.",
      "Use the export to hand an auditor a status table.",
    ],
    example: {
      title: "SOC 2 evidence request",
      body: "Auditor asks which policies are approved. Filter to Complete, export the table, and attach the stored documents for the ones they sampled.",
    },
    tip: "The completion count feeds the Daily InfoSec Log, so progress shows up in your standup without extra work.",
  },
  deck: {
    headline: "Fill a PowerPoint template from a form",
    steps: [
      "Upload a .pptx whose text contains {{tokens}} where the numbers go.",
      "Every token found becomes a labelled input — fill them in.",
      "“Generate PowerPoint” downloads a copy with the values substituted; the original template is untouched.",
    ],
    example: {
      title: "Weekly PKI deck",
      body: "Your deck says “Week of {{week_of}}” and “Critical: {{s1_crit}}”. Upload it once, type this week's numbers, download, present. Next week, upload the same template again.",
    },
    tip: "Tokens split across formatting inside PowerPoint are stitched back together automatically, so bold or coloured tokens still resolve.",
  },
  appnotice: {
    headline: "Draft a polite update-or-remove message",
    steps: [
      "Type the application name and the affected devices, or drop in a screenshot and hit “Analyze screenshot”.",
      "Set the installed and required versions, an optional deadline and reason.",
      "Choose the Action (update / remove / either) and the Tone (friendly / professional / firm).",
      "“Copy message”, paste into email or chat, and “Save to log” to keep a record.",
    ],
    example: {
      title: "Outdated Zoom",
      body: "App “Zoom”, installed 5.10.2, required 5.17.0, device LAPTOP-1234, tone Friendly. You get a complete, courteous message with a subject line — no rewriting.",
    },
    tip: "Your name and team are remembered, so the signature is right every time.",
  },
  dailylog: {
    headline: "Compile the day into one paste-ready summary",
    steps: [
      "Pick the log date — today by default.",
      "Add anything the app can't see in the notes box (tickets closed, meetings, follow-ups).",
      "“Copy log” for standup, or “Save to log” to keep a dated record.",
    ],
    example: {
      title: "End of day",
      body: "You saved an S1 snapshot and drafted two app notices. Open this, add “closed 4 tickets, met with Ravenna re: cert renewal”, and copy — the vulnerability numbers and notices are already in there.",
    },
    tip: "Saving replaces that day's entry rather than duplicating it, so you can refine the same log all day.",
  },
  kev: {
    headline: "Check CVEs against CISA's known-exploited catalog",
    steps: [
      "Load the catalog once — “Load catalog (live)”, or “Upload catalog (.json)” if your network blocks it.",
      "Paste any text containing CVE IDs; they are extracted automatically.",
      "Read the badges: KNOWN EXPLOITED, RANSOMWARE, and the remediation due date.",
    ],
    example: {
      title: "Triage a scanner page",
      body: "Copy a whole block of findings and paste it in. Anything that comes back KNOWN EXPLOITED jumps the queue regardless of its CVSS score.",
    },
    tip: "The catalog caches locally, so subsequent lookups are instant and work offline.",
  },
  vulntrend: {
    headline: "Show remediation progress over time",
    steps: [
      "Switch between the SentinelOne and IRU sources.",
      "Read the Critical and High lines — solid is Critical, dashed is High.",
      "The tiles underneath show the latest count and the change since your first snapshot.",
    ],
    example: {
      title: "Proving the work landed",
      body: "Four weekly S1 snapshots and Critical goes 9 → 7 → 5 → 2. The tile reads “2, down 7 from 9” — that sentence is your slide.",
    },
    tip: "Needs at least two snapshots of the same source. Save one from the Vulnerability Analyzer each week.",
  },
  toolkit: {
    headline: "The everyday analyst utilities, all offline",
    steps: [
      "IOC Extract — paste any text to pull out IPs, domains, URLs, emails, hashes and CVEs.",
      "Defang — make indicators safe to share, or refang someone else's.",
      "Decode — Base64, URL and JWT, both directions.",
      "Hash — SHA-256 / SHA-1 of text, or of a file you choose.",
    ],
    example: {
      title: "A suspicious email",
      body: "Paste the whole body into IOC Extract. It refangs hxxp://bad[.]site automatically, lists the IPs and hashes, and “Copy defanged” gives you a version safe to paste into the ticket.",
    },
    tip: "Nothing here touches the network — safe for anything you would not upload to an online tool.",
  },
  phish: {
    headline: "Read an email's headers in seconds",
    steps: [
      "In Gmail use “Show original”, in Outlook “View source”, and copy the headers.",
      "Paste them in — parsing happens entirely in this browser.",
      "Check the SPF / DKIM / DMARC badges and the origin IP, then read the warnings.",
      "Scan the delivery path — origin first — to see where it really came from.",
    ],
    example: {
      title: "A fake PayPal notice",
      body: "From says security@paypal.com but Return-Path is bounce@evil-sender.ru. You get SPF fail, DMARC fail, a DKIM misalignment warning, and the true origin IP — enough to close it out.",
    },
    tip: "The From vs Return-Path mismatch is usually the fastest tell; it is called out explicitly in the warnings.",
  },
};
MO_HELP["vuln-iru"] = MO_HELP["vuln-s1"];

function MoHelp({ theme, toolId, dismissed, setDismissed, forceOpen, onCloseForced }) {
  const help = MO_HELP[toolId];
  if (!help) return null;
  const isDismissed = !!(dismissed || {})[toolId];
  if (isDismissed && !forceOpen) return null;

  return (
    <div className="v-mohelp" style={{ background: theme.accentSoft, border: `1px solid ${theme.cardBorder}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
        <span style={{ color: theme.accent, display: "inline-flex", flexShrink: 0, marginTop: "1px" }}><IconBulb size={16} /></span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: "13.5px", fontWeight: 800, color: theme.text }}>{help.headline}</div>
          <ol style={{ margin: "9px 0 0", paddingLeft: "18px", display: "flex", flexDirection: "column", gap: "4px" }}>
            {help.steps.map((s, i) => (
              <li key={i} style={{ fontSize: "12.5px", lineHeight: 1.5, color: theme.textMuted }}>{s}</li>
            ))}
          </ol>
          {help.example && (
            <div style={{ marginTop: "10px", padding: "9px 11px", borderRadius: "9px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}` }}>
              <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.sectionLabelColor }}>{help.example.title}</div>
              <div style={{ fontSize: "12.5px", lineHeight: 1.5, color: theme.textMuted, marginTop: "3px" }}>{help.example.body}</div>
            </div>
          )}
          {help.tip && (
            <div style={{ marginTop: "8px", fontSize: "12px", color: theme.textFaint, lineHeight: 1.5 }}>
              <strong style={{ color: theme.textMuted }}>Tip:</strong> {help.tip}
            </div>
          )}
          <div style={{ display: "flex", gap: "8px", marginTop: "11px", flexWrap: "wrap" }}>
            <button
              onClick={() => {
                const next = { ...(dismissed || {}), [toolId]: true };
                setDismissed(next);
                saveJSON(STORAGE_KEYS.moHelp, next);
                if (onCloseForced) onCloseForced();
                toast.info("Hidden. The “?” in the header brings it back.");
              }}
              className="v-btn"
              style={{ padding: "7px 14px", borderRadius: "9px", fontSize: "12.5px", fontWeight: 700, border: "none", background: theme.accent, color: theme.accentText }}
            >
              Got it — don't show again
            </button>
            {forceOpen && (
              <button
                onClick={onCloseForced}
                className="v-btn"
                style={{ padding: "7px 12px", borderRadius: "9px", fontSize: "12.5px", fontWeight: 700, border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.textMuted }}
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}



function MoModal({ theme, title, subtitle, icon, onClose, children, footer, helpId }) {
  const panelRef = useRef(null);
  const titleId = useRef("mo-modal-" + Math.random().toString(36).slice(2, 9)).current;
  const [moHelpDismissed, setMoHelpDismissed] = usePersistentState(STORAGE_KEYS.moHelp, {});
  const [helpForced, setHelpForced] = useState(false);
  const embedded = useContext(MoEmbedContext);
  useOverlayBehaviour(onClose, panelRef, !embedded);
  const hasHelp = !!(helpId && MO_HELP[helpId]);
  const helpHidden = hasHelp && !!moHelpDismissed[helpId];

  const helpBtn = hasHelp && helpHidden && (
    <button
      onClick={() => setHelpForced((v) => !v)}
      className="v-btn v-iconbtn"
      title="How to use this"
      aria-label="How to use this"
      style={{
        border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.textMuted,
        borderRadius: "10px", width: "34px", height: "34px", display: "inline-flex",
        alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1, fontWeight: 800, fontSize: "15px",
      }}
    >
      ?
    </button>
  );
  const helpPanel = hasHelp && (
    <MoHelp
      theme={theme}
      toolId={helpId}
      dismissed={moHelpDismissed}
      setDismissed={setMoHelpDismissed}
      forceOpen={helpForced}
      onCloseForced={() => setHelpForced(false)}
    />
  );

  // In-page: a section of the Mechanical Orchard page. No portal, no backdrop,
  // no dialog semantics — it is not a dialog any more, and calling it one
  // would tell a screen reader the rest of the page had gone away.
  if (embedded) {
    return (
      <div ref={panelRef} className="v-mo-panel">
        <button
          onClick={onClose}
          className="v-btn v-mo-back"
          style={{
            display: "inline-flex", alignItems: "center", gap: "7px", marginBottom: "14px",
            padding: "7px 12px", borderRadius: "10px", border: `1px solid ${theme.cardBorder}`,
            background: "transparent", color: theme.textMuted, fontSize: "13px", fontWeight: 700,
          }}
        >
          <span aria-hidden="true">&#8592;</span> All tools
        </button>
        <div style={{ ...cardBackgroundStyle(theme), padding: "26px 28px" }}>
          <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "18px" }}>
            <span style={{ color: theme.accent, marginTop: "2px", display: "inline-flex" }}>{icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 id={titleId} style={{ margin: 0, fontSize: "clamp(17px, 2.2vw, 19px)", fontWeight: 800, color: theme.text, lineHeight: 1.2 }}>{title}</h2>
              {subtitle && <div style={{ fontSize: "13px", color: theme.textMuted, marginTop: "4px", lineHeight: 1.45 }}>{subtitle}</div>}
            </div>
            {helpBtn}
          </div>
          {helpPanel}
          {children}
          {footer && <div style={{ marginTop: "22px" }}>{footer}</div>}
        </div>
      </div>
    );
  }

  return ReactDOM.createPortal(
    <div
      className="v-modal-overlay"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={panelRef}
        className="v-scroll v-modal-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        style={{
          "--scroll-thumb": theme.divider, ...cardBackgroundStyle(theme), padding: "26px 28px",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px", marginBottom: "18px" }}>
          <span style={{ color: theme.accent, marginTop: "2px", display: "inline-flex" }}>{icon}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div id={titleId} style={{ fontSize: "clamp(17px, 2.2vw, 19px)", fontWeight: 800, color: theme.text, lineHeight: 1.2 }}>{title}</div>
            {subtitle && <div style={{ fontSize: "13px", color: theme.textMuted, marginTop: "4px", lineHeight: 1.45 }}>{subtitle}</div>}
          </div>
          {helpBtn}
          <button
            onClick={onClose}
            className="v-btn v-iconbtn"
            title="Close"
            aria-label="Close dialog"
            style={{
              border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.textMuted,
              borderRadius: "10px", width: "34px", height: "34px", display: "inline-flex",
              alignItems: "center", justifyContent: "center", flexShrink: 0, lineHeight: 1,
            }}
          >
            <IconClose />
          </button>
        </div>
        {helpPanel}
        {children}
        {footer && <div style={{ marginTop: "22px" }}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
}

/* ---- Small primitives reused across MO tools ---- */


function MoSelect({ theme, value, onChange, options, includeBlank }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="v-input"
      style={{
        width: "100%", padding: "8px 10px", borderRadius: "9px", fontSize: "13px",
        background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`,
        "--focus-ring": theme.accentSoft, "--focus-border": theme.accent,
      }}
    >
      {includeBlank && <option value="">— none —</option>}
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

/* ---- Vulnerability Analyzer ---- */
function VulnerabilityAnalyzerModal({ theme, initialSource, snapshots, setSnapshots, onClose }) {
  const [source, setSource] = useState(initialSource === "iru" ? "iru" : "s1");
  // Each source keeps its OWN dataset + column mapping so S1 and IRU never
  // bleed into one another — switching the toggle just swaps which one shows.
  const [bySource, setBySource] = useState({
    s1: { data: null, fileName: "", severityCol: "", assetCol: "", nameCol: "" },
    iru: { data: null, fileName: "", severityCol: "", assetCol: "", nameCol: "" },
  });
  const [status, setStatus] = useState(null); // {type, message} — per active source
  const [activeFilter, setActiveFilter] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [savedNote, setSavedNote] = useState(false);
  const fileRef = useRef(null);

  const cur = bySource[source];
  const { data, fileName, severityCol, assetCol, nameCol } = cur;

  function patchSource(src, patch) {
    setBySource((prev) => ({ ...prev, [src]: { ...prev[src], ...patch } }));
  }
  const setSeverityCol = (v) => patchSource(source, { severityCol: v });
  const setAssetCol = (v) => patchSource(source, { assetCol: v });
  const setNameCol = (v) => patchSource(source, { nameCol: v });

  // Follow the source the popover opened us with (S1 vs IRU) without wiping
  // the other source's already-loaded data.
  useEffect(() => {
    setSource(initialSource === "iru" ? "iru" : "s1");
    setActiveFilter(null);
    setStatus(null);
  }, [initialSource]);

  function switchSource(src) {
    if (src === source) return;
    setSource(src);
    setActiveFilter(null);
    setStatus(null);
  }

  function autodetect(headers, src) {
    const h = MO_SOURCE_HINTS[src];
    // Claim in order so one column can't fill two roles.
    const severityCol = moDetectColumn(headers, h.severity);
    const assetCol = moDetectColumn(headers, h.asset, [severityCol]);
    const nameCol = moDetectColumn(headers, h.name, [severityCol, assetCol]);
    return { severityCol, assetCol, nameCol };
  }

  async function ingest(file) {
    if (!file) return;
    const src = source;
    setStatus({ type: "loading", message: `Reading ${file.name}…` });
    try {
      const parsed = await moParseSpreadsheet(file);
      if (parsed.records.length === 0) {
        setStatus({ type: "error", message: "No data rows found in that file." });
        return;
      }
      patchSource(src, { data: parsed, fileName: file.name, ...autodetect(parsed.headers, src) });
      setActiveFilter(null);
      setStatus({ type: "success", message: `Loaded ${parsed.records.length} rows into ${MO_SOURCE_HINTS[src].label}.` });
    } catch (err) {
      setStatus({ type: "error", message: err.message || "Couldn't read that file." });
    }
  }

  function reset() {
    patchSource(source, { data: null, fileName: "", severityCol: "", assetCol: "", nameCol: "" });
    setStatus(null);
    setActiveFilter(null);
  }

  const analysis = useMemo(() => {
    if (!data) return null;
    const counts = {}; MO_SEVERITY_ORDER.forEach((s) => (counts[s] = 0));
    const rows = data.records.map((r) => ({
      severity: moNormalizeSeverity(severityCol ? r[severityCol] : ""),
      asset: assetCol ? r[assetCol] : "",
      name: nameCol ? r[nameCol] : "",
      raw: r,
    }));
    rows.forEach((r) => { counts[r.severity] = (counts[r.severity] || 0) + 1; });
    const uniqueAssets = new Set(rows.map((r) => (r.asset || "").trim()).filter(Boolean)).size;
    return { rows, counts, total: rows.length, uniqueAssets };
  }, [data, severityCol, assetCol, nameCol]);

  const visibleRows = useMemo(() => {
    if (!analysis) return [];
    const rows = activeFilter ? analysis.rows.filter((r) => r.severity === activeFilter) : analysis.rows;
    const rank = (s) => MO_SEVERITY_ORDER.indexOf(s);
    return [...rows].sort((a, b) => rank(a.severity) - rank(b.severity));
  }, [analysis, activeFilter]);

  // Snapshots (daily log) for the currently-active source, newest first.
  const sourceSnapshots = useMemo(
    () => (snapshots || []).filter((s) => s.source === source),
    [snapshots, source]
  );

  function exportSummary() {
    if (!analysis) return;
    const lines = [];
    lines.push(`Vulnerability Summary — ${MO_SOURCE_HINTS[source].label}`);
    lines.push(`Source file: ${fileName}`);
    lines.push(`Total findings: ${analysis.total}`);
    lines.push(`Affected assets: ${analysis.uniqueAssets}`);
    // The row list below is whatever is on screen; say so rather than letting
    // the totals above imply the export is complete.
    if (activeFilter) lines.push(`Rows below filtered to: ${activeFilter} (${visibleRows.length} of ${analysis.total})`);
    lines.push("");
    lines.push("Severity,Count");
    MO_SEVERITY_ORDER.forEach((s) => { if (analysis.counts[s]) lines.push(`${s},${analysis.counts[s]}`); });
    lines.push("");
    lines.push(["Severity", "Asset", "Vulnerability"].map(moCsvCell).join(","));
    visibleRows.forEach((r) => lines.push([r.severity, r.asset, r.name].map(moCsvCell).join(",")));
    moDownload(`vuln-summary-${source}.csv`, lines.join("\n"), "text/csv;charset=utf-8");
  }

  // Save the current breakdown as a dated snapshot for the daily log.
  function saveSnapshot() {
    if (!analysis) return;
    const now = new Date();
    const snap = {
      id: "snap" + now.getTime() + "-" + Math.round(Math.random() * 100000),
      ts: now.toISOString(),
      source,
      fileName,
      total: analysis.total,
      uniqueAssets: analysis.uniqueAssets,
      counts: { ...analysis.counts },
    };
    // One snapshot per source per day: saving again replaces the day's entry
    // rather than stacking a duplicate, which used to put several points on
    // the same date in the trend chart and flatten the line between them.
    const dayKey = now.toISOString().slice(0, 10);
    setSnapshots((prev) => {
      const rest = (prev || []).filter(
        (s) => !(s.source === source && String(s.ts).slice(0, 10) === dayKey)
      );
      return [snap, ...rest];
    });
    setSavedNote(true);
    setTimeout(() => setSavedNote(false), 1600);
  }

  function deleteSnapshot(id) {
    setSnapshots((prev) => (prev || []).filter((s) => s.id !== id));
  }

  function exportLog() {
    const rows = sourceSnapshots;
    if (rows.length === 0) return;
    const header = ["Date", "Source", "File", "Total", "Assets", ...MO_SEVERITY_ORDER];
    const lines = [header.map(moCsvCell).join(",")];
    rows.forEach((s) => {
      const vals = [
        moFormatTs(s.ts), MO_SOURCE_HINTS[s.source].label, s.fileName, s.total, s.uniqueAssets,
        ...MO_SEVERITY_ORDER.map((sev) => s.counts[sev] || 0),
      ];
      lines.push(vals.map(moCsvCell).join(","));
    });
    moDownload(`vuln-daily-log-${source}.csv`, lines.join("\n"), "text/csv;charset=utf-8");
  }

  const dropStyle = {
    border: `2px dashed ${dragOver ? theme.accent : theme.inputBorder}`,
    borderRadius: "14px", padding: "30px 20px", textAlign: "center",
    background: dragOver ? theme.accentSoft : "transparent", transition: "all 0.15s ease", cursor: "pointer",
  };

  return (
    <MoModal
      theme={theme}
      icon={<IconShield size={20} />}
      title="Vulnerability Analyzer"
      helpId={source === "iru" ? "vuln-iru" : "vuln-s1"}
      subtitle="Drop a vulnerability export and get an instant severity breakdown. Works with SentinelOne (S1) and IRU spreadsheets."
      onClose={onClose}
    >
      {/* Source toggle */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
        {["s1", "iru"].map((src) => (
          <button
            key={src}
            onClick={() => switchSource(src)}
            className="v-btn"
            style={{
              display: "inline-flex", alignItems: "center", gap: "7px",
              padding: "7px 16px", borderRadius: "999px", fontSize: "13px", fontWeight: 700,
              border: `1px solid ${source === src ? theme.accent : theme.cardBorder}`,
              background: source === src ? theme.accent : "transparent",
              color: source === src ? theme.accentText : theme.textMuted,
            }}
          >
            {MO_SOURCE_HINTS[src].label}
            {bySource[src].data && (
              <span
                title="Data loaded"
                style={{
                  width: "7px", height: "7px", borderRadius: "50%",
                  background: source === src ? theme.accentText : theme.positive,
                }}
              />
            )}
          </button>
        ))}
      </div>

      {!data && (
        <div
          onClick={() => fileRef.current && fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); ingest(e.dataTransfer.files[0]); }}
          style={dropStyle}
        >
          <div style={{ color: theme.textMuted, marginBottom: "6px", display: "inline-flex" }}><IconUpload /></div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: theme.text }}>Drop a spreadsheet here, or click to browse</div>
          <div style={{ fontSize: "12px", color: theme.textFaint, marginTop: "6px" }}>.csv, .xlsx, or .xls</div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls,text/csv"
            style={{ display: "none" }}
            onChange={(e) => { ingest(e.target.files[0]); e.target.value = ""; }}
          />
        </div>
      )}

      {status && (
        <div
          style={{
            marginTop: "14px", fontSize: "13px", fontWeight: 600, padding: "10px 14px", borderRadius: "10px",
            color: status.type === "error" ? theme.danger : status.type === "success" ? theme.positive : theme.textMuted,
            background: status.type === "error" ? theme.dangerSoft : theme.accentSoft,
          }}
        >
          {status.message}
        </div>
      )}

      {data && analysis && (
        <div style={{ marginTop: "20px" }}>
          {/* File + column mapping */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: theme.text }}>{fileName}</span>
            <span style={{ fontSize: "12px", color: theme.textFaint }}>{analysis.total} findings · {analysis.uniqueAssets} assets</span>
            <button onClick={reset} className="v-btn" style={{ marginLeft: "auto", fontSize: "12px", fontWeight: 700, color: theme.textMuted, background: "transparent", border: `1px solid ${theme.cardBorder}`, borderRadius: "8px", padding: "5px 10px" }}>
              Load different file
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "10px", marginBottom: "20px" }}>
            {[
              ["Severity column", severityCol, setSeverityCol],
              ["Asset / host column", assetCol, setAssetCol],
              ["Vulnerability column", nameCol, setNameCol],
            ].map(([label, val, setter]) => (
              <div key={label}>
                <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.textMuted, marginBottom: "5px" }}>{label}</div>
                <MoSelect theme={theme} value={val} onChange={setter} options={data.headers} includeBlank />
              </div>
            ))}
          </div>

          {/* Severity summary tiles */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(90px, 1fr))", gap: "10px", marginBottom: "18px" }}>
            {MO_SEVERITY_ORDER.filter((s) => analysis.counts[s] > 0 || ["Critical", "High", "Medium", "Low"].indexOf(s) !== -1).map((s) => {
              const active = activeFilter === s;
              return (
                <button
                  key={s}
                  onClick={() => setActiveFilter(active ? null : s)}
                  className="v-btn v-card"
                  style={{
                    ...cardBackgroundStyle(theme), padding: "12px", textAlign: "left",
                    "--accent-line": MO_SEVERITY_COLORS[s],
                    outline: active ? `2px solid ${MO_SEVERITY_COLORS[s]}` : "none", outlineOffset: "1px",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px" }}>
                    <span style={{ width: "9px", height: "9px", borderRadius: "50%", background: MO_SEVERITY_COLORS[s] }} />
                    <span style={{ fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.textMuted }}>{s}</span>
                  </div>
                  <div className="v-tabular" style={{ fontSize: "24px", fontWeight: 800, color: theme.text }}>{analysis.counts[s]}</div>
                </button>
              );
            })}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "12px", color: theme.textMuted }}>
              {activeFilter ? `Showing ${visibleRows.length} ${activeFilter} findings` : `Showing all ${visibleRows.length} findings`}
            </span>
            {activeFilter && (
              <button onClick={() => setActiveFilter(null)} className="v-btn" style={{ fontSize: "12px", fontWeight: 700, color: theme.accent, background: "transparent", border: "none", padding: 0 }}>Clear filter</button>
            )}
            <div style={{ display: "flex", gap: "8px", marginLeft: "auto" }}>
              <MoButton theme={theme} variant="primary" onClick={saveSnapshot} style={{ padding: "6px 12px" }}>{savedNote ? "Saved!" : "Save snapshot"}</MoButton>
              <MoButton theme={theme} onClick={exportSummary} style={{ padding: "6px 12px" }}><IconShare size={13} /> Export CSV</MoButton>
            </div>
          </div>

          {/* Findings table */}
          <div className="v-scroll" style={{ maxHeight: "320px", overflow: "auto", border: `1px solid ${theme.cardBorder}`, borderRadius: "12px", "--scroll-thumb": theme.divider }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr>
                  {["Severity", "Asset", "Vulnerability"].map((h) => (
                    <th key={h} style={{ position: "sticky", top: 0, textAlign: "left", padding: "9px 12px", background: theme.cardBg, color: theme.textMuted, fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", borderBottom: `1px solid ${theme.divider}` }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleRows.slice(0, 300).map((r, i) => (
                  <tr key={i} style={{ borderBottom: `1px solid ${theme.divider}` }}>
                    <td style={{ padding: "8px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontWeight: 700, color: MO_SEVERITY_COLORS[r.severity] }}>
                        <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: MO_SEVERITY_COLORS[r.severity] }} />
                        {r.severity}
                      </span>
                    </td>
                    <td style={{ padding: "8px 12px", color: theme.text }}>{r.asset || <span style={{ color: theme.textFaint }}>—</span>}</td>
                    <td style={{ padding: "8px 12px", color: theme.text }}>{r.name || <span style={{ color: theme.textFaint }}>—</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {visibleRows.length > 300 && (
            <div style={{ fontSize: "12px", color: theme.textFaint, marginTop: "8px", textAlign: "center" }}>Showing first 300 rows — export the CSV for the full list.</div>
          )}
        </div>
      )}

      {/* Daily log — dated snapshots for this source, persisted across sessions */}
      <div style={{ marginTop: "24px", borderTop: `1px solid ${theme.divider}`, paddingTop: "18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px", flexWrap: "wrap" }}>
          <SectionLabel theme={theme} icon={<IconChecklist size={14} />} style={{ margin: 0 }}>
            {MO_SOURCE_HINTS[source].label} Daily Log
          </SectionLabel>
          <span style={{ fontSize: "12px", color: theme.textFaint }}>{sourceSnapshots.length} saved</span>
          {sourceSnapshots.length > 0 && (
            <MoButton theme={theme} onClick={exportLog} style={{ marginLeft: "auto", padding: "6px 12px" }}>
              <IconShare size={13} /> Export log
            </MoButton>
          )}
        </div>

        {sourceSnapshots.length === 0 ? (
          <div style={{ fontSize: "12.5px", color: theme.textFaint, lineHeight: 1.5 }}>
            No snapshots yet. Load a file above and hit <strong style={{ color: theme.textMuted }}>Save snapshot</strong> to start tracking {MO_SOURCE_HINTS[source].label} findings day over day.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {sourceSnapshots.map((s) => (
              <div
                key={s.id}
                style={{
                  display: "flex", alignItems: "center", gap: "12px", padding: "10px 12px",
                  border: `1px solid ${theme.cardBorder}`, borderRadius: "10px", background: theme.accentSoft,
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: theme.text }}>{moFormatTs(s.ts)}</div>
                  <div style={{ fontSize: "11.5px", color: theme.textFaint, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {s.fileName || "—"} · {s.total} findings · {s.uniqueAssets} assets
                  </div>
                </div>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                  {MO_SEVERITY_ORDER.filter((sev) => s.counts[sev] > 0).map((sev) => (
                    <span key={sev} title={sev} style={{ display: "inline-flex", alignItems: "center", gap: "4px", fontSize: "11.5px", fontWeight: 700, color: MO_SEVERITY_COLORS[sev] }}>
                      <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: MO_SEVERITY_COLORS[sev] }} />
                      {s.counts[sev]}
                    </span>
                  ))}
                </div>
                <button
                  onClick={() => deleteSnapshot(s.id)}
                  className="v-btn"
                  title="Delete snapshot"
                  style={{ border: "none", background: "transparent", color: theme.textMuted, padding: "4px", display: "inline-flex", flexShrink: 0 }}
                >
                  <IconClose />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </MoModal>
  );
}

/* ---- PKI Report Info Generator ---- */
function PkiReportModal({ theme, values, setValues, onClose }) {
  const [copied, setCopied] = useState(false);

  function update(id, val) { setValues((prev) => ({ ...prev, [id]: val })); }

  const report = useMemo(() => {
    const lines = [];
    const title = (values.title || "").trim() || "PKI Certificate Report";
    lines.push(title);
    lines.push("=".repeat(title.length));
    lines.push("");
    PKI_REPORT_FIELDS.forEach((f) => {
      if (f.id === "title") return;
      const v = (values[f.id] || "").trim();
      if (!v) return;
      if (f.multiline) {
        lines.push(`${f.label}:`);
        v.split("\n").forEach((l) => lines.push(`  ${l}`));
        lines.push("");
      } else {
        lines.push(`${f.label}: ${v}`);
      }
    });
    return lines.join("\n");
  }, [values]);

  function copyReport() {
    const done = () => { setCopied(true); setTimeout(() => setCopied(false), 1600); };
    const failed = () => toast.error("Couldn't copy — select the preview and copy manually.");
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(report).then(done).catch(failed);
    } else {
      failed();
    }
  }

  function clearAll() {
    const blank = {};
    PKI_REPORT_FIELDS.forEach((f) => (blank[f.id] = ""));
    setValues(blank);
  }

  return (
    <MoModal
      theme={theme}
      icon={<IconCertificate size={20} />}
      title="PKI Report Info Generator"
      helpId="pki"
      subtitle="Fill in the certificate details and generate a formatted report you can copy or download. (Fields are placeholders — easy to adjust later.)"
      onClose={onClose}
      footer={
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <MoButton theme={theme} variant="primary" onClick={copyReport}>{copied ? "Copied!" : "Copy report"}</MoButton>
          <MoButton theme={theme} onClick={() => moDownload(`pki-report-${new Date().toISOString().slice(0, 10)}.txt`, report)}><IconUpload size={13} /> Download .txt</MoButton>
          <MoButton theme={theme} onClick={clearAll} style={{ marginLeft: "auto", color: theme.danger, background: theme.dangerSoft, borderColor: "transparent" }}>Clear all</MoButton>
        </div>
      }
    >
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: "14px" }}>
        {PKI_REPORT_FIELDS.map((f) => (
          <div key={f.id} style={{ gridColumn: f.multiline ? "1 / -1" : "auto" }}>
            <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.textMuted, marginBottom: "5px" }}>{f.label}</label>
            {f.multiline ? (
              <textarea
                value={values[f.id] || ""}
                onChange={(e) => update(f.id, e.target.value)}
                placeholder={f.placeholder}
                rows={3}
                className="v-input v-scroll"
                style={{ width: "100%", resize: "vertical", padding: "9px 11px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent, "--scroll-thumb": theme.divider }}
              />
            ) : (
              <input
                value={values[f.id] || ""}
                onChange={(e) => update(f.id, e.target.value)}
                placeholder={f.placeholder}
                className="v-input"
                style={{ width: "100%", padding: "9px 11px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent }}
              />
            )}
          </div>
        ))}
      </div>

      <div style={{ marginTop: "22px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.sectionLabelColor, marginBottom: "8px" }}>Preview</div>
        <pre
          className="v-scroll"
          style={{
            margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "12.5px", lineHeight: 1.55,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: theme.text,
            background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px",
            padding: "16px", maxHeight: "260px", overflow: "auto", "--scroll-thumb": theme.divider,
          }}
        >
          {report}
        </pre>
      </div>
    </MoModal>
  );
}

/* ---- Policy & Procedure Writeup tracker ---- */
/* ===== Outdated App Notice Generator (MO tool) ===== */




// Lazy-load Tesseract.js (OCR) the same way the other heavy libs load: a CDN
// <script> injected on demand. CSP already allows cdnjs for script + worker.
let __tesseractPromise = null;
function loadTesseract() {
  if (typeof window !== "undefined" && window.Tesseract) return Promise.resolve();
  if (__tesseractPromise) return __tesseractPromise;
  __tesseractPromise = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/tesseract.js/5.1.1/tesseract.min.js";
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => { __tesseractPromise = null; reject(new Error("Could not load OCR engine")); };
    document.head.appendChild(s);
  });
  return __tesseractPromise;
}

function splitList(s) {
  return (s || "")
    .split(/[\n,;]+/)
    .map((x) => x.trim())
    .filter(Boolean);
}

function formatNoticeDate(iso) {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

// Pure builder: form + sender meta -> { subject, body }
function buildAppNotice(f, meta) {
  const app = (f.appName || "").trim() || "the application";
  const appWithVer = f.installedVer && f.installedVer.trim()
    ? `${app} (version ${f.installedVer.trim()})`
    : app;
  const devices = splitList(f.devices);
  const deviceClause =
    devices.length === 0 ? "" :
    devices.length === 1 ? `on your device ${devices[0]}` :
    `on the following devices: ${devices.join(", ")}`;
  const target = f.requiredVer && f.requiredVer.trim()
    ? `to version ${f.requiredVer.trim()} or later`
    : "to the latest version";
  const deadline = formatNoticeDate(f.deadline);
  const reason = (f.reason || "").trim();
  const greetName = (f.recipient || "").trim();
  const sender = (meta.sender || "").trim();
  const team = (meta.team || "").trim();
  const action = f.action || "update";

  const sig = [sender, team].filter(Boolean).join("\n");
  const p = []; // paragraphs

  if (action === "remove") {
    if (meta.tone === "firm") {
      p.push(greetName ? `Hello ${greetName},` : "Hello,");
      p.push(`Our security tooling shows that ${appWithVer}${deviceClause ? " " + deviceClause : ""} is no longer approved for use${reason ? `, ${reason}` : ""}.`);
      p.push(`Please remove it${deviceClause && devices.length > 1 ? " from these devices" : ""}. Unsupported or unneeded software increases our attack surface and must be removed to stay compliant with our security policy.`);
      p.push(`${deadline ? `This needs to be completed by ${deadline}. ` : ""}If you believe you still need this application, reply here so we can review it with you.`);
      p.push(`Regards,\n${sig}`);
    } else if (meta.tone === "professional") {
      p.push(greetName ? `Hello ${greetName},` : "Hello,");
      p.push(`As part of our routine security review, we identified ${appWithVer}${deviceClause ? " " + deviceClause : ""} that is flagged for removal${reason ? ` — ${reason}` : ""}.`);
      p.push(`Please uninstall the application at your earliest convenience. This helps keep your device secure and our software inventory up to date.`);
      p.push(`${deadline ? `Kindly complete this by ${deadline}. ` : ""}If you still rely on this application, let us know and we'll be glad to discuss alternatives.`);
      p.push(`Best regards,\n${sig}`);
    } else {
      p.push(greetName ? `Hi ${greetName},` : "Hi there,");
      p.push(`Quick heads-up from the ${team || "security"} team — it looks like ${appWithVer}${deviceClause ? " " + deviceClause : ""} is no longer needed or supported${reason ? `, ${reason}` : ""}.`);
      p.push(`When you get a chance, could you remove it? It just helps keep everything tidy and secure on your end.`);
      p.push(`${deadline ? `If you could take care of it by ${deadline}, that'd be great. ` : ""}And if you actually still use it, no worries — just reply here and we'll sort it out together.`);
      p.push(`Thanks so much!\n${sig}`);
    }
  } else if (action === "either") {
    if (meta.tone === "firm") {
      p.push(greetName ? `Hello ${greetName},` : "Hello,");
      p.push(`Our security tooling has flagged that ${appWithVer}${deviceClause ? " " + deviceClause : ""} is out of date and does not meet our current security requirements${reason ? `, ${reason}` : ""}.`);
      p.push(`Please update it ${target}, or remove it if it's no longer needed. Outdated software introduces known vulnerabilities and must be remediated to stay compliant with our security policy.`);
      p.push(`${deadline ? `This needs to be completed by ${deadline}. ` : ""}Reply here if you need assistance.`);
      p.push(`Regards,\n${sig}`);
    } else if (meta.tone === "professional") {
      p.push(greetName ? `Hello ${greetName},` : "Hello,");
      p.push(`As part of our ongoing security maintenance, we noticed that ${appWithVer}${deviceClause ? " " + deviceClause : ""} is running an out-of-date version${reason ? ` — ${reason}` : ""}.`);
      p.push(`Please update it ${target}, or remove the application if you no longer use it. Either option keeps the software supported and free of known vulnerabilities.`);
      p.push(`${deadline ? `Kindly complete this by ${deadline}. ` : ""}If you have any questions or need help, please don't hesitate to reach out.`);
      p.push(`Best regards,\n${sig}`);
    } else {
      p.push(greetName ? `Hi ${greetName},` : "Hi there,");
      p.push(`Quick heads-up from the ${team || "security"} team — ${appWithVer}${deviceClause ? " " + deviceClause : ""} is looking a little out of date${reason ? `, ${reason}` : ""}.`);
      p.push(`When you have a minute, could you update it ${target}? Or if you're not using it anymore, feel free to just remove it — whichever's easier for you.`);
      p.push(`${deadline ? `If you can get to it by ${deadline}, that'd be perfect. ` : ""}Any trouble at all, just reply here and we'll help you out.`);
      p.push(`Thanks so much!\n${sig}`);
    }
  } else {
    // update (default)
    if (meta.tone === "firm") {
      p.push(greetName ? `Hello ${greetName},` : "Hello,");
      p.push(`Our security tooling has flagged that ${appWithVer}${deviceClause ? " " + deviceClause : ""} is out of date and does not meet our current security requirements${reason ? `, ${reason}` : ""}.`);
      p.push(`Please update it ${target}. Outdated software introduces known vulnerabilities and must be remediated to stay compliant with our security policy.`);
      p.push(`${deadline ? `This needs to be completed by ${deadline}. ` : ""}If the application is no longer needed, please remove it instead. Reply here if you need assistance.`);
      p.push(`Regards,\n${sig}`);
    } else if (meta.tone === "professional") {
      p.push(greetName ? `Hello ${greetName},` : "Hello,");
      p.push(`As part of our ongoing security maintenance, we've identified that ${appWithVer}${deviceClause ? " " + deviceClause : ""} is no longer up to date${reason ? ` — ${reason}` : ""}.`);
      p.push(`Please update the application ${target} at your earliest convenience. This ensures the software remains supported and free of known vulnerabilities.`);
      p.push(`${deadline ? `Kindly complete this by ${deadline}. ` : ""}If you have any questions or need assistance, please don't hesitate to reach out.`);
      p.push(`Best regards,\n${sig}`);
    } else {
      p.push(greetName ? `Hi ${greetName},` : "Hi there,");
      p.push(`Quick heads-up from the ${team || "security"} team — our tooling shows that ${appWithVer}${deviceClause ? " " + deviceClause : ""} is running an out-of-date version${reason ? `, ${reason}` : ""}.`);
      p.push(`When you have a moment, could you update it ${target}? Keeping it current closes off known security issues and only takes a few minutes.`);
      p.push(`${deadline ? `We'd appreciate it if you could take care of this by ${deadline}. ` : ""}If you run into any trouble or aren't sure how, just reply here and we'll be glad to help.`);
      p.push(`Thanks so much!\n${sig}`);
    }
  }

  const verb = action === "remove" ? "Remove" : action === "either" ? "Update or remove" : "Update";
  const subject = `Action needed: ${verb.toLowerCase()} ${app}${deadline ? ` by ${deadline}` : ""}`;
  return { subject, body: p.join("\n\n") };
}

// Best-effort heuristics to pre-fill fields from OCR'd screenshot text.
function parseOcrForApp(text) {
  const out = {};
  const ver = text.match(/\bv?\d+\.\d+(?:\.\d+){0,2}\b/);
  if (ver) out.installedVer = ver[0].replace(/^v/i, "");
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const nameLine = lines.find((l) => /[A-Za-z]{3,}/.test(l) && !/^\d/.test(l) && l.length <= 48 && !/^(version|installed|device|host|status|severity)/i.test(l));
  if (nameLine) out.appName = nameLine.replace(/\s{2,}.*$/, "").trim();
  const dev = text.match(/\b[A-Z0-9]{2,}[-_][A-Z0-9][A-Z0-9-]{1,}\b/);
  if (dev) out.devices = dev[0];
  return out;
}

const APP_NOTICE_TONES = [
  { id: "friendly", label: "Friendly" },
  { id: "professional", label: "Professional" },
  { id: "firm", label: "Firm" },
];
const APP_NOTICE_ACTIONS = [
  { id: "update", label: "Ask to update" },
  { id: "remove", label: "Ask to remove" },
  { id: "either", label: "Update or remove" },
];

function AppNoticeField({ theme, label, children, full }) {
  return (
    <div style={{ gridColumn: full ? "1 / -1" : "auto" }}>
      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.textMuted, marginBottom: "5px" }}>{label}</label>
      {children}
    </div>
  );
}

function AppNoticeModal({ theme, state, setState, onClose }) {
  const s = state || DEFAULT_APP_NOTICE;
  const [form, setForm] = usePersistentState(STORAGE_KEYS.appNoticeDraft, {
    recipient: "", appName: "", installedVer: "", requiredVer: "",
    devices: "", action: "update", reason: "", deadline: "",
  });
  const [img, setImg] = useState(null); // data URL
  const [ocrText, setOcrText] = useState("");
  const [ocrStatus, setOcrStatus] = useState(null); // { type, message }
  const [ocrBusy, setOcrBusy] = useState(false);
  const [showOcr, setShowOcr] = useState(false);
  const [copied, setCopied] = useState("");
  const [saved, setSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));
  const setMeta = (k, v) => setState((prev) => ({ ...(prev || DEFAULT_APP_NOTICE), [k]: v }));

  const { subject, body } = useMemo(
    () => buildAppNotice(form, { sender: s.sender, team: s.team, tone: s.tone }),
    [form, s.sender, s.team, s.tone]
  );

  const inputStyle = { width: "100%", padding: "9px 11px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent };
  const dropStyle = {
    marginTop: "4px", cursor: "pointer", textAlign: "center", padding: "22px 16px", borderRadius: "12px",
    border: `1.5px dashed ${dragOver ? theme.accent : theme.inputBorder}`,
    background: dragOver ? theme.accentSoft : theme.inputBg, transition: "border-color 0.15s, background 0.15s",
  };

  function ingestImage(file) {
    if (!file) return;
    if (!/^image\//.test(file.type)) { setOcrStatus({ type: "error", message: "Please choose an image file (screenshot)." }); return; }
    const reader = new FileReader();
    reader.onload = () => { setImg(reader.result); setOcrText(""); setOcrStatus(null); setShowOcr(false); };
    reader.readAsDataURL(file);
  }

  async function analyze() {
    if (!img) return;
    setOcrBusy(true);
    setOcrStatus({ type: "info", message: "Loading OCR engine (first run downloads it)…" });
    try {
      await loadTesseract();
      setOcrStatus({ type: "info", message: "Reading text from the screenshot…" });
      const result = await window.Tesseract.recognize(img, "eng");
      const text = ((result && result.data && result.data.text) || "").trim();
      setOcrText(text);
      setShowOcr(true);
      if (!text) { setOcrStatus({ type: "error", message: "No readable text found. You can type the details in below." }); return; }
      const guess = parseOcrForApp(text);
      let filledAny = false;
      setForm((prev) => {
        const next = { ...prev };
        Object.keys(guess).forEach((k) => { if (!next[k]) { next[k] = guess[k]; filledAny = true; } });
        return next;
      });
      setOcrStatus({ type: "success", message: filledAny ? "Detected details filled in below — please review and edit as needed." : "Text extracted below — copy anything useful into the fields." });
    } catch (e) {
      setOcrStatus({ type: "error", message: "Couldn't run OCR here (it needs to download an engine and may be blocked offline). You can still type the details in below — your screenshot stays attached for reference." });
    } finally {
      setOcrBusy(false);
    }
  }

  function doCopy(which, text) {
    const done = () => { setCopied(which); setTimeout(() => setCopied(""), 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
    else done();
  }

  function saveToLog() {
    const entry = { id: `${form.appName || "app"}-${new Date().toISOString()}`, at: new Date().toISOString(), appName: form.appName || "(unnamed app)", action: form.action, subject, body };
    setState((prev) => ({ ...(prev || DEFAULT_APP_NOTICE), history: [entry, ...((prev && prev.history) || [])].slice(0, 30) }));
    setSaved(true); setTimeout(() => setSaved(false), 1600);
  }

  function removeLog(id) {
    setState((prev) => ({ ...(prev || DEFAULT_APP_NOTICE), history: ((prev && prev.history) || []).filter((h) => h.id !== id) }));
  }

  function resetForm() {
    setForm({ recipient: "", appName: "", installedVer: "", requiredVer: "", devices: "", action: "update", reason: "", deadline: "" });
    setImg(null); setOcrText(""); setOcrStatus(null); setShowOcr(false);
  }

  return (
    <MoModal
      theme={theme}
      icon={<IconMegaphone size={20} />}
      title="Outdated App Notice Generator"
      helpId="appnotice"
      subtitle="Enter an app and the devices it's on — or drop in a screenshot to auto-fill — and get a polished, friendly message you can copy and send asking the user to update or remove it."
      onClose={onClose}
      footer={
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <MoButton theme={theme} variant="primary" onClick={() => doCopy("body", body)}>{copied === "body" ? "Copied!" : "Copy message"}</MoButton>
          <MoButton theme={theme} onClick={() => doCopy("subject", subject)}>{copied === "subject" ? "Copied!" : "Copy subject"}</MoButton>
          <MoButton theme={theme} onClick={saveToLog}>{saved ? "Saved!" : "Save to log"}</MoButton>
          <MoButton theme={theme} onClick={resetForm} style={{ marginLeft: "auto", color: theme.danger, background: theme.dangerSoft, borderColor: "transparent" }}>Reset</MoButton>
        </div>
      }
    >
      {/* Screenshot / OCR */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.sectionLabelColor, marginBottom: "8px" }}>Screenshot (optional)</div>
        {!img ? (
          <div
            onClick={() => fileRef.current && fileRef.current.click()}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => { e.preventDefault(); setDragOver(false); ingestImage(e.dataTransfer.files[0]); }}
            style={dropStyle}
          >
            <div style={{ color: theme.textMuted, marginBottom: "6px", display: "inline-flex" }}><IconUpload /></div>
            <div style={{ fontSize: "14px", fontWeight: 600, color: theme.text }}>Drop a screenshot here, or click to browse</div>
            <div style={{ fontSize: "12px", color: theme.textFaint, marginTop: "6px" }}>PNG or JPG — we'll try to read the app name & version</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => { ingestImage(e.target.files[0]); e.target.value = ""; }} />
          </div>
        ) : (
          <div style={{ display: "flex", gap: "14px", flexWrap: "wrap", alignItems: "flex-start" }}>
            <img src={img} alt="screenshot" style={{ maxWidth: "240px", maxHeight: "180px", borderRadius: "10px", border: `1px solid ${theme.cardBorder}` }} />
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <MoButton theme={theme} variant="primary" onClick={analyze} disabled={ocrBusy}>{ocrBusy ? "Analyzing…" : "Analyze screenshot"}</MoButton>
              <MoButton theme={theme} onClick={() => { setImg(null); setOcrText(""); setOcrStatus(null); setShowOcr(false); }}>Remove screenshot</MoButton>
              {ocrText && <MoButton theme={theme} onClick={() => setShowOcr((v) => !v)}>{showOcr ? "Hide detected text" : "Show detected text"}</MoButton>}
            </div>
          </div>
        )}
        {ocrStatus && (
          <div style={{ marginTop: "12px", fontSize: "13px", fontWeight: 600, padding: "10px 14px", borderRadius: "10px", color: ocrStatus.type === "error" ? theme.danger : ocrStatus.type === "success" ? theme.positive : theme.textMuted, background: ocrStatus.type === "error" ? theme.dangerSoft : theme.accentSoft }}>
            {ocrStatus.message}
          </div>
        )}
        {showOcr && ocrText && (
          <pre className="v-scroll" style={{ marginTop: "12px", maxHeight: "160px", overflowY: "auto", whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "12px", lineHeight: 1.5, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: theme.textMuted, background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: "10px", padding: "12px 14px", "--scroll-thumb": theme.divider }}>{ocrText}</pre>
        )}
      </div>

      {/* Fields */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: "14px" }}>
        <AppNoticeField theme={theme} label="Application name">
          <input value={form.appName} onChange={(e) => setField("appName", e.target.value)} placeholder="e.g. Zoom" className="v-input" style={inputStyle} />
        </AppNoticeField>
        <AppNoticeField theme={theme} label="Recipient name (optional)">
          <input value={form.recipient} onChange={(e) => setField("recipient", e.target.value)} placeholder="e.g. Jordan" className="v-input" style={inputStyle} />
        </AppNoticeField>
        <AppNoticeField theme={theme} label="Installed version (optional)">
          <input value={form.installedVer} onChange={(e) => setField("installedVer", e.target.value)} placeholder="e.g. 5.10.2" className="v-input" style={inputStyle} />
        </AppNoticeField>
        <AppNoticeField theme={theme} label="Required / latest version (optional)">
          <input value={form.requiredVer} onChange={(e) => setField("requiredVer", e.target.value)} placeholder="e.g. 5.17.0" className="v-input" style={inputStyle} />
        </AppNoticeField>
        <AppNoticeField theme={theme} label="Devices / hosts" full>
          <textarea value={form.devices} onChange={(e) => setField("devices", e.target.value)} placeholder="One per line, or comma-separated — e.g. LAPTOP-1234, MacBook-Pro-JG" rows={2} className="v-input v-scroll" style={{ ...inputStyle, resize: "vertical", "--scroll-thumb": theme.divider }} />
        </AppNoticeField>
        <AppNoticeField theme={theme} label="Action">
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {APP_NOTICE_ACTIONS.map((a) => (
              <button key={a.id} onClick={() => setField("action", a.id)} className="v-btn" style={{ flex: "1 1 auto", padding: "8px 10px", borderRadius: "9px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: `1px solid ${form.action === a.id ? theme.accent : theme.inputBorder}`, background: form.action === a.id ? theme.accentSoft : theme.inputBg, color: form.action === a.id ? theme.accent : theme.textMuted }}>{a.label}</button>
            ))}
          </div>
        </AppNoticeField>
        <AppNoticeField theme={theme} label="Tone">
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {APP_NOTICE_TONES.map((t) => (
              <button key={t.id} onClick={() => setMeta("tone", t.id)} className="v-btn" style={{ flex: "1 1 auto", padding: "8px 10px", borderRadius: "9px", fontSize: "12px", fontWeight: 700, cursor: "pointer", border: `1px solid ${s.tone === t.id ? theme.accent : theme.inputBorder}`, background: s.tone === t.id ? theme.accentSoft : theme.inputBg, color: s.tone === t.id ? theme.accent : theme.textMuted }}>{t.label}</button>
            ))}
          </div>
        </AppNoticeField>
        <AppNoticeField theme={theme} label="Deadline (optional)">
          <input type="date" value={form.deadline} onChange={(e) => setField("deadline", e.target.value)} className="v-input" style={inputStyle} />
        </AppNoticeField>
        <AppNoticeField theme={theme} label="Reason / context (optional)">
          <input value={form.reason} onChange={(e) => setField("reason", e.target.value)} placeholder="e.g. flagged as a critical vulnerability" className="v-input" style={inputStyle} />
        </AppNoticeField>
        <AppNoticeField theme={theme} label="Your name (signature)">
          <input value={s.sender} onChange={(e) => setMeta("sender", e.target.value)} placeholder="e.g. Andrew Makris" className="v-input" style={inputStyle} />
        </AppNoticeField>
        <AppNoticeField theme={theme} label="Team / signature line">
          <input value={s.team} onChange={(e) => setMeta("team", e.target.value)} placeholder="e.g. Mechanical Orchard Security" className="v-input" style={inputStyle} />
        </AppNoticeField>
      </div>

      {/* Preview */}
      <div style={{ marginTop: "22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.sectionLabelColor, flex: 1 }}>Message preview</div>
          <span style={{ fontSize: "12px", color: theme.textFaint }}>Subject: {subject}</span>
        </div>
        <pre className="v-scroll" style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "13px", lineHeight: 1.6, fontFamily: "inherit", color: theme.text, background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", padding: "16px 18px", "--scroll-thumb": theme.divider }}>{body}</pre>
      </div>

      {/* Saved log */}
      {s.history && s.history.length > 0 && (
        <div style={{ marginTop: "22px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.sectionLabelColor, marginBottom: "8px" }}>Saved notices ({s.history.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {s.history.map((h) => (
              <div key={h.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: theme.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{h.appName}</div>
                  <div style={{ fontSize: "11px", color: theme.textFaint }}>{new Date(h.at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · {(APP_NOTICE_ACTIONS.find((a) => a.id === h.action) || {}).label || h.action}</div>
                </div>
                <button onClick={() => doCopy(h.id, h.body)} className="v-btn" style={{ fontSize: "12px", fontWeight: 700, color: theme.accent, background: theme.accentSoft, border: "none", borderRadius: "8px", padding: "6px 10px" }}>{copied === h.id ? "Copied!" : "Copy"}</button>
                <button onClick={() => removeLog(h.id)} className="v-btn" title="Delete" style={{ fontSize: "12px", fontWeight: 700, color: theme.danger, background: "transparent", border: `1px solid ${theme.cardBorder}`, borderRadius: "8px", padding: "6px 10px" }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </MoModal>
  );
}

/* ===== Daily InfoSec Log builder (MO tool) ===== */


function logDayKey(dt) {
  const d = new Date(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function logPrettyDate(key) {
  const d = new Date(key + "T00:00:00");
  if (isNaN(d.getTime())) return key;
  return d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
}

function buildDailyLog(dayKey, data) {
  const { snapshots, notices, policies, notes } = data;
  const daySnaps = (snapshots || []).filter((s) => s.ts && logDayKey(s.ts) === dayKey);
  const dayNotices = (notices || []).filter((n) => n.at && logDayKey(n.at) === dayKey);
  const policyDone = (policies || []).filter((p) => p.status === "done").length;
  const policyTotal = (policies || []).length;
  const policyUpdated = (policies || []).filter((p) => p.updatedAt && logDayKey(p.updatedAt) === dayKey);

  const L = [];
  const title = `InfoSec Daily Log — ${logPrettyDate(dayKey)}`;
  L.push(title);
  L.push("=".repeat(title.length));
  L.push("");

  L.push("VULNERABILITY SNAPSHOTS");
  if (daySnaps.length === 0) {
    L.push("  None saved today.");
  } else {
    daySnaps.forEach((s) => {
      const brk = MO_SEVERITY_ORDER.filter((k) => s.counts && s.counts[k]).map((k) => `${k} ${s.counts[k]}`).join(", ");
      L.push(`  [${(s.source || "").toUpperCase()}] ${s.fileName || "export"} — ${s.total} findings across ${s.uniqueAssets} assets${brk ? ` (${brk})` : ""}`);
    });
  }
  L.push("");

  L.push("OUTDATED-APP NOTICES DRAFTED");
  if (dayNotices.length === 0) {
    L.push("  None today.");
  } else {
    dayNotices.forEach((n) => L.push(`  ${n.appName} — ${n.action}`));
  }
  L.push("");

  L.push("POLICY & PROCEDURE PROGRESS");
  L.push(`  Complete: ${policyDone}/${policyTotal}`);
  if (policyUpdated.length) L.push(`  Updated today: ${policyUpdated.map((p) => p.name).join(", ")}`);
  L.push("");

  const noteText = (notes || "").trim();
  if (noteText) {
    L.push("NOTES");
    noteText.split("\n").forEach((line) => L.push(`  ${line}`));
    L.push("");
  }

  return L.join("\n").replace(/\n+$/, "") + "\n";
}

function DailyLogModal({ theme, snapshots, notices, policies, state, setState, onClose }) {
  const s = state || DEFAULT_DAILY_LOG;
  const [dayKey, setDayKey] = useState(() => logDayKey(new Date()));
  const [copied, setCopied] = useState("");
  const [saved, setSaved] = useState(false);

  // Notes used to be a single string, so switching the date showed the same
  // text and saving a back-dated log wrote today's notes into it.
  const notesForDay = ((s.notesByDay || {})[dayKey] != null)
    ? s.notesByDay[dayKey]
    : (dayKey === logDayKey(new Date()) ? (s.notes || "") : "");
  const setNotes = (v) => setState((prev) => {
    const p = prev || DEFAULT_DAILY_LOG;
    return { ...p, notesByDay: { ...(p.notesByDay || {}), [dayKey]: v } };
  });

  const log = useMemo(
    () => buildDailyLog(dayKey, { snapshots, notices, policies, notes: notesForDay }),
    [dayKey, snapshots, notices, policies, notesForDay]
  );

  function doCopy(which, text) {
    const done = () => { setCopied(which); setTimeout(() => setCopied(""), 1600); };
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(done).catch(done);
    else done();
  }
  function saveEntry() {
    const entry = { id: "log" + Date.now(), day: dayKey, at: new Date().toISOString(), text: log };
    setState((prev) => ({ ...(prev || DEFAULT_DAILY_LOG), entries: [entry, ...((prev && prev.entries) || []).filter((e) => e.day !== dayKey)].slice(0, 60) }));
    setSaved(true); setTimeout(() => setSaved(false), 1600);
  }
  function removeEntry(id) {
    setState((prev) => ({ ...(prev || DEFAULT_DAILY_LOG), entries: ((prev && prev.entries) || []).filter((e) => e.id !== id) }));
  }

  const inputStyle = { padding: "9px 11px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent };
  const daySnaps = (snapshots || []).filter((x) => x.ts && logDayKey(x.ts) === dayKey).length;
  const dayNotices = (notices || []).filter((x) => x.at && logDayKey(x.at) === dayKey).length;

  return (
    <MoModal
      theme={theme}
      icon={<IconClipboard size={20} />}
      title="Daily InfoSec Log"
      helpId="dailylog"
      subtitle="Auto-compiles the day's vuln snapshots, app-notices, and policy progress with your notes into a copy-ready standup / end-of-day summary."
      onClose={onClose}
      footer={
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <MoButton theme={theme} variant="primary" onClick={() => doCopy("log", log)}>{copied === "log" ? "Copied!" : "Copy log"}</MoButton>
          <MoButton theme={theme} onClick={() => moDownload(`infosec-log-${dayKey}.txt`, log)}><IconUpload size={13} /> Download .txt</MoButton>
          <MoButton theme={theme} onClick={saveEntry}>{saved ? "Saved!" : "Save to log"}</MoButton>
        </div>
      }
    >
      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "flex-end", marginBottom: "16px" }}>
        <div>
          <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.textMuted, marginBottom: "5px" }}>Log date</label>
          <input type="date" value={dayKey} onChange={(e) => setDayKey(e.target.value || dayKey)} className="v-input" style={inputStyle} />
        </div>
        <div style={{ fontSize: "12.5px", color: theme.textFaint, paddingBottom: "9px" }}>
          {daySnaps} snapshot{daySnaps === 1 ? "" : "s"} · {dayNotices} notice{dayNotices === 1 ? "" : "s"} on this day
        </div>
      </div>

      <div>
        <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.textMuted, marginBottom: "5px" }}>Notes for the day</label>
        <textarea
          value={notesForDay}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Anything else worth logging — tickets closed, meetings, follow-ups…"
          rows={3}
          className="v-input v-scroll"
          style={{ ...inputStyle, width: "100%", resize: "vertical", "--scroll-thumb": theme.divider }}
        />
      </div>

      <div style={{ marginTop: "20px" }}>
        <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.sectionLabelColor, marginBottom: "8px" }}>Preview</div>
        <pre className="v-scroll" style={{ margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "12.5px", lineHeight: 1.55, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: theme.text, background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: "12px", padding: "16px 18px", "--scroll-thumb": theme.divider }}>{log}</pre>
      </div>

      {s.entries && s.entries.length > 0 && (
        <div style={{ marginTop: "22px" }}>
          <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.sectionLabelColor, marginBottom: "8px" }}>Saved logs ({s.entries.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {s.entries.map((e) => (
              <div key={e.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}` }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: "13px", fontWeight: 700, color: theme.text }}>{logPrettyDate(e.day)}</div>
                  <div style={{ fontSize: "11px", color: theme.textFaint }}>saved {new Date(e.at).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div>
                </div>
                <button onClick={() => doCopy(e.id, e.text)} className="v-btn" style={{ fontSize: "12px", fontWeight: 700, color: theme.accent, background: theme.accentSoft, border: "none", borderRadius: "8px", padding: "6px 10px" }}>{copied === e.id ? "Copied!" : "Copy"}</button>
                <button onClick={() => removeEntry(e.id)} className="v-btn" title="Delete" style={{ fontSize: "12px", fontWeight: 700, color: theme.danger, background: "transparent", border: `1px solid ${theme.cardBorder}`, borderRadius: "8px", padding: "6px 10px" }}>Delete</button>
              </div>
            ))}
          </div>
        </div>
      )}
    </MoModal>
  );
}

/* ===== CVE / KEV lookup (MO tool) =====
   Checks CVE IDs against CISA's Known Exploited Vulnerabilities catalog.
   The catalog loads either live (if the browser can reach CISA with CORS)
   or from an uploaded copy of the JSON — after that, lookups are instant
   and fully offline. The normalized catalog caches to localStorage. */

const KEV_URL = "https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json";

function normalizeKev(json) {
  const vulns = (json && json.vulnerabilities) || [];
  if (!Array.isArray(vulns) || !vulns.length) throw new Error("This file doesn't look like the KEV catalog (no vulnerabilities array).");
  const entries = vulns.map((v) => ({
    cveID: (v.cveID || "").toUpperCase(),
    vendorProject: v.vendorProject || "",
    product: v.product || "",
    vulnerabilityName: v.vulnerabilityName || "",
    dateAdded: v.dateAdded || "",
    dueDate: v.dueDate || "",
    ransomware: v.knownRansomwareCampaignUse || "Unknown",
    requiredAction: v.requiredAction || "",
  }));
  return { entries, catalogVersion: json.catalogVersion || null, dateReleased: json.dateReleased || null, count: json.count || entries.length };
}

function parseCveList(text) {
  const set = [];
  const re = /CVE-\d{4}-\d{4,7}/gi;
  let m;
  while ((m = re.exec(text || "")) !== null) {
    const id = m[0].toUpperCase();
    if (!set.includes(id)) set.push(id);
  }
  return set;
}

const NVD_CVE_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0";
async function fetchNvdCves(keyword) {
  const url = `${NVD_CVE_URL}?keywordSearch=${encodeURIComponent(keyword)}&resultsPerPage=10`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`NVD lookup failed (${res.status})`);
  const json = await res.json();
  return (json.vulnerabilities || []).map((v) => {
    const cve = v.cve;
    const desc = (cve.descriptions || []).find((d) => d.lang === "en");
    const metrics = cve.metrics || {};
    const cvss = (metrics.cvssMetricV31 || metrics.cvssMetricV30 || metrics.cvssMetricV2 || [])[0];
    return {
      id: cve.id,
      description: desc ? desc.value : "",
      severity: cvss ? cvss.cvssData.baseSeverity || null : null,
      score: cvss ? cvss.cvssData.baseScore : null,
      published: cve.published,
    };
  });
}
function cveSeverityColor(theme, sev) {
  const s = String(sev || "").toUpperCase();
  if (s === "CRITICAL") return theme.danger;
  if (s === "HIGH") return theme.danger;
  if (s === "MEDIUM") return "#f59e0b";
  return theme.textMuted;
}

function CveWatchlistModal({ theme, watchlist, setWatchlist, onClose }) {
  const [keyword, setKeyword] = useState("");
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState(null);

  function addKeyword() {
    const k = keyword.trim();
    if (!k) return;
    if ((watchlist || []).some((w) => w.keyword.toLowerCase() === k.toLowerCase())) { setKeyword(""); return; }
    setWatchlist([...(watchlist || []), { id: "cve" + Date.now(), keyword: k, results: null, fetchedAt: null }]);
    setKeyword("");
  }
  function removeKeyword(id) {
    const removed = (watchlist || []).find((w) => w.id === id);
    setWatchlist((watchlist || []).filter((w) => w.id !== id));
    if (removed) {
      toast.show({
        message: `Removed "${removed.keyword}" from the watchlist.`,
        action: { label: "Undo", onClick: () => setWatchlist((cur) => [...(cur || []), removed]) },
      });
    }
  }
  async function checkNow(id) {
    const entry = (watchlist || []).find((w) => w.id === id);
    if (!entry) return;
    setBusyId(id);
    setError(null);
    try {
      const results = await fetchNvdCves(entry.keyword);
      setWatchlist((cur) => (cur || []).map((w) => (w.id === id ? { ...w, results, fetchedAt: Date.now() } : w)));
    } catch (e) {
      setError(`Couldn't check "${entry.keyword}" — ${e.message || "the NVD API may be rate-limiting or unreachable"}.`);
    } finally {
      setBusyId(null);
    }
  }

  const inputStyle = { padding: "9px 11px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent };

  return (
    <MoModal
      theme={theme}
      icon={<IconShield size={20} />}
      title="CVE Watchlist"
      subtitle="Watch vendor or product keywords and check them against the NVD's live CVE database — for finding new relevant vulnerabilities you don't already have a CVE ID for."
      onClose={onClose}
    >
      <div style={{ display: "flex", gap: "8px", marginBottom: "18px" }}>
        <input
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addKeyword()}
          placeholder="Vendor or product (e.g. SentinelOne, Ivanti, Fortinet)"
          className="v-input"
          style={{ ...inputStyle, flex: 1 }}
        />
        <MoButton theme={theme} variant="primary" onClick={addKeyword}>Watch</MoButton>
      </div>
      {error && <div style={{ fontSize: "12.5px", color: theme.danger, marginBottom: "14px" }}>{error}</div>}
      {(watchlist || []).length === 0 ? (
        <div style={{ fontSize: "13px", color: theme.textFaint }}>Nothing watched yet — add a vendor or product above.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          {watchlist.map((w) => (
            <div key={w.id} style={{ border: `1px solid ${theme.cardBorder}`, borderRadius: "12px", padding: "14px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
                <span style={{ fontSize: "14px", fontWeight: 700, color: theme.text, flex: 1 }}>{w.keyword}</span>
                <span style={{ fontSize: "11px", color: theme.textFaint }}>{w.fetchedAt ? `Checked ${timeAgo(w.fetchedAt)}` : "Never checked"}</span>
                <MoButton theme={theme} onClick={() => checkNow(w.id)} disabled={busyId === w.id} style={{ padding: "6px 12px", fontSize: "12px" }}>
                  {busyId === w.id ? "Checking…" : "Check now"}
                </MoButton>
                <button onClick={() => removeKeyword(w.id)} className="v-btn" style={{ fontSize: "16px", color: theme.textFaint, background: "transparent", border: "none", padding: "0 4px", cursor: "pointer" }}>×</button>
              </div>
              {w.results && (
                w.results.length === 0 ? (
                  <div style={{ fontSize: "12.5px", color: theme.textFaint }}>No CVEs found for this keyword.</div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    {w.results.map((r) => (
                      <div key={r.id} style={{ padding: "8px 10px", background: theme.accentSoft, borderRadius: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "3px" }}>
                          <span style={{ fontSize: "12.5px", fontWeight: 700, color: theme.text }}>{r.id}</span>
                          {r.severity && (
                            <span style={{ fontSize: "10px", fontWeight: 700, color: "#fff", background: cveSeverityColor(theme, r.severity), padding: "1px 7px", borderRadius: "999px" }}>
                              {r.severity}{r.score != null ? ` ${r.score}` : ""}
                            </span>
                          )}
                          <span style={{ fontSize: "11px", color: theme.textFaint, marginLeft: "auto" }}>{r.published ? new Date(r.published).toLocaleDateString() : ""}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: theme.textMuted, lineHeight: 1.4 }}>{truncate(r.description, 220)}</div>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </MoModal>
  );
}

// HaveIBeenPwned's email-breach API now requires a paid key; its Pwned
// Passwords range endpoint is still free and needs none — k-anonymity means
// only the first 5 hex chars of the SHA-1 hash ever leave the browser, so
// the password itself (and even its full hash) never does.
async function checkPwnedPassword(password) {
  const enc = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-1", enc);
  const hex = [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("").toUpperCase();
  const prefix = hex.slice(0, 5);
  const suffix = hex.slice(5);
  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  if (!res.ok) throw new Error(`Lookup failed (${res.status})`);
  const text = await res.text();
  const line = text.split("\n").find((l) => l.split(":")[0] === suffix);
  return line ? Number(line.split(":")[1].trim()) : 0;
}

function PasswordBreachModal({ theme, onClose }) {
  const [password, setPassword] = useState("");
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState(null); // { count } | { error }

  async function check() {
    if (!password || checking) return;
    setChecking(true);
    setResult(null);
    try {
      const count = await checkPwnedPassword(password);
      setResult({ count });
    } catch (e) {
      setResult({ error: e.message || "Couldn't reach the Pwned Passwords API." });
    } finally {
      setChecking(false);
    }
  }

  const inputStyle = { padding: "9px 11px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent };

  return (
    <MoModal
      theme={theme}
      icon={<IconLock size={20} />}
      title="Password Breach Check"
      subtitle="Checks a password against HaveIBeenPwned's Pwned Passwords database using k-anonymity — only the first 5 characters of its SHA-1 hash ever leave your browser, never the password or the full hash."
      onClose={onClose}
    >
      <div style={{ display: "flex", gap: "8px", marginBottom: "14px" }}>
        <input
          type="password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setResult(null); }}
          onKeyDown={(e) => e.key === "Enter" && check()}
          placeholder="Password to check"
          className="v-input"
          style={{ ...inputStyle, flex: 1 }}
          autoComplete="off"
        />
        <MoButton theme={theme} variant="primary" onClick={check} disabled={!password || checking}>{checking ? "Checking…" : "Check"}</MoButton>
      </div>
      {result && result.error && <div style={{ fontSize: "12.5px", color: theme.danger }}>{result.error}</div>}
      {result && result.count != null && (
        result.count > 0 ? (
          <div style={{ padding: "12px 14px", borderRadius: "10px", background: theme.dangerSoft, color: theme.danger, fontSize: "13.5px", fontWeight: 600, lineHeight: 1.5 }}>
            Found in {result.count.toLocaleString()} known breach{result.count === 1 ? "" : "es"} — don't use this password anywhere.
          </div>
        ) : (
          <div style={{ padding: "12px 14px", borderRadius: "10px", background: theme.accentSoft, color: theme.positive, fontSize: "13.5px", fontWeight: 600 }}>
            Not found in any known breach — that's a good sign, though it's not a guarantee.
          </div>
        )
      )}
    </MoModal>
  );
}

function KevLookupModal({ theme, state, setState, onClose }) {
  const s = state && "entries" in state ? state : DEFAULT_KEV;
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(null); // { type, message }
  const fileRef = useRef(null);

  const kevMap = useMemo(() => {
    const map = {};
    (s.entries || []).forEach((e) => { map[e.cveID] = e; });
    return map;
  }, [s.entries]);

  const cves = useMemo(() => parseCveList(query), [query]);
  const results = useMemo(() => cves.map((id) => ({ id, hit: kevMap[id] || null })), [cves, kevMap]);
  const hitCount = results.filter((r) => r.hit).length;
  const ransomCount = results.filter((r) => r.hit && String(r.hit.ransomware).toLowerCase() === "known").length;

  async function fetchLive() {
    setBusy(true);
    setStatus({ type: "info", message: "Fetching the latest KEV catalog from CISA…" });
    try {
      const res = await fetch(KEV_URL, { cache: "no-store" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      const json = await res.json();
      const norm = normalizeKev(json);
      setState({ ...norm, fetchedAt: new Date().toISOString() });
      setStatus({ type: "success", message: `Loaded ${norm.count} known-exploited CVEs (catalog ${norm.catalogVersion || "?"}).` });
    } catch (e) {
      setStatus({ type: "error", message: "Couldn't fetch live (CISA may block cross-origin requests from the browser). Download known_exploited_vulnerabilities.json from CISA and use “Upload catalog” instead." });
    } finally {
      setBusy(false);
    }
  }

  function ingestFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const norm = normalizeKev(JSON.parse(reader.result));
        setState({ ...norm, fetchedAt: new Date().toISOString() });
        setStatus({ type: "success", message: `Loaded ${norm.count} known-exploited CVEs (catalog ${norm.catalogVersion || "?"}).` });
      } catch (e) {
        setStatus({ type: "error", message: e.message || "Couldn't parse that file — expected the KEV catalog JSON." });
      }
    };
    reader.readAsText(file);
  }

  const inputStyle = { padding: "9px 11px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent };
  const loaded = !!(s.entries && s.entries.length);
  const todayKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}-${String(new Date().getDate()).padStart(2, "0")}`;

  return (
    <MoModal
      theme={theme}
      icon={<IconShield size={20} />}
      title="CVE / KEV Lookup"
      helpId="kev"
      subtitle="Paste CVE IDs to check them against CISA's Known Exploited Vulnerabilities catalog — see which are actively exploited, ransomware-linked, and their remediation due dates."
      onClose={onClose}
      footer={
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          <MoButton theme={theme} onClick={fetchLive} disabled={busy}>{busy ? "Loading…" : loaded ? "Refresh catalog" : "Load catalog (live)"}</MoButton>
          <MoButton theme={theme} onClick={() => fileRef.current && fileRef.current.click()}>Upload catalog (.json)</MoButton>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={(e) => { ingestFile(e.target.files[0]); e.target.value = ""; }} />
          {loaded && <span style={{ fontSize: "12px", color: theme.textFaint, marginLeft: "auto" }}>{s.count} CVEs · catalog {s.catalogVersion || "?"}{s.fetchedAt ? ` · loaded ${new Date(s.fetchedAt).toLocaleDateString()}` : ""}</span>}
        </div>
      }
    >
      {!loaded && (
        <div style={{ fontSize: "13px", color: theme.textMuted, background: theme.accentSoft, borderRadius: "10px", padding: "12px 14px", marginBottom: "16px", lineHeight: 1.5 }}>
          No catalog loaded yet. Click <strong>Load catalog (live)</strong> to pull it from CISA, or <strong>Upload catalog</strong> if your network blocks that (grab <em>known_exploited_vulnerabilities.json</em> from cisa.gov/known-exploited-vulnerabilities-catalog). It's cached after the first load.
        </div>
      )}
      {status && (
        <div style={{ marginBottom: "16px", fontSize: "13px", fontWeight: 600, padding: "10px 14px", borderRadius: "10px", color: status.type === "error" ? theme.danger : status.type === "success" ? theme.positive : theme.textMuted, background: status.type === "error" ? theme.dangerSoft : theme.accentSoft }}>
          {status.message}
        </div>
      )}

      <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.textMuted, marginBottom: "5px" }}>CVE IDs</label>
      <textarea
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Paste CVE IDs — e.g. CVE-2021-44228, CVE-2023-23397 (any text; we extract the CVE IDs)"
        rows={3}
        className="v-input v-scroll"
        style={{ ...inputStyle, width: "100%", resize: "vertical", "--scroll-thumb": theme.divider }}
      />

      {cves.length > 0 && (
        <div style={{ marginTop: "18px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px", flexWrap: "wrap" }}>
            <span style={{ fontSize: "13px", fontWeight: 700, color: theme.text }}>{cves.length} CVE{cves.length === 1 ? "" : "s"} checked</span>
            {loaded ? (
              <span style={{ fontSize: "12.5px", color: hitCount ? theme.danger : theme.positive, fontWeight: 700 }}>
                {hitCount} known-exploited{ransomCount ? ` · ${ransomCount} ransomware-linked` : ""}
              </span>
            ) : (
              <span style={{ fontSize: "12.5px", color: theme.textFaint }}>load the catalog to check them</span>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {results.map((r) => {
              const hit = r.hit;
              const overdue = hit && hit.dueDate && hit.dueDate < todayKey;
              const ransom = hit && String(hit.ransomware).toLowerCase() === "known";
              return (
                <div key={r.id} style={{ padding: "12px 14px", borderRadius: "10px", border: `1px solid ${hit ? theme.danger : theme.cardBorder}`, background: hit ? theme.dangerSoft : theme.inputBg }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                    <span className="v-tabular" style={{ fontSize: "14px", fontWeight: 800, color: theme.text }}>{r.id}</span>
                    {!loaded ? (
                      <span style={{ fontSize: "12px", color: theme.textFaint }}>—</span>
                    ) : hit ? (
                      <span style={{ fontSize: "11px", fontWeight: 800, color: theme.accentText, background: theme.danger, borderRadius: "999px", padding: "2px 9px", letterSpacing: "0.03em" }}>KNOWN EXPLOITED</span>
                    ) : (
                      <span title="Not in CISA's known-exploited catalog. That is not a statement about severity — triage it on CVSS and exposure." style={{ fontSize: "11px", fontWeight: 700, color: theme.textMuted, background: theme.chip, borderRadius: "999px", padding: "2px 9px" }}>not on KEV</span>
                    )}
                    {ransom && <span style={{ fontSize: "11px", fontWeight: 800, color: theme.danger, border: `1px solid ${theme.danger}`, borderRadius: "999px", padding: "1px 8px" }}>RANSOMWARE</span>}
                  </div>
                  {hit && (
                    <div style={{ marginTop: "7px", fontSize: "12.5px", color: theme.textMuted, lineHeight: 1.5 }}>
                      <div style={{ color: theme.text, fontWeight: 600 }}>{hit.vendorProject} {hit.product} — {hit.vulnerabilityName}</div>
                      <div style={{ marginTop: "3px" }}>Added {hit.dateAdded || "?"} · Due {hit.dueDate || "?"}{overdue ? " (overdue)" : ""}</div>
                      {hit.requiredAction && <div style={{ marginTop: "3px" }}>Action: {hit.requiredAction}</div>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </MoModal>
  );
}

/* ===== Vulnerability Trend Dashboard (MO tool) =====
   Charts the S1/IRU snapshots saved from the Vulnerability Analyzer over
   time. Change-over-time -> line form; Critical & High as status colors with
   solid/dashed + end labels (identity never by color alone); hover tooltip. */
function vtSevColor(theme, sev) {
  return { Critical: theme.danger, High: "#f59e0b", Medium: "#eab308", Low: theme.positive, Info: theme.textMuted, Unrated: theme.textFaint }[sev] || theme.textMuted;
}

function VulnTrendChart({ theme, points }) {
  // points: [{ label, ts, Critical, High }] in time order
  const [hover, setHover] = useState(null);
  const W = 1000, H = 340, L = 46, R = 902, T = 22, B = 288;
  const n = points.length;
  const yMax = Math.max(4, ...points.map((p) => Math.max(p.Critical, p.High))) * 1.15;
  const xAt = (i) => (n <= 1 ? L : L + (i / (n - 1)) * (R - L));
  const yAt = (v) => B - (v / yMax) * (B - T);
  const series = [
    { key: "Critical", dash: null },
    { key: "High", dash: "7 5" },
    { key: "Medium", dash: "2 4" },
    { key: "Low", dash: "10 4 2 4" },
  ];
  const grid = [0, Math.round(yMax / 2), Math.round(yMax)];
  const labelIdx = n <= 6 ? points.map((_, i) => i) : [0, Math.floor((n - 1) / 3), Math.floor((2 * (n - 1)) / 3), n - 1];

  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: "block", maxHeight: "300px" }} preserveAspectRatio="xMidYMid meet">
        {grid.map((g, i) => (
          <g key={i}>
            <line x1={L} y1={yAt(g)} x2={R} y2={yAt(g)} stroke={theme.divider} strokeWidth="1" />
            <text x={L - 8} y={yAt(g) + 4} textAnchor="end" fontSize="12" fill={theme.textFaint}>{g}</text>
          </g>
        ))}
        {labelIdx.map((i) => (
          <text key={i} x={xAt(i)} y={B + 20} textAnchor="middle" fontSize="11" fill={theme.textFaint}>{points[i].label}</text>
        ))}
        {series.map((s) => {
          const col = vtSevColor(theme, s.key);
          const d = points.map((p, i) => `${i === 0 ? "M" : "L"}${xAt(i).toFixed(1)},${yAt(p[s.key]).toFixed(1)}`).join(" ");
          return (
            <g key={s.key}>
              {n > 1 && <path d={d} fill="none" stroke={col} strokeWidth="2.5" strokeDasharray={s.dash || undefined} strokeLinejoin="round" strokeLinecap="round" />}
              {points.map((p, i) => <circle key={i} cx={xAt(i)} cy={yAt(p[s.key])} r="4" fill={col} />)}
              <text x={Math.min(xAt(n - 1) + 10, W - 4)} y={yAt(points[n - 1][s.key]) + 4} fontSize="12" fontWeight="700" fill={col}>{s.key}</text>
            </g>
          );
        })}
        {/* hover columns */}
        {points.map((p, i) => {
          const w = n <= 1 ? R - L : (R - L) / (n - 1);
          return <rect key={i} x={xAt(i) - w / 2} y={T} width={w} height={B - T} fill="transparent" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)} style={{ cursor: "crosshair" }} />;
        })}
        {hover != null && <line x1={xAt(hover)} y1={T} x2={xAt(hover)} y2={B} stroke={theme.textFaint} strokeWidth="1" strokeDasharray="3 3" />}
      </svg>
      {hover != null && (
        <div style={{ position: "absolute", top: "6px", left: `${(xAt(hover) / W) * 100}%`, transform: "translateX(-50%)", pointerEvents: "none", background: theme.cardBg, border: `1px solid ${theme.cardBorder}`, borderRadius: "8px", padding: "6px 9px", fontSize: "12px", whiteSpace: "nowrap", boxShadow: theme.cardShadow }}>
          <div style={{ fontWeight: 700, color: theme.text, marginBottom: "2px" }}>{points[hover].label}</div>
          <div style={{ color: vtSevColor(theme, "Critical") }}>● Critical {points[hover].Critical}</div>
          <div style={{ color: vtSevColor(theme, "High") }}>● High {points[hover].High}</div>
        </div>
      )}
    </div>
  );
}

function VulnTrendModal({ theme, snapshots, onClose }) {
  const [source, setSource] = useState("s1");
  const all = snapshots || [];
  const bySource = useMemo(() => {
    return all.filter((s) => s.source === source).slice().sort((a, b) => new Date(a.ts) - new Date(b.ts));
  }, [all, source]);

  // Every severity the chart draws has to be in the point, or its path is
  // built from undefined and comes out as d="M…,NaN".
  const TREND_SEVS = ["Critical", "High", "Medium", "Low"];
  const points = bySource.map((s) => {
    const pt = {
      label: new Date(s.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      ts: s.ts,
    };
    TREND_SEVS.forEach((sev) => { pt[sev] = (s.counts && s.counts[sev]) || 0; });
    return pt;
  });

  const first = bySource[0], last = bySource[bySource.length - 1];
  const sevs = TREND_SEVS;
  const deltaFor = (sev) => {
    if (!first || !last) return null;
    const f = (first.counts && first.counts[sev]) || 0;
    const l = (last.counts && last.counts[sev]) || 0;
    return { first: f, last: l, delta: l - f };
  };

  return (
    <MoModal
      theme={theme}
      icon={<IconTrendingUp size={20} />}
      title="Vulnerability Trend Dashboard"
      helpId="vulntrend"
      subtitle="Charts the S1 and IRU snapshots you've saved from the Vulnerability Analyzer, so you can show remediation progress over time."
      onClose={onClose}
    >
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px" }}>
        {[["s1", "SentinelOne (S1)"], ["iru", "IRU"]].map(([id, lbl]) => (
          <button key={id} onClick={() => setSource(id)} className="v-btn" style={{ padding: "8px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, cursor: "pointer", border: `1px solid ${source === id ? theme.accent : theme.cardBorder}`, background: source === id ? theme.accentSoft : "transparent", color: source === id ? theme.accent : theme.textMuted }}>{lbl}</button>
        ))}
      </div>

      {bySource.length < 2 ? (
        <div style={{ textAlign: "center", padding: "28px 16px", color: theme.textFaint, fontSize: "13.5px", lineHeight: 1.5, background: theme.inputBg, borderRadius: "12px", border: `1px solid ${theme.inputBorder}` }}>
          {bySource.length === 0
            ? `No ${source.toUpperCase()} snapshots yet. Open the Vulnerability Analyzer, load a ${source.toUpperCase()} export, and hit “Save snapshot” — do that on a few different days to build a trend.`
            : `Only one ${source.toUpperCase()} snapshot so far. Save at least one more (on a later day) to see the trend line.`}
        </div>
      ) : (
        <React.Fragment>
          <VulnTrendChart theme={theme} points={points} />
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px", marginTop: "18px" }}>
            {sevs.map((sev) => {
              const d = deltaFor(sev);
              if (!d) return null;
              const improved = d.delta < 0, worse = d.delta > 0;
              const arrow = improved ? "▼" : worse ? "▲" : "—";
              const dColor = improved ? theme.positive : worse ? theme.danger : theme.textMuted;
              return (
                <div key={sev} style={{ padding: "11px 13px", borderRadius: "10px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", fontWeight: 700, color: theme.textMuted }}>
                    <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: vtSevColor(theme, sev) }} />{sev}
                  </div>
                  <div className="v-tabular" style={{ fontSize: "22px", fontWeight: 800, color: theme.text, marginTop: "3px" }}>{d.last}</div>
                  <div style={{ fontSize: "11.5px", color: dColor, fontWeight: 700 }}>{arrow} {Math.abs(d.delta)} <span style={{ color: theme.textFaint, fontWeight: 500 }}>from {d.first} · since {new Date(first.ts).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span></div>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: "11.5px", color: theme.textFaint, marginTop: "12px" }}>
            {bySource.length} snapshots · {new Date(first.ts).toLocaleDateString()} → {new Date(last.ts).toLocaleDateString()}
          </div>
        </React.Fragment>
      )}
    </MoModal>
  );
}

/* ===== Security Utility Belt (MO tool) — all local, nothing leaves the browser ===== */


function refang(t) {
  return String(t || "")
    .replace(/\[\.\]|\(\.\)|\{\.\}|\[dot\]|\(dot\)/gi, ".")
    .replace(/\[@\]|\(at\)|\[at\]/gi, "@")
    .replace(/\[:\]|\[:\/\/\]/g, ":")
    .replace(/hxxp/gi, "http")
    .replace(/fxp/gi, "ftp");
}
function defang(t) {
  // Refang first so this is idempotent — pasting already-defanged indicators
  // used to yield bad[[.]]site, which nothing can refang back.
  return refang(String(t || ""))
    .replace(/https?/gi, (m) => m.replace(/http/i, "hxxp"))
    .replace(/@/g, "[@]")
    .replace(/\./g, "[.]");
}
function extractIOCs(raw) {
  const t = refang(raw);
  const uniq = (arr) => Array.from(new Set(arr));
  const grab = (re) => uniq((t.match(re) || []));
  const urls = grab(/\bhttps?:\/\/[^\s"'<>)\]]+/gi);
  const emails = grab(/\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi);
  const ipv4 = grab(/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g);
  const sha256 = grab(/\b[a-f0-9]{64}\b/gi);
  const sha1 = grab(/\b[a-f0-9]{40}\b/gi);
  const md5 = grab(/\b[a-f0-9]{32}\b/gi);
  const cves = uniq((t.match(/CVE-\d{4}-\d{4,7}/gi) || []).map((c) => c.toUpperCase()));
  // domains: strip out those that are only inside emails/urls noise; keep TLD-bearing hosts
  // The mail domain and the URL host are the indicators that matter, so derive
  // them directly rather than hoping the loose pattern below finds them. The
  // previous version did the opposite: it excluded every email domain and kept
  // whatever else matched, so "victim.user@example.org" reported "victim.user"
  // as a domain and never reported example.org at all.
  const emailDomains = emails
    .map((e) => (e.split("@")[1] || "").toLowerCase())
    .filter(Boolean);
  const emailLocals = new Set(emails.map((e) => (e.split("@")[0] || "").toLowerCase()));
  const urlHosts = urls
    .map((u) => { try { return new URL(u).hostname.toLowerCase(); } catch (e) { return ""; } })
    .filter(Boolean);

  // "setup.exe", "notes.txt" and "node.js" all match a naive domain pattern,
  // which buried the real indicators — and so do URL path segments like
  // "login.php". Anything not already known to be a host has to carry a
  // plausible TLD to count.
  const FILE_EXT = ["exe","txt","js","py","dll","sys","png","jpg","jpeg","gif","svg","pdf","doc","docx","xls","xlsx","csv","ppt","pptx","zip","gz","tar","rar","7z","iso","msi","json","xml","html","htm","css","md","log","bat","ps1","sh","conf","ini","cfg","dat","tmp","bak","mp3","mp4","mov","db","sql","yml","yaml","lnk","jar","apk","bin","old","php","asp","aspx","jsp","cgi","rb","go","rs","ts","tsx","jsx","class","war","so","dylib","pl","cs","cpp","java","swift","kt","vue","scss","less","woff","woff2","ttf","eot","ico","webp","avif","heic","wav","flac","avi","mkv","webm"];
  const COMMON_TLD = ["com","net","org","io","co","gov","edu","mil","int","info","biz","dev","app","ai","cloud","site","online","xyz","top","live","tech","store","shop","news","blog","me","tv","cc","us","uk","ca","au","de","fr","nl","eu","ru","cn","jp","kr","in","br","mx","es","it","se","no","fi","dk","pl","ch","at","be","nz","za","ie","pt","cz","gr","tr","il","sg","hk","tw","ua","ro","hu","cl","ar","link","click","zip","mov","rip","lol","gg","sh","st","to","ly","fm","am","is","re","cx","ws","pw","su","icu","cfd","sbs","bond","quest"];
  const known = new Set([].concat(emailDomains, urlHosts));
  const domains = uniq([].concat(
    Array.from(known),
    grab(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,24}\b/gi).map((d) => d.toLowerCase())
  ))
    .filter((d) => !/^\d+\.\d+\.\d+\.\d+$/.test(d))
    .filter((d) => !emailLocals.has(d))
    .filter((d) => {
      if (known.has(d)) return true;
      const tld = d.split(".").pop();
      if (FILE_EXT.indexOf(tld) !== -1) return false;
      return COMMON_TLD.indexOf(tld) !== -1;
    });
  return { urls, domains, ipv4, emails, md5, sha1, sha256, cves };
}

function b64decode(s) {
  const clean = s.trim().replace(/\s+/g, "");
  const bin = atob(clean);
  try { return decodeURIComponent(Array.prototype.map.call(bin, (c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2)).join("")); }
  catch (e) { return bin; }
}
function b64encode(s) {
  return btoa(unescape(encodeURIComponent(s)));
}
function b64urlDecode(s) {
  let x = s.replace(/-/g, "+").replace(/_/g, "/");
  while (x.length % 4) x += "=";
  return b64decode(x);
}
function decodeJWT(token) {
  const parts = token.trim().split(".");
  if (parts.length < 2) throw new Error("Not a JWT (needs at least 2 dot-separated parts).");
  const header = JSON.parse(b64urlDecode(parts[0]));
  const payload = JSON.parse(b64urlDecode(parts[1]));
  const out = ["HEADER", JSON.stringify(header, null, 2), "", "PAYLOAD", JSON.stringify(payload, null, 2)];
  if (payload.exp) out.push("", `exp: ${new Date(payload.exp * 1000).toLocaleString()} (${payload.exp * 1000 < Date.now() ? "EXPIRED" : "valid"})`);
  if (payload.iat) out.push(`iat: ${new Date(payload.iat * 1000).toLocaleString()}`);
  return out.join("\n");
}
async function hashHex(algo, str) {
  const buf = await crypto.subtle.digest(algo, new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function ToolkitCopyBtn({ theme, text, label }) {
  const [done, setDone] = useState(false);
  return (
    <button onClick={() => { const d = () => { setDone(true); setTimeout(() => setDone(false), 1200); }; if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(text).then(d).catch(d); else d(); }}
      className="v-btn" style={{ fontSize: "11px", fontWeight: 700, color: theme.accent, background: theme.accentSoft, border: "none", borderRadius: "7px", padding: "4px 9px" }}>
      {done ? "Copied!" : (label || "Copy")}
    </button>
  );
}

function SecurityToolkitModal({ theme, onClose }) {
  const [tab, setTab] = useState("ioc");
  const [input, setInput] = useState("");
  const [decodeMode, setDecodeMode] = useState("base64");
  const [hashes, setHashes] = useState(null);
  const [fileHash, setFileHash] = useState(null);
  const fileRef = useRef(null);

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", "--focus-ring": theme.accentSoft, "--focus-border": theme.accent, "--scroll-thumb": theme.divider };
  const preStyle = { margin: 0, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: "12.5px", lineHeight: 1.5, fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", color: theme.text, background: theme.inputBg, border: `1px solid ${theme.inputBorder}`, borderRadius: "10px", padding: "12px 14px", maxHeight: "260px", overflow: "auto", "--scroll-thumb": theme.divider };

  const iocs = useMemo(() => (tab === "ioc" && input ? extractIOCs(input) : null), [tab, input]);

  useEffect(() => {
    let cancelled = false;
    if (tab === "hash" && input) {
      Promise.all([hashHex("SHA-256", input), hashHex("SHA-1", input)]).then(([s256, s1]) => { if (!cancelled) setHashes({ s256, s1 }); }).catch(() => setHashes(null));
    } else setHashes(null);
    return () => { cancelled = true; };
  }, [tab, input]);

  let decodeOut = "", decodeErr = "";
  if (tab === "decode" && input) {
    try {
      decodeOut = decodeMode === "base64" ? b64decode(input) : decodeMode === "url" ? decodeURIComponent(input) : decodeMode === "b64encode" ? b64encode(input) : decodeMode === "urlencode" ? encodeURIComponent(input) : decodeJWT(input);
    } catch (e) { decodeErr = e.message || "Couldn't decode that input."; }
  }

  function onFile(f) {
    if (!f) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const buf = await crypto.subtle.digest("SHA-256", reader.result);
      setFileHash({ name: f.name, hex: Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("") });
    };
    reader.readAsArrayBuffer(f);
  }

  const tabs = [["ioc", "IOC Extract"], ["defang", "Defang"], ["decode", "Decode"], ["hash", "Hash"]];
  const iocGroups = iocs ? [
    ["URLs", iocs.urls], ["Domains", iocs.domains], ["IPv4", iocs.ipv4], ["Emails", iocs.emails],
    ["SHA-256", iocs.sha256], ["SHA-1", iocs.sha1], ["MD5", iocs.md5], ["CVEs", iocs.cves],
  ].filter(([, v]) => v.length) : [];

  return (
    <MoModal
      theme={theme}
      icon={<IconWrench size={20} />}
      title="Security Utility Belt"
      helpId="toolkit"
      subtitle="Analyst tools that run entirely in your browser — nothing you paste is uploaded anywhere."
      onClose={onClose}
    >
      <div style={{ display: "flex", gap: "6px", marginBottom: "16px", flexWrap: "wrap" }}>
        {tabs.map(([id, lbl]) => (
          <button key={id} onClick={() => { setTab(id); setFileHash(null); }} className="v-btn" style={{ padding: "8px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, cursor: "pointer", border: `1px solid ${tab === id ? theme.accent : theme.cardBorder}`, background: tab === id ? theme.accentSoft : "transparent", color: tab === id ? theme.accent : theme.textMuted }}>{lbl}</button>
        ))}
      </div>

      {tab === "decode" && (
        <div style={{ display: "flex", gap: "6px", marginBottom: "12px", flexWrap: "wrap" }}>
          {[["base64", "Base64 decode"], ["b64encode", "Base64 encode"], ["url", "URL decode"], ["urlencode", "URL encode"], ["jwt", "JWT decode"]].map(([id, lbl]) => (
            <button key={id} onClick={() => setDecodeMode(id)} className="v-btn" style={{ padding: "6px 11px", borderRadius: "999px", fontSize: "12px", fontWeight: 700, border: `1px solid ${decodeMode === id ? theme.accent : theme.cardBorder}`, background: decodeMode === id ? theme.accentSoft : "transparent", color: decodeMode === id ? theme.accent : theme.textMuted }}>{lbl}</button>
          ))}
        </div>
      )}

      <textarea
        value={input}
        onChange={(e) => setInput(e.target.value)}
        rows={tab === "hash" ? 3 : 5}
        placeholder={
          tab === "ioc" ? "Paste any text (an email, a log line, a report) — IPs, domains, URLs, hashes, and CVEs are pulled out below." :
          tab === "defang" ? "Paste indicators to defang for safe sharing (or defanged ones to refang)." :
          tab === "decode" ? (decodeMode === "jwt" ? "Paste a JWT (eyJ…)." : "Paste the string to " + decodeMode.replace(/encode/, " encode").replace(/^(base64|url)$/, "$1 decode") + ".") :
          "Type or paste text to hash (SHA-256 + SHA-1)."
        }
        className="v-input v-scroll"
        style={inputStyle}
      />

      {/* IOC output */}
      {tab === "ioc" && input && (
        <div style={{ marginTop: "14px" }}>
          {iocGroups.length === 0 ? (
            <div style={{ fontSize: "13px", color: theme.textFaint }}>No indicators found in that text.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {iocGroups.map(([name, vals]) => (
                <div key={name}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.sectionLabelColor }}>{name}</span>
                    <span style={{ fontSize: "11px", color: theme.textFaint }}>{vals.length}</span>
                    <span style={{ marginLeft: "auto" }}><ToolkitCopyBtn theme={theme} text={vals.join("\n")} /></span>
                    <ToolkitCopyBtn theme={theme} text={vals.map(defang).join("\n")} label="Copy defanged" />
                  </div>
                  <pre className="v-scroll" style={{ ...preStyle, maxHeight: "120px" }}>{vals.join("\n")}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Defang / refang */}
      {tab === "defang" && input && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))", gap: "12px", marginTop: "14px" }}>
          {[["Defanged (safe to share)", defang(input)], ["Refanged (live)", refang(input)]].map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.sectionLabelColor, flex: 1 }}>{lbl}</span>
                <ToolkitCopyBtn theme={theme} text={val} />
              </div>
              <pre className="v-scroll" style={preStyle}>{val}</pre>
            </div>
          ))}
        </div>
      )}

      {/* Decode */}
      {tab === "decode" && input && (
        <div style={{ marginTop: "14px" }}>
          <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
            <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.sectionLabelColor, flex: 1 }}>Output</span>
            {!decodeErr && <ToolkitCopyBtn theme={theme} text={decodeOut} />}
          </div>
          {decodeErr ? <div style={{ fontSize: "13px", color: theme.danger, background: theme.dangerSoft, borderRadius: "10px", padding: "10px 13px" }}>{decodeErr}</div>
            : <pre className="v-scroll" style={preStyle}>{decodeOut}</pre>}
        </div>
      )}

      {/* Hash */}
      {tab === "hash" && (
        <div style={{ marginTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
          {hashes && [["SHA-256", hashes.s256], ["SHA-1", hashes.s1]].map(([name, val]) => (
            <div key={name}>
              <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.sectionLabelColor, flex: 1 }}>{name}</span>
                <ToolkitCopyBtn theme={theme} text={val} />
              </div>
              <pre className="v-scroll" style={{ ...preStyle, maxHeight: "none" }}>{val}</pre>
            </div>
          ))}
          <div style={{ borderTop: `1px solid ${theme.divider}`, paddingTop: "12px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.sectionLabelColor, marginBottom: "8px" }}>File SHA-256</div>
            <button onClick={() => fileRef.current && fileRef.current.click()} className="v-btn" style={{ padding: "8px 14px", borderRadius: "9px", fontSize: "13px", fontWeight: 700, border: `1px solid ${theme.cardBorder}`, background: "transparent", color: theme.text }}>Choose a file…</button>
            <input ref={fileRef} type="file" style={{ display: "none" }} onChange={(e) => { onFile(e.target.files[0]); e.target.value = ""; }} />
            {fileHash && (
              <div style={{ marginTop: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", marginBottom: "4px" }}>
                  <span style={{ fontSize: "12px", color: theme.textMuted, flex: 1 }}>{fileHash.name}</span>
                  <ToolkitCopyBtn theme={theme} text={fileHash.hex} />
                </div>
                <pre className="v-scroll" style={{ ...preStyle, maxHeight: "none" }}>{fileHash.hex}</pre>
              </div>
            )}
          </div>
        </div>
      )}
    </MoModal>
  );
}

/* ===== Phishing Email Header Analyzer (MO tool) — all local parsing ===== */


function phishUnfold(raw) {
  let text = String(raw || "").replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  // A pasted header block is often indented as a whole; without this the very
  // first line looks like a continuation and everything unfolds into nothing.
  const allIndented = text.split("\n").filter((l) => l.trim()).every((l) => /^[ \t]/.test(l));
  if (allIndented) text = text.split("\n").map((l) => l.replace(/^[ \t]+/, "")).join("\n");
  // Headers end at the first blank line. Anything after it is the body, and a
  // quoted "Received:" in a forwarded message must not become the origin hop.
  const blank = text.search(/\n[ \t]*\n/);
  if (blank !== -1) text = text.slice(0, blank);
  const lines = text.split("\n");
  const out = [];
  for (const line of lines) {
    if (/^[ \t]/.test(line) && out.length) out[out.length - 1] += " " + line.trim();
    else out.push(line);
  }
  return out;
}
// Relaxed alignment: same registrable domain, allowing a subdomain either way.
// github.com and notifications.github.com align; github.com and evil.ru do not.
function phishDomainsAlign(a, b) {
  const x = String(a || "").toLowerCase().replace(/\.$/, "");
  const y = String(b || "").toLowerCase().replace(/\.$/, "");
  if (!x || !y) return true;
  if (x === y) return true;
  const reg = (d) => d.split(".").slice(-2).join(".");
  return reg(x) === reg(y) || x.endsWith("." + y) || y.endsWith("." + x);
}

function phishEmailAddr(s) { const m = String(s || "").match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i); return m ? m[0] : ""; }
function phishDomain(s) { const a = phishEmailAddr(s); const m = a.match(/@([a-z0-9.-]+\.[a-z]{2,})/i); return m ? m[1].toLowerCase() : ""; }

function analyzeHeaders(raw) {
  const lines = phishUnfold(raw);
  const received = [];
  const map = {};
  for (const line of lines) {
    const m = line.match(/^([A-Za-z0-9-]+):[ \t]?(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase(), val = m[2];
    if (key === "received") received.push(val);
    else if (key === "authentication-results") map[key] = (map[key] ? map[key] + " " : "") + val;
    else if (!(key in map)) map[key] = val;
  }
  const auth = (map["authentication-results"] || "") + " " + (map["received-spf"] || "");
  const pick = (re) => { const m = auth.match(re); return m ? m[1].toLowerCase() : null; };
  const spf = pick(/spf=([a-z]+)/i) || (/(pass|fail|softfail|neutral|none)/i.test(map["received-spf"] || "") ? (map["received-spf"].match(/(pass|fail|softfail|neutral|none)/i)[1].toLowerCase()) : null);
  const dkim = pick(/dkim=([a-z]+)/i);
  const dmarc = pick(/dmarc=([a-z]+)/i);

  const fromDom = phishDomain(map["from"]);
  const returnDom = phishDomain(map["return-path"]);
  const replyDom = phishDomain(map["reply-to"]);
  const dkimSig = map["dkim-signature"] || "";
  const dkimDom = (dkimSig.match(/d=([a-z0-9.-]+)/i) || [])[1] || "";

  // Hops: received[] is newest-first; reverse for origin -> destination
  const hops = received.slice().reverse().map((r) => {
    const ip = (r.match(/\[?((?:\d{1,3}\.){3}\d{1,3})\]?/) || [])[1] || "";
    const fromHost = (r.match(/from\s+([^\s(]+)/i) || [])[1] || "";
    const byHost = (r.match(/by\s+([^\s(;]+)/i) || [])[1] || "";
    const when = (r.split(";")[1] || "").trim();
    return { ip, fromHost, byHost, when };
  });
  const originIP = (hops.find((h) => h.ip) || {}).ip || "";

  const flags = [];
  // Relaxed alignment is what SPF and DMARC actually check: a bounce path on
  // a subdomain of the From domain aligns. Comparing full hostnames flagged
  // every legitimate notification sender — and did it on messages this same
  // tool reported as DMARC PASS, so the two halves of the output contradicted
  // each other.
  if (fromDom && returnDom && !phishDomainsAlign(fromDom, returnDom)) {
    flags.push(
      dmarc === "pass"
        ? `Return-Path (${returnDom}) sits outside the From domain (${fromDom}) — DMARC still passed, so alignment is coming from DKIM.`
        : `From domain (${fromDom}) ≠ Return-Path domain (${returnDom}) — SPF won't align.`
    );
  }
  if (fromDom && replyDom && !phishDomainsAlign(fromDom, replyDom)) flags.push(`Reply-To domain (${replyDom}) differs from From (${fromDom}) — replies go elsewhere.`);
  if (fromDom && dkimDom && !dkimDom.endsWith(fromDom) && !fromDom.endsWith(dkimDom)) flags.push(`DKIM signing domain (${dkimDom}) doesn't align with From (${fromDom}).`);
  if (spf === "fail" || spf === "softfail") flags.push(`SPF ${spf} — sending IP not authorized by the From domain.`);
  if (dmarc === "fail") flags.push("DMARC fail — message would be rejected/quarantined by a strict policy.");

  return {
    spf, dkim, dmarc, originIP,
    from: phishEmailAddr(map["from"]) || (map["from"] || "").trim(),
    returnPath: phishEmailAddr(map["return-path"]),
    replyTo: phishEmailAddr(map["reply-to"]),
    subject: map["subject"] || "",
    date: map["date"] || "",
    messageId: map["message-id"] || "",
    fromDom, returnDom, dkimDom, hops, flags,
    hasData: lines.some((l) => /^[A-Za-z-]+:/.test(l)),
  };
}

function PhishAuthBadge({ theme, label, value }) {
  const v = (value || "").toLowerCase();
  const good = v === "pass";
  const bad = v === "fail" || v === "softfail" || v === "permerror";
  const color = good ? theme.positive : bad ? theme.danger : theme.textMuted;
  const bg = good ? theme.accentSoft : bad ? theme.dangerSoft : theme.chip;
  return (
    <div style={{ flex: "1 1 90px", padding: "10px 12px", borderRadius: "10px", background: bg, border: `1px solid ${theme.cardBorder}` }}>
      <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", color: theme.textMuted }}>{label}</div>
      <div style={{ fontSize: "16px", fontWeight: 800, color, textTransform: "uppercase" }}>{value || "—"}</div>
    </div>
  );
}

function PhishHeaderModal({ theme, onClose }) {
  const [raw, setRaw] = useState("");
  const a = useMemo(() => (raw.trim() ? analyzeHeaders(raw) : null), [raw]);
  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: "9px", fontSize: "12.5px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, resize: "vertical", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", "--focus-ring": theme.accentSoft, "--focus-border": theme.accent, "--scroll-thumb": theme.divider };
  const rowLabel = { fontSize: "11px", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: theme.textMuted, width: "110px", flexShrink: 0 };

  return (
    <MoModal
      theme={theme}
      icon={<IconEnvelope size={20} />}
      title="Phishing Header Analyzer"
      helpId="phish"
      subtitle="Paste an email's raw headers (View original / Show original) — SPF/DKIM/DMARC, sender IP, address mismatches, and the delivery hop path are parsed locally."
      onClose={onClose}
    >
      <textarea value={raw} onChange={(e) => setRaw(e.target.value)} rows={6} placeholder="Paste raw email headers here — from Gmail “Show original”, Outlook “View source”, etc." className="v-input v-scroll" style={inputStyle} />

      {a && a.hasData && (
        <div style={{ marginTop: "16px", display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <PhishAuthBadge theme={theme} label="SPF" value={a.spf} />
            <PhishAuthBadge theme={theme} label="DKIM" value={a.dkim} />
            <PhishAuthBadge theme={theme} label="DMARC" value={a.dmarc} />
            <div style={{ flex: "1 1 120px", padding: "10px 12px", borderRadius: "10px", background: theme.chip, border: `1px solid ${theme.cardBorder}` }}>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", color: theme.textMuted }}>ORIGIN IP</div>
              <div className="v-tabular" style={{ fontSize: "15px", fontWeight: 800, color: theme.text }}>{a.originIP || "—"}</div>
            </div>
          </div>

          {a.flags.length > 0 && (
            <div style={{ background: theme.dangerSoft, border: `1px solid ${theme.danger}`, borderRadius: "10px", padding: "12px 14px" }}>
              <div style={{ fontSize: "11px", fontWeight: 800, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.danger, marginBottom: "6px" }}>⚠ {a.flags.length} warning{a.flags.length > 1 ? "s" : ""}</div>
              <ul style={{ margin: 0, paddingLeft: "18px", color: theme.text, fontSize: "12.5px", lineHeight: 1.55 }}>
                {a.flags.map((f, i) => <li key={i}>{f}</li>)}
              </ul>
            </div>
          )}
          {a.flags.length === 0 && (a.spf || a.dkim || a.dmarc) && (
            <div style={{ background: theme.accentSoft, borderRadius: "10px", padding: "10px 14px", fontSize: "12.5px", color: theme.positive, fontWeight: 600 }}>No obvious red flags — authentication and addresses look aligned.</div>
          )}

          <div>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.sectionLabelColor, marginBottom: "8px" }}>Addresses</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[["From", a.from], ["Return-Path", a.returnPath], ["Reply-To", a.replyTo], ["DKIM d=", a.dkimDom], ["Subject", a.subject], ["Date", a.date]].filter(([, v]) => v).map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: "10px", alignItems: "baseline" }}>
                  <span style={rowLabel}>{k}</span>
                  <span style={{ fontSize: "13px", color: theme.text, wordBreak: "break-all" }}>{v}</span>
                </div>
              ))}
            </div>
          </div>

          {a.hops.length > 0 && (
            <div>
              <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.sectionLabelColor, marginBottom: "8px" }}>Delivery path ({a.hops.length} hop{a.hops.length > 1 ? "s" : ""}) — origin first</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {a.hops.map((h, i) => (
                  <div key={i} style={{ display: "flex", gap: "10px", alignItems: "baseline", padding: "8px 10px", borderRadius: "9px", background: theme.inputBg, border: `1px solid ${theme.inputBorder}` }}>
                    <span style={{ fontSize: "11px", fontWeight: 800, color: theme.textFaint, width: "20px", flexShrink: 0 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "12.5px", color: theme.text }}>{h.fromHost || "?"}{h.ip ? ` (${h.ip})` : ""}{h.byHost ? ` → ${h.byHost}` : ""}</div>
                      {h.when && <div style={{ fontSize: "11px", color: theme.textFaint, marginTop: "1px" }}>{h.when}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </MoModal>
  );
}

function PolicyStatusSelect({ theme, value, onChange }) {
  const color = POLICY_STATUS_COLOR[value] || theme.textMuted;
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="v-input"
      style={{
        width: "132px", flexShrink: 0, padding: "7px 8px", borderRadius: "8px", fontSize: "12.5px", fontWeight: 700,
        background: theme.inputBg, color: theme.inputText,
        border: `1px solid ${theme.inputBorder}`, borderLeft: `4px solid ${color}`,
        "--focus-ring": theme.accentSoft, "--focus-border": theme.accent,
      }}
    >
      {POLICY_STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
    </select>
  );
}

function PolicyTrackerModal({ theme, policies, setPolicies, onClose }) {
  const [filter, setFilter] = useState("all");
  const [newName, setNewName] = useState("");
  const [msg, setMsg] = useState(null);

  function note(m) { setMsg(m); setTimeout(() => setMsg(null), 2200); }
  function patch(id, changes) {
    setPolicies((prev) => prev.map((p) => (p.id === id ? { ...p, ...changes, updatedAt: Date.now() } : p)));
  }

  function addPolicy() {
    const name = newName.trim();
    if (!name) return;
    setPolicies((prev) => [
      ...prev,
      { id: "pol-custom-" + Date.now(), name, category: "Custom", status: "todo", owner: "", notes: "", hasFile: false, fileName: "", fileType: "", fileSize: 0, updatedAt: Date.now() },
    ]);
    setNewName("");
  }

  async function deletePolicy(id) {
    setPolicies((prev) => prev.filter((p) => p.id !== id));
    try { await dbDeletePolicyDoc(id); } catch (e) { /* nothing stored */ }
  }

  async function uploadDoc(id, file) {
    if (!file) return;
    try {
      await dbPutPolicyDoc({ id, blob: file, name: file.name, type: file.type, size: file.size });
      patch(id, { hasFile: true, fileName: file.name, fileType: file.type, fileSize: file.size });
      note({ type: "success", message: `Stored “${file.name}”.` });
    } catch (e) {
      note({ type: "error", message: e.message || "Couldn't store that file." });
    }
  }

  async function downloadDoc(p) {
    try {
      const rec = await dbGetPolicyDoc(p.id);
      if (!rec || !rec.blob) { note({ type: "error", message: "File isn't in local storage anymore." }); return; }
      const url = URL.createObjectURL(rec.blob);
      const a = document.createElement("a");
      a.href = url; a.download = p.fileName || rec.name || "policy";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
      note({ type: "error", message: "Couldn't open the file." });
    }
  }

  async function removeDoc(id) {
    try { await dbDeletePolicyDoc(id); } catch (e) { /* ignore */ }
    patch(id, { hasFile: false, fileName: "", fileType: "", fileSize: 0 });
  }

  function addStarterSet() {
    setPolicies((prev) => {
      const have = new Set(prev.map((p) => p.name.toLowerCase()));
      const missing = moDefaultPolicies().filter((d) => !have.has(d.name.toLowerCase()));
      if (missing.length === 0) { note({ type: "success", message: "Starter list already present." }); return prev; }
      note({ type: "success", message: `Added ${missing.length} starter ${missing.length === 1 ? "policy" : "policies"}.` });
      return [...prev, ...missing];
    });
  }

  function exportCSV() {
    const header = ["Policy / Procedure", "Category", "Status", "Document", "Last updated"];
    const lines = [header.map(moCsvCell).join(",")];
    policies.forEach((p) => lines.push([
      p.name, p.category, POLICY_STATUS_LABEL[p.status] || p.status, p.hasFile ? p.fileName : "", p.updatedAt ? moFormatTs(p.updatedAt) : "",
    ].map(moCsvCell).join(",")));
    moDownload("policy-tracker.csv", lines.join("\n"), "text/csv;charset=utf-8");
  }

  const counts = useMemo(() => {
    const c = { total: policies.length };
    POLICY_STATUSES.forEach((s) => (c[s.id] = 0));
    policies.forEach((p) => { c[p.status] = (c[p.status] || 0) + 1; });
    return c;
  }, [policies]);
  const pct = counts.total ? Math.round(((counts.done || 0) / counts.total) * 100) : 0;

  const visible = useMemo(
    () => (filter === "all" ? policies : policies.filter((p) => p.status === filter)),
    [policies, filter]
  );
  const grouped = useMemo(() => {
    const order = ["Governance", "Access & Identity", "Data Protection", "Operations", "Resilience", "Infrastructure", "Custom"];
    const map = {};
    visible.forEach((p) => { (map[p.category] = map[p.category] || []).push(p); });
    return Object.keys(map)
      .sort((a, b) => {
        const ia = order.indexOf(a), ib = order.indexOf(b);
        return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a.localeCompare(b);
      })
      .map((c) => ({ category: c, items: map[c] }));
  }, [visible]);

  return (
    <MoModal
      theme={theme}
      icon={<IconClipboard size={20} />}
      title="Policy & Procedure Writeup"
      helpId="policy"
      subtitle="Track which security policies and procedures are written, in progress, or still to do — and upload the finished documents to keep them in one place."
      onClose={onClose}
    >
      {/* Progress summary */}
      <div style={{ marginBottom: "16px" }}>
        <div style={{ display: "flex", alignItems: "baseline", gap: "10px", marginBottom: "8px", flexWrap: "wrap" }}>
          <span className="v-tabular" style={{ fontSize: "24px", fontWeight: 800, color: theme.text }}>{counts.done || 0}<span style={{ fontSize: "15px", color: theme.textMuted }}> / {counts.total} complete</span></span>
          <span style={{ fontSize: "13px", fontWeight: 700, color: theme.accent, marginLeft: "auto" }}>{pct}%</span>
        </div>
        <div style={{ height: "8px", borderRadius: "999px", background: theme.progressTrack, overflow: "hidden" }}>
          <div style={{ width: `${pct}%`, height: "100%", background: theme.progressFill, transition: "width 0.3s ease" }} />
        </div>
      </div>

      {/* Status filter chips */}
      <div style={{ display: "flex", gap: "7px", flexWrap: "wrap", marginBottom: "14px" }}>
        {[{ id: "all", label: `All (${counts.total})` }].concat(POLICY_STATUSES.map((s) => ({ id: s.id, label: `${s.label} (${counts[s.id] || 0})`, color: s.color }))).map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="v-btn"
              style={{
                display: "inline-flex", alignItems: "center", gap: "6px", padding: "6px 12px", borderRadius: "999px",
                fontSize: "12px", fontWeight: 700,
                border: `1px solid ${active ? theme.accent : theme.cardBorder}`,
                background: active ? theme.accent : "transparent",
                color: active ? theme.accentText : theme.textMuted,
              }}
            >
              {f.color && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: f.color }} />}
              {f.label}
            </button>
          );
        })}
      </div>

      {/* Add + export toolbar */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "16px", flexWrap: "wrap" }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") addPolicy(); }}
          placeholder="Add a policy or procedure…"
          className="v-input"
          style={{ flex: 1, minWidth: "180px", padding: "8px 11px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent }}
        />
        <MoButton theme={theme} variant="primary" onClick={addPolicy}>Add</MoButton>
        <MoButton theme={theme} onClick={exportCSV}><IconShare size={13} /> Export CSV</MoButton>
      </div>

      {msg && (
        <div style={{ marginBottom: "12px", fontSize: "13px", fontWeight: 600, padding: "9px 13px", borderRadius: "9px", color: msg.type === "error" ? theme.danger : theme.positive, background: msg.type === "error" ? theme.dangerSoft : theme.accentSoft }}>
          {msg.message}
        </div>
      )}

      {/* Grouped list */}
      {policies.length === 0 ? (
        <div style={{ textAlign: "center", padding: "28px 16px", color: theme.textFaint, fontSize: "13px" }}>
          Your list is empty. <button onClick={addStarterSet} className="v-btn" style={{ color: theme.accent, background: "transparent", border: "none", fontWeight: 700, padding: 0 }}>Add the starter set</button> or add your own above.
        </div>
      ) : grouped.length === 0 ? (
        <EmptyState
          theme={theme}
          art="search"
          title="Nothing in this view"
          message="No policies match the current filter — clear it to see the rest."
        />
      ) : (
        grouped.map((g) => (
          <div key={g.category} style={{ marginBottom: "16px" }}>
            <div style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: theme.sectionLabelColor, marginBottom: "8px" }}>{g.category}</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {g.items.map((p) => (
                <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 11px", border: `1px solid ${theme.cardBorder}`, borderRadius: "10px", flexWrap: "wrap" }}>
                  <PolicyStatusSelect theme={theme} value={p.status} onChange={(s) => patch(p.id, { status: s })} />
                  <div style={{ flex: 1, minWidth: "160px" }}>
                    <div style={{ fontSize: "13.5px", fontWeight: 600, color: theme.text, lineHeight: 1.3 }}>{p.name}</div>
                    {p.hasFile ? (
                      <button
                        onClick={() => downloadDoc(p)}
                        className="v-btn"
                        title="Download stored document"
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "3px", padding: 0, border: "none", background: "transparent", color: theme.accent, fontSize: "11.5px", fontWeight: 600 }}
                      >
                        <IconBookOpen size={12} /> {p.fileName} <span style={{ color: theme.textFaint, fontWeight: 500 }}>({formatBytes(p.fileSize)})</span>
                      </button>
                    ) : (
                      <div style={{ fontSize: "11.5px", color: theme.textFaint, marginTop: "2px" }}>No document uploaded</div>
                    )}
                  </div>
                  {p.hasFile ? (
                    <button onClick={() => removeDoc(p.id)} className="v-btn" title="Remove document" style={{ fontSize: "12px", fontWeight: 700, color: theme.textMuted, background: "transparent", border: `1px solid ${theme.cardBorder}`, borderRadius: "8px", padding: "6px 10px" }}>
                      Remove file
                    </button>
                  ) : (
                    <label className="v-btn" style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", fontSize: "12px", fontWeight: 700, color: theme.text, background: theme.accentSoft, border: `1px solid ${theme.cardBorder}`, borderRadius: "8px", padding: "6px 10px" }}>
                      <IconUpload size={13} /> Upload
                      <input type="file" accept=".pdf,.doc,.docx,.txt,.md,.rtf,.odt,.pages" style={{ display: "none" }} onChange={(e) => { uploadDoc(p.id, e.target.files[0]); e.target.value = ""; }} />
                    </label>
                  )}
                  <button onClick={() => deletePolicy(p.id)} className="v-btn" title="Delete from list" style={{ border: "none", background: "transparent", color: theme.textMuted, padding: "4px", display: "inline-flex", flexShrink: 0 }}>
                    <IconClose />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      )}

      {policies.length > 0 && (
        <div style={{ marginTop: "6px" }}>
          <button onClick={addStarterSet} className="v-btn" style={{ fontSize: "12px", fontWeight: 700, color: theme.textMuted, background: "transparent", border: `1px solid ${theme.cardBorder}`, borderRadius: "8px", padding: "6px 12px" }}>
            + Add any missing starter policies
          </button>
        </div>
      )}
    </MoModal>
  );
}

/* ---- Weekly PowerPoint deck builder (template filler) ---- */
function DeckBuilderModal({ theme, deck, setDeck, onClose }) {
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef(null);

  const hasTemplate = !!(deck && deck.name && deck.tokens);

  async function ingestTemplate(file) {
    if (!file) return;
    if (!/\.pptx$/i.test(file.name)) {
      setStatus({ type: "error", message: "Please upload a .pptx file (PowerPoint)." });
      return;
    }
    setBusy(true);
    setStatus({ type: "loading", message: `Reading ${file.name}…` });
    try {
      const { tokens, malformed } = await deckScanTemplate(file);
      await dbPutPolicyDoc({ id: DECK_TEMPLATE_ID, blob: file, name: file.name, type: file.type, size: file.size });
      setDeck((prev) => {
        const keepVals = prev && prev.values ? prev.values : {};
        const values = {};
        tokens.forEach((t) => { values[t] = keepVals[t] || ""; });
        return { name: file.name, tokens, values };
      });
      const warn = malformed ? ` ${malformed} looked malformed (check for a missing "}}") and ${malformed === 1 ? "was" : "were"} skipped.` : "";
      setStatus(
        tokens.length
          ? { type: malformed ? "error" : "success", message: `Found ${tokens.length} placeholder${tokens.length === 1 ? "" : "s"}.` + warn }
          : { type: "error", message: "No {{placeholders}} found. Add tokens like {{critical}} to your slides, then re-upload." + warn }
      );
      if (malformed) toast.warn(`${malformed} malformed placeholder${malformed === 1 ? "" : "s"} skipped — check for a missing "}}".`);
    } catch (e) {
      setStatus({ type: "error", message: e.message || "Couldn't read that .pptx." });
    } finally {
      setBusy(false);
    }
  }

  function setValue(token, val) {
    setDeck((prev) => ({ ...prev, values: { ...prev.values, [token]: val } }));
  }

  async function generate() {
    setBusy(true);
    setStatus({ type: "loading", message: "Building your deck…" });
    try {
      const blob = await deckGenerate(deck.values || {});
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const iso = new Date().toISOString().slice(0, 10);
      a.href = url;
      a.download = (deck.name || "report").replace(/\.pptx$/i, "") + `-${iso}.pptx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 1500);
      setStatus({ type: "success", message: "Generated — check your downloads." });
    } catch (e) {
      setStatus({ type: "error", message: e.message || "Couldn't generate the deck." });
    } finally {
      setBusy(false);
    }
  }

  async function replaceTemplate() {
    try { await dbDeletePolicyDoc(DECK_TEMPLATE_ID); } catch (e) { /* ignore */ }
    setDeck(null);
    setStatus(null);
  }

  const dropStyle = {
    border: `2px dashed ${dragOver ? theme.accent : theme.inputBorder}`,
    borderRadius: "14px", padding: "30px 20px", textAlign: "center",
    background: dragOver ? theme.accentSoft : "transparent", transition: "all 0.15s ease", cursor: "pointer",
  };

  return (
    <MoModal
      theme={theme}
      icon={<IconDeck size={20} />}
      title="Weekly Report Deck Builder"
      helpId="deck"
      subtitle="Upload your PowerPoint once, fill in this week's numbers, and download a fresh deck with your exact layout. Put placeholders like {{critical}} or {{week_of}} in the slides where the values go."
      onClose={onClose}
      footer={
        hasTemplate ? (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            <MoButton theme={theme} variant="primary" onClick={generate} disabled={busy || deck.tokens.length === 0}>
              <IconUpload size={13} /> {busy ? "Working…" : "Generate PowerPoint"}
            </MoButton>
            <MoButton theme={theme} onClick={() => fileRef.current && fileRef.current.click()} disabled={busy}>Replace template</MoButton>
            <button onClick={replaceTemplate} disabled={busy} className="v-btn" style={{ marginLeft: "auto", fontSize: "12px", fontWeight: 700, color: theme.danger, background: theme.dangerSoft, border: "none", borderRadius: "8px", padding: "8px 12px" }}>
              Remove template
            </button>
            <input ref={fileRef} type="file" accept=".pptx" style={{ display: "none" }} onChange={(e) => { ingestTemplate(e.target.files[0]); e.target.value = ""; }} />
          </div>
        ) : null
      }
    >
      {!hasTemplate && (
        <div
          onClick={() => fileRef.current && fileRef.current.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); ingestTemplate(e.dataTransfer.files[0]); }}
          style={dropStyle}
        >
          <div style={{ color: theme.textMuted, marginBottom: "6px", display: "inline-flex" }}><IconUpload /></div>
          <div style={{ fontSize: "14px", fontWeight: 600, color: theme.text }}>Drop your .pptx template here, or click to browse</div>
          <div style={{ fontSize: "12px", color: theme.textFaint, marginTop: "6px" }}>Stored locally on this device — it never leaves your browser.</div>
          <input ref={fileRef} type="file" accept=".pptx" style={{ display: "none" }} onChange={(e) => { ingestTemplate(e.target.files[0]); e.target.value = ""; }} />
        </div>
      )}

      {status && (
        <div style={{ marginTop: "14px", marginBottom: hasTemplate ? "16px" : 0, fontSize: "13px", fontWeight: 600, padding: "10px 14px", borderRadius: "10px", color: status.type === "error" ? theme.danger : status.type === "success" ? theme.positive : theme.textMuted, background: status.type === "error" ? theme.dangerSoft : theme.accentSoft }}>
          {status.message}
        </div>
      )}

      {hasTemplate && (
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: "7px", fontSize: "13px", fontWeight: 700, color: theme.text }}>
              <IconDeck size={14} /> {deck.name}
            </span>
            <span style={{ fontSize: "12px", color: theme.textFaint }}>{deck.tokens.length} field{deck.tokens.length === 1 ? "" : "s"}</span>
          </div>

          {deck.tokens.length === 0 ? (
            <div style={{ fontSize: "13px", color: theme.textFaint, lineHeight: 1.5 }}>
              This deck has no <code style={{ fontFamily: "ui-monospace,Menlo,monospace" }}>{"{{placeholders}}"}</code> yet. Add tokens like{" "}
              <code style={{ fontFamily: "ui-monospace,Menlo,monospace" }}>{"{{critical}}"}</code> where the numbers go, save, then use <strong style={{ color: theme.textMuted }}>Replace template</strong> to re-upload.
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(min(220px, 100%), 1fr))", gap: "12px" }}>
              {deck.tokens.map((t) => (
                <div key={t}>
                  <label style={{ display: "block", fontSize: "11px", fontWeight: 700, letterSpacing: "0.03em", color: theme.textMuted, marginBottom: "5px", fontFamily: "ui-monospace,SFMono-Regular,Menlo,monospace" }}>
                    {"{{"}{t}{"}}"}
                  </label>
                  <input
                    value={(deck.values && deck.values[t]) || ""}
                    onChange={(e) => setValue(t, e.target.value)}
                    placeholder="value…"
                    className="v-input"
                    style={{ width: "100%", padding: "9px 11px", borderRadius: "9px", fontSize: "13px", background: theme.inputBg, color: theme.inputText, border: `1px solid ${theme.inputBorder}`, "--focus-ring": theme.accentSoft, "--focus-border": theme.accent }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </MoModal>
  );
}


/* ----------------------------------------------------------------------
   SECURITYX — CompTIA SecurityX (CAS-005) study tool
   Thin iframe wrapper around securityx.html (a separate self-contained
   file, also pulled in from claude/site-review-t0e6yk) that re-skins the
   embedded page's CSS variables to match Vantage's active theme.
---------------------------------------------------------------------- */

function secxThemeCSS(theme) {
  const sysFont = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';
  const bodyBg = theme.pageBgGradient && theme.pageBgGradient !== "none" ? theme.pageBgGradient : theme.pageBg;
  return `
  :root{
    --ink:${theme.pageBg}!important;
    --s1:${theme.cardBg}!important; --s2:${theme.cardBg}!important; --s3:${theme.accentSoft}!important;
    --glass:${theme.cardBg}!important; --glass-hi:${theme.cardBg}!important;
    --blur:none!important;
    --line:${theme.divider}!important; --line2:${theme.cardBorder}!important; --line3:${theme.cardBorder}!important;
    --fg:${theme.text}!important; --fg2:${theme.textMuted}!important; --fg3:${theme.textMuted}!important; --fg4:${theme.textFaint}!important;
    --ok:${theme.positive}!important; --no:${theme.danger}!important;
    --gold:${theme.accent}!important; --gold-dim:${theme.accentSoft}!important; --gold-line:${theme.divider}!important;
    --ac:${theme.accent}!important; --ac-dim:${theme.accentSoft}!important; --ac-line:${theme.divider}!important;
    --sans:${sysFont}!important;
    --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace!important;
    --e1:${theme.cardShadow}!important; --e2:${theme.cardShadow}!important; --e3:${theme.cardShadow}!important;
  }
  body{ background:${bodyBg}!important; color:${theme.text}!important; }
  body::before{ background:none!important; }
  ::selection{ background:${theme.accentSoft}!important; color:${theme.text}!important; }
  /* The primary button hardcodes a gold gradient + dark text; flatten it to
     the theme accent so it reads correctly on light or dark themes. */
  .btn.pri, .btn.pri:hover{ background:${theme.accent}!important; color:${theme.accentText}!important; border-color:${theme.accent}!important; box-shadow:${theme.cardShadow}!important; filter:none!important; }
  `;
}

function SecurityXSection({ theme }) {
  const frameRef = useRef(null);
  const css = useMemo(() => secxThemeCSS(theme), [theme]);

  function applySkin() {
    const frame = frameRef.current;
    if (!frame) return;
    try {
      const doc = frame.contentDocument;
      if (!doc || !doc.head) return;
      let el = doc.getElementById("vantage-skin");
      if (!el) {
        el = doc.createElement("style");
        el.id = "vantage-skin";
        doc.head.appendChild(el);
      }
      el.textContent = css;
    } catch (e) {
      /* frame not ready yet — onLoad will re-apply */
    }
  }

  // Re-skin whenever the Vantage theme changes (frame stays mounted). A large
  // srcdoc/src document can finish loading after onLoad timing is missed, so
  // poll briefly until the injection lands (applySkin is idempotent).
  useEffect(() => {
    applySkin();
    const id = setInterval(applySkin, 250);
    const stop = setTimeout(() => clearInterval(id), 5000);
    return () => { clearInterval(id); clearTimeout(stop); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [css]);

  return (
    <div className="v-fullshell" style={{ display: "flex", flexDirection: "column" }}>
      <iframe
        ref={frameRef}
        onLoad={applySkin}
        title="SecurityX Readiness — CompTIA CAS-005 study tool"
        src="securityx.html"
        style={{ flex: 1, width: "100%", border: "none", display: "block", background: theme.pageBg }}
      />
    </div>
  );
}


window.__vChunks = window.__vChunks || {};
window.__vChunks.mechanicalorchard = {
  VulnerabilityAnalyzerModal, PkiReportModal, PolicyTrackerModal, DeckBuilderModal,
  AppNoticeModal, DailyLogModal, KevLookupModal, VulnTrendModal, SecurityToolkitModal,
  PhishHeaderModal, CveWatchlistModal, PasswordBreachModal, SecurityXSection,
};
