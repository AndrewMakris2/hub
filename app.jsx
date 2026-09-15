
const { useState, useEffect, useRef } = React;

/* ----------------------------------------------------------------------
   THEME
   BearVantageHub used to offer 28 selectable themes across ~30 pages.
   This build keeps exactly one page (the video library), so it's hardcoded
   to what used to be the app's default theme ("Minimal") rather than
   carrying the whole picker/catalog for a choice nobody can make anymore.
---------------------------------------------------------------------- */
const THEME = {
  name: "Minimal",
  pageBg: "#fafaf8",
  pageBgGradient: "none",
  text: "#1a1a1a",
  textMuted: "#71716f",
  textFaint: "#757572",
  cardBg: "#ffffff",
  cardBorder: "#e8e8e4",
  cardShadow: "0 1px 2px rgba(0,0,0,0.04)",
  cardRadius: "14px",
  sectionLabelColor: "#70706c",
  accent: "#1a1a1a",
  accentText: "#ffffff",
  accentOn: "#1a1a1a",
  accentSoft: "#f0f0ec",
  divider: "#eeeeea",
  inputBg: "#ffffff",
  inputBorder: "#dcdcd6",
  inputText: "#1a1a1a",
  danger: "#c0392b",
  dangerSoft: "#fbeceb",
  chip: "#f2f2ee",
  chipText: "#5a5a56",
  themeBarBg: "rgba(255,255,255,0.7)",
  themeBarBorder: "#e8e8e4",
  positive: "#2f6b3f",
  progressTrack: "#eeeeea",
  progressFill: "#1a1a1a",
  headerWeight: 700,
  cardStyle: "flat",
};

// Light text means the theme paints a dark UI. Falls back to the page
// background when `text` isn't a plain hex, then to "dark".
function vLuminance(hex) {
  if (typeof hex !== "string" || hex[0] !== "#") return null;
  const h = hex.length === 4
    ? hex.slice(1).split("").map((c) => c + c).join("")
    : hex.slice(1);
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16), g = parseInt(h.slice(2, 4), 16), b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some(Number.isNaN)) return null;
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}
function isDarkTheme(theme) {
  const t = vLuminance(theme && theme.text);
  if (t != null) return t > 0.5;
  const bg = vLuminance(theme && theme.pageBg);
  if (bg != null) return bg < 0.5;
  return true;
}
const THEME_VAR_MAP = {
  "--v-page-bg": "pageBg",
  "--v-text": "text",
  "--v-text-muted": "textMuted",
  "--v-text-faint": "textFaint",
  "--v-card-border": "cardBorder",
  "--v-card-shadow": "cardShadow",
  "--v-card-radius": "cardRadius",
  "--v-section-label": "sectionLabelColor",
  "--v-accent": "accent",
  "--v-accent-text": "accentText",
  "--v-accent-soft": "accentSoft",
  "--v-accent-on": "accentOn",
  "--v-divider": "divider",
  "--v-input-bg": "inputBg",
  "--v-input-border": "inputBorder",
  "--v-input-text": "inputText",
  "--v-danger": "danger",
  "--v-danger-soft": "dangerSoft",
  "--v-chip": "chip",
  "--v-chip-text": "chipText",
  "--v-positive": "positive",
  "--v-progress-track": "progressTrack",
  "--v-progress-fill": "progressFill",
  "--v-rail-bg": "themeBarBg",
  "--v-rail-border": "themeBarBorder",
};
// Bricolage Grotesque is the site-wide --v-font-display (headline-scale
// moments only — see index.shell.html). Loading it as a real file (fetched
// on first paint) instead of embedding it as a base64 @font-face in the
// static shell CSS keeps it off the critical-path payload; font-display:
// swap means the system font shows first and swaps in once it lands.
let __displayFontInjected = false;
function ensureDisplayFont() {
  if (__displayFontInjected || typeof document === "undefined") return;
  __displayFontInjected = true;
  const style = document.createElement("style");
  style.textContent = '@font-face{font-family:"Bricolage Grotesque";font-weight:700;font-style:normal;font-display:swap;src:url("bricolage-grotesque-700.woff2") format("woff2");}';
  document.head.appendChild(style);
}
function applyThemeVars(theme) {
  if (typeof document === "undefined" || !theme) return;
  const root = document.documentElement;
  Object.keys(THEME_VAR_MAP).forEach((cssVar) => {
    const val = theme[THEME_VAR_MAP[cssVar]];
    if (val != null) root.style.setProperty(cssVar, String(val));
  });
  root.setAttribute("data-scheme", isDarkTheme(theme) ? "dark" : "light");
  ensureDisplayFont();
}

/* ----------------------------------------------------------------------
   Local storage helpers
---------------------------------------------------------------------- */
const STORAGE_KEY_AUTOPOST_LAST_SEEN = "dash.autopostLastSeen";

function isMergeablePlainObject(v) {
  return v !== null && typeof v === "object" && !Array.isArray(v);
}
function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed == null) return fallback;
    if (isMergeablePlainObject(fallback) && isMergeablePlainObject(parsed)) {
      return { ...fallback, ...parsed };
    }
    return parsed;
  } catch (e) {
    return fallback;
  }
}
// A failed write used to be silently swallowed — the UI looked saved, but
// nothing was there on reload. Surfaced now via a rate-limited toast (quota
// exceeded or a private-browsing mode that blocks storage would otherwise
// fail on nearly every keystroke, and a toast per keystroke is its own bug).
let __lastStorageFailureToast = 0;
function saveJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    const now = Date.now();
    if (now - __lastStorageFailureToast > 15000) {
      __lastStorageFailureToast = now;
      toast.error("Couldn't save your last change — storage is full or unavailable.");
    }
  }
}

/* ----------------------------------------------------------------------
   Toasts.
   A module-level pub-sub rather than React context: any function anywhere
   in this file can call toast.success(...) without threading a provider.
   The host subscribes once and portals to <body>.
---------------------------------------------------------------------- */
const __toastListeners = new Set();
let __toastItems = [];
let __toastSeq = 0;

function __toastEmit() {
  const snapshot = __toastItems.slice();
  __toastListeners.forEach((fn) => fn(snapshot));
}
function dismissToast(id) {
  __toastItems = __toastItems.filter((t) => t.id !== id);
  __toastEmit();
}
function showToast(opts) {
  const o = typeof opts === "string" ? { message: opts } : opts || {};
  const id = "t" + ++__toastSeq;
  const item = {
    id,
    kind: o.kind || "info",
    title: o.title || "",
    message: o.message || "",
    action: o.action || null,
    duration: o.duration == null ? (o.kind === "error" ? 7000 : 4500) : o.duration,
  };
  __toastItems = [item, ...__toastItems].slice(0, 4);
  __toastEmit();
  if (item.duration > 0) setTimeout(() => dismissToast(id), item.duration);
  return id;
}
const toast = {
  show: showToast,
  info: (m, o) => showToast({ ...(o || {}), message: m, kind: "info" }),
  success: (m, o) => showToast({ ...(o || {}), message: m, kind: "success" }),
  error: (m, o) => showToast({ ...(o || {}), message: m, kind: "error" }),
  warn: (m, o) => showToast({ ...(o || {}), message: m, kind: "warn" }),
  dismiss: dismissToast,
};

function ToastIcon({ kind, size = 16 }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2.2, strokeLinecap: "round", strokeLinejoin: "round" };
  if (kind === "success") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8.5 12.5l2.5 2.5 4.5-5" /></svg>;
  if (kind === "error") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5v.01" /></svg>;
  if (kind === "warn") return <svg {...common}><path d="M12 4l9 16H3z" /><path d="M12 10v4M12 17v.01" /></svg>;
  return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M12 11v5.5M12 7.5v.01" /></svg>;
}
function ToastHost({ theme }) {
  const [items, setItems] = useState(__toastItems);
  useEffect(() => {
    __toastListeners.add(setItems);
    return () => { __toastListeners.delete(setItems); };
  }, []);
  if (typeof document === "undefined") return null;

  const tone = (kind) => {
    if (kind === "success") return theme.positive;
    if (kind === "error") return theme.danger;
    if (kind === "warn") return "#f59e0b";
    return theme.accent;
  };

  return ReactDOM.createPortal(
    <div className="v-toasts" role="region" aria-label="Notifications">
      {items.map((t) => (
        <div
          key={t.id}
          className="v-toast"
          role={t.kind === "error" ? "alert" : "status"}
          aria-live={t.kind === "error" ? "assertive" : "polite"}
          style={{ ...cardBackgroundStyle(theme), "--toast-tone": tone(t.kind) }}
        >
          <span className="v-toast__bar" />
          <span className="v-toast__icon" style={{ color: tone(t.kind) }}>
            <ToastIcon kind={t.kind} />
          </span>
          <span className="v-toast__body">
            {t.title && <span className="v-toast__title" style={{ color: theme.text }}>{t.title}</span>}
            <span className="v-toast__msg" style={{ color: t.title ? theme.textMuted : theme.text }}>{t.message}</span>
          </span>
          {t.action && (
            <button
              className="v-btn v-toast__action"
              onClick={() => { try { t.action.onClick(); } finally { dismissToast(t.id); } }}
              style={{ color: tone(t.kind), background: theme.accentSoft }}
            >
              {t.action.label}
            </button>
          )}
          <button
            className="v-btn v-iconbtn v-toast__close"
            onClick={() => dismissToast(t.id)}
            aria-label="Dismiss notification"
            style={{ color: theme.textMuted }}
          >
            <IconClose size={14} />
          </button>
        </div>
      ))}
    </div>,
    document.body
  );
}

/* ----------------------------------------------------------------------
   Shared UI primitives
---------------------------------------------------------------------- */
function cardBackgroundStyle(theme) {
  const style = {
    border: "1px solid var(--v-edge)",
    borderRadius: "var(--r-card)",
    boxShadow: "var(--sh-card)",
  };
  if (theme.cardStyle === "gradient") {
    style.backgroundImage = theme.cardBg;
    style.backgroundColor = "rgba(255,255,255,0.03)";
  } else {
    style.background = theme.cardBg;
  }
  if (theme.blur) {
    style.backdropFilter = "blur(18px)";
    style.WebkitBackdropFilter = "blur(18px)";
  }
  return style;
}
function SectionLabel({ theme, icon, children, style }) {
  return (
    <div
      className="v-sectionlabel"
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        fontSize: "11px",
        fontWeight: 700,
        letterSpacing: "0.07em",
        textTransform: "uppercase",
        color: theme.sectionLabelColor,
        marginBottom: "12px",
        ...style,
      }}
    >
      {icon && <span style={{ display: "inline-flex" }}>{icon}</span>}
      <span>{children}</span>
    </div>
  );
}
// options: [{ id, label }] or [[id, label], ...] — both shapes exist in the
// call sites this replaced, so both are accepted rather than rewritten.
function Segmented({ theme, value, onChange, options, ariaLabel, size, style }) {
  const items = (options || []).map((o) => (Array.isArray(o) ? { id: o[0], label: o[1] } : o));
  return (
    <div
      className={"v-segmented" + (size === "sm" ? " v-segmented--sm" : "")}
      role="tablist"
      aria-label={ariaLabel}
      style={{ background: theme.chip, borderColor: "var(--v-edge)", ...style }}
    >
      {items.map((o) => {
        const on = o.id === value;
        return (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(o.id)}
            className={"v-btn v-segmented__seg" + (on ? " is-on" : "")}
            style={on
              ? { background: theme.cardBg, color: theme.text }
              : { background: "transparent", color: theme.textMuted }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
function Card({ theme, children, style, delay = 0 }) {
  return (
    <div
      className="v-card"
      style={{
        ...cardBackgroundStyle(theme),
        padding: "var(--pad-card)",
        animationDelay: `${delay}ms`,
        display: "flex",
        flexDirection: "column",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* ----------------------------------------------------------------------
   Icons
---------------------------------------------------------------------- */
function IconClose({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function IconVideo({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="14" height="14" rx="2" />
      <path d="M16 9l6-3v12l-6-3" />
    </svg>
  );
}
function IconShare({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M4 13v6a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-6" />
    </svg>
  );
}
function IconUpload({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4M7 9l5-5 5 5" />
      <path d="M4 16v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3" />
    </svg>
  );
}
function IconYoutube({ size = 14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="5" width="20" height="14" rx="4" />
      <path d="M10 9l6 3-6 3V9z" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ----------------------------------------------------------------------
   File / formatting helpers
---------------------------------------------------------------------- */
function formatBytes(bytes) {
  if (!bytes) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}
function extFromType(type) {
  if (!type) return "mp4";
  const parts = type.split("/");
  return parts[1] ? parts[1].split(";")[0] : "mp4";
}
// Hands a video off via the OS's own share sheet — it lists every app on the
// device that accepts a shared video file, not just one, so "appName" is
// purely the button's own framing/status copy, not something that actually
// filters which app the share sheet offers.
async function shareVideoFile(video, onStatus, appName = "TikTok") {
  const file = new File([video.blob], `${video.title || "video"}.${extFromType(video.type)}`, { type: video.type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: video.title || "video" });
      onStatus({ type: "success", message: `Shared — finish posting inside ${appName}.` });
    } catch (err) {
      if (err && err.name !== "AbortError") {
        onStatus({ type: "error", message: "Share was cancelled or failed." });
      }
    }
    return;
  }
  const url = URL.createObjectURL(video.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  onStatus({ type: "success", message: `Native share isn't available here — downloaded instead. Upload it in ${appName}.` });
}

/* ----------------------------------------------------------------------
   VIDEO LIBRARY STORAGE
   Video files are stored in IndexedDB (localStorage caps out around
   5-10MB, nowhere near enough for video). Lives in this browser only —
   not backed up, not synced.
---------------------------------------------------------------------- */
const VIDEO_DB_NAME = "vantage-videos";
const VIDEO_STORE = "videos";

function openVideoDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error("This browser doesn't support local video storage."));
      return;
    }
    const req = indexedDB.open(VIDEO_DB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(VIDEO_STORE)) {
        db.createObjectStore(VIDEO_STORE, { keyPath: "id" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function dbPutVideo(record) {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, "readwrite");
    tx.objectStore(VIDEO_STORE).put(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}
async function dbGetAllVideos() {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, "readonly");
    const req = tx.objectStore(VIDEO_STORE).getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}
async function dbDeleteVideo(id) {
  const db = await openVideoDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(VIDEO_STORE, "readwrite");
    tx.objectStore(VIDEO_STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

/* ----------------------------------------------------------------------
   Autopost pool / YouTube upload backend
   The scheduled, unattended YouTube auto-poster: videos added to this pool
   live server-side (Netlify Blobs — see netlify/functions/_lib/videoPool.js)
   so a scheduled job with no browser open can pick one at random and post
   it. The site is served from two origins (GitHub Pages + Netlify), and
   only the Netlify one runs Functions, hence the absolute backend URL.
---------------------------------------------------------------------- */
const AUTOPOST_BACKEND_URL = "https://bearvantagehub.netlify.app";
// ~2MB raw chunks base64-inflate to ~2.7MB, safely under Netlify Functions'
// ~4.5MB effective binary body cap.
const AUTOPOST_CHUNK_BYTES = 2 * 1024 * 1024;

function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] || "");
    reader.onerror = () => reject(reader.error || new Error("Couldn't read file."));
    reader.readAsDataURL(blob);
  });
}
async function addVideoToAutopostPool(video, onProgress) {
  const chunkCount = Math.max(1, Math.ceil(video.size / AUTOPOST_CHUNK_BYTES));
  for (let i = 0; i < chunkCount; i++) {
    const slice = video.blob.slice(i * AUTOPOST_CHUNK_BYTES, (i + 1) * AUTOPOST_CHUNK_BYTES);
    const dataBase64 = await blobToBase64(slice);
    const res = await fetch(`${AUTOPOST_BACKEND_URL}/.netlify/functions/autopost-upload-chunk`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId: video.id, chunkIndex: i, chunkCount, title: video.title, type: video.type, size: video.size, dataBase64 }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error((data && data.error) || `Upload failed (${res.status}).`);
    }
    if (onProgress) onProgress(i + 1, chunkCount);
  }
}
function removeVideoFromAutopostPool(id) {
  return fetch(`${AUTOPOST_BACKEND_URL}/.netlify/functions/autopost-pool`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action: "remove", id }),
  });
}
// Uploads a locally-stored video straight to YouTube — a hand-built
// multipart/related body (metadata JSON part + the raw video blob part),
// same "simple/multipart upload" method YouTube's own API docs describe.
// No resumable-upload chunking: these are short clips, not the multi-hour
// footage that protocol exists for.
async function uploadVideoToYouTube(video, meta, accessToken) {
  const boundary = "vantage" + Date.now().toString(36);
  const metadata = {
    snippet: { title: meta.title || "Untitled", description: meta.description || "" },
    status: { privacyStatus: meta.privacyStatus || "private" },
  };
  const head =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    `Content-Type: ${video.type || "video/mp4"}\r\n\r\n`;
  const tail = `\r\n--${boundary}--`;
  const body = new Blob([head, video.blob, tail]);

  const res = await fetch(
    "https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    }
  );
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error && data.error.message) || `YouTube upload failed (${res.status}).`);
  }
  return data;
}

// Google OAuth Client IDs are meant to be public/embedded client-side —
// only the Client *Secret* is sensitive, and that already lives server-side
// in the Netlify Functions (untouched by this rebuild). Paste your existing
// Client ID here (same one Calendar/YouTube subscriptions used) to enable
// "Post to YouTube". Until then, that flow just shows its one-time-setup
// message below, same as a fresh install would.
const GOOGLE_CLIENT_ID = "150681444713-10darm14jipq4v3l46d0pvadjgrd3ook.apps.googleusercontent.com";

function PostToYouTubeModal({ theme, video, onClose }) {
  const [title, setTitle] = useState(video.title || "");
  const [description, setDescription] = useState("");
  const [privacy, setPrivacy] = useState("private");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  // YouTube decides Shorts vs. regular video itself — there's no API field
  // for it. This just reads the file's own dimensions/duration client-side
  // so the user sees, before posting, which way YouTube's own rule (vertical
  // or square, 3 minutes or under) will land it.
  const [format, setFormat] = useState(null);

  useEffect(() => {
    const el = document.createElement("video");
    el.preload = "metadata";
    el.src = video.url;
    function onLoaded() {
      const w = el.videoWidth, h = el.videoHeight, d = el.duration;
      if (!w || !h || !isFinite(d)) { setFormat("error"); return; }
      setFormat({ width: w, height: h, duration: d, isShort: h >= w && d <= 180 });
    }
    el.addEventListener("loadedmetadata", onLoaded);
    el.addEventListener("error", () => setFormat("error"));
    return () => el.removeAttribute("src");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [video.url]);

  const clientId = GOOGLE_CLIENT_ID.trim();

  function post() {
    if (!window.google || !window.google.accounts || !window.google.accounts.oauth2) {
      setResult({ type: "error", message: "Google's sign-in script hasn't loaded yet — try again in a moment." });
      return;
    }
    setBusy(true);
    setResult(null);
    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: "https://www.googleapis.com/auth/youtube.upload",
        callback: async (resp) => {
          if (resp.error) {
            setBusy(false);
            setResult({ type: "error", message: `Google sign-in failed: ${resp.error}` });
            return;
          }
          try {
            const data = await uploadVideoToYouTube(video, { title, description, privacyStatus: privacy }, resp.access_token);
            setResult({ type: "success", videoId: data.id });
          } catch (err) {
            setResult({ type: "error", message: err.message || "Upload failed." });
          } finally {
            setBusy(false);
          }
        },
      });
      tokenClient.requestAccessToken();
    } catch (err) {
      setBusy(false);
      setResult({ type: "error", message: err.message || "Couldn't start Google sign-in." });
    }
  }

  const inputStyle = {
    width: "100%",
    background: theme.inputBg,
    border: `1px solid ${theme.inputBorder}`,
    borderRadius: "8px",
    color: theme.inputText,
    padding: "9px 12px",
    fontSize: "13.5px",
    "--focus-ring": theme.accentSoft,
    "--focus-border": theme.accent,
  };

  return ReactDOM.createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Post to YouTube"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(0,0,0,0.5)" }}
    >
      <div style={{ ...cardBackgroundStyle(theme), padding: "24px", width: "100%", maxWidth: "440px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <IconYoutube size={18} />
            <div style={{ fontSize: "16px", fontWeight: 800, color: theme.text }}>Post to YouTube</div>
          </div>
          <button onClick={onClose} title="Close" className="v-btn v-iconbtn" style={{ border: "none", background: "transparent", color: theme.textMuted, padding: "4px" }}>
            <IconClose size={16} />
          </button>
        </div>

        {!clientId ? (
          <div style={{ fontSize: "13px", color: theme.textMuted, lineHeight: 1.6 }}>
            <div style={{ marginBottom: "10px" }}>
              Needs a one-time setup: paste a Google OAuth Client ID into the
              <code> GOOGLE_CLIENT_ID</code> constant near the top of app.jsx.
            </div>
            <ol style={{ margin: "0 0 4px", paddingLeft: "20px" }}>
              <li>Enable <strong>YouTube Data API v3</strong> on that Google Cloud project.</li>
              <li>OAuth consent screen → Data Access → add scope <code>youtube.upload</code>.</li>
              <li>OAuth consent screen → Audience → Test users → add your Google account.</li>
            </ol>
          </div>
        ) : result && result.type === "success" ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <div style={{ color: theme.positive, fontSize: "14px", fontWeight: 700, marginBottom: "12px" }}>
              Uploaded — set to {privacy}.
            </div>
            <a
              href={`https://youtube.com/watch?v=${result.videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="v-btn"
              style={{ display: "inline-block", background: theme.accent, color: theme.accentText, border: "none", borderRadius: "8px", padding: "9px 16px", fontSize: "13px", fontWeight: 700, textDecoration: "none" }}
            >
              Watch on YouTube →
            </a>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div>
              <div style={{ fontSize: "11.5px", fontWeight: 700, color: theme.textMuted, marginBottom: "4px" }}>Title</div>
              <input value={title} onChange={(e) => setTitle(e.target.value)} className="v-input" style={inputStyle} />
            </div>
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  fontSize: "12.5px",
                  padding: "9px 12px",
                  borderRadius: "8px",
                  background: theme.chip,
                  color: theme.chipText,
                }}
              >
                {format === null ? (
                  "Checking format…"
                ) : format === "error" ? (
                  "Couldn't read this video's format — YouTube will classify it after upload."
                ) : (
                  <>
                    <strong style={{ color: theme.text }}>{format.isShort ? "Will post as a Short" : "Will post as a regular video"}</strong>
                    <span>
                      · {Math.floor(format.duration / 60)}:{String(Math.round(format.duration % 60)).padStart(2, "0")} · {format.width}×{format.height}
                    </span>
                  </>
                )}
              </div>
              <div style={{ fontSize: "10.5px", color: theme.textFaint, marginTop: "5px", lineHeight: 1.4 }}>
                YouTube makes this call itself — vertical or square, 3 minutes or under, becomes a Short. Vantage can't override it; crop or trim the file first for a different result.
              </div>
            </div>
            <div>
              <div style={{ fontSize: "11.5px", fontWeight: 700, color: theme.textMuted, marginBottom: "4px" }}>Description</div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="What's this video about?"
                aria-label="Description"
                className="v-input"
                style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit" }}
              />
            </div>
            <div>
              <div style={{ fontSize: "11.5px", fontWeight: 700, color: theme.textMuted, marginBottom: "6px" }}>Privacy</div>
              <Segmented
                theme={theme}
                value={privacy}
                onChange={setPrivacy}
                options={[{ id: "private", label: "Private" }, { id: "unlisted", label: "Unlisted" }, { id: "public", label: "Public" }]}
                ariaLabel="Privacy"
              />
            </div>
            {result && result.type === "error" && (
              <div style={{ fontSize: "12.5px", color: theme.danger, background: theme.dangerSoft, borderRadius: "8px", padding: "9px 12px" }}>
                {result.message}
              </div>
            )}
            <button
              onClick={post}
              disabled={busy || !title.trim()}
              className="v-btn"
              style={{ background: theme.accent, color: theme.accentText, border: "none", borderRadius: "8px", padding: "10px 14px", fontSize: "13.5px", fontWeight: 700, opacity: busy || !title.trim() ? 0.6 : 1 }}
            >
              {busy ? "Uploading…" : "Post to YouTube"}
            </button>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

/* ----------------------------------------------------------------------
   Autopost status banner (moved here from the old Home dashboard — it's
   entirely self-contained and is literally about this surviving feature).
---------------------------------------------------------------------- */
const AUTOPOST_LOW_POOL_THRESHOLD = 1;

function relTimeFrom(iso) {
  try {
    const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 60) return mins + "m ago";
    const hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + "h ago";
    return Math.round(hrs / 24) + "d ago";
  } catch (e) { return ""; }
}
function AutopostAlertRow({ theme, tone, onDismiss, children }) {
  const palette =
    tone === "error"
      ? { background: theme.dangerSoft, color: theme.danger }
      : tone === "warn"
      ? { background: theme.chip, color: theme.chipText }
      : { background: theme.accentSoft, color: theme.text };
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "11px 14px", borderRadius: "12px", fontSize: "13px", marginBottom: "14px", ...palette }}>
      <IconYoutube size={16} />
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
      <button
        onClick={onDismiss}
        className="v-btn v-iconbtn"
        title="Dismiss"
        style={{ border: "none", background: "transparent", color: "inherit", padding: "4px", flexShrink: 0, opacity: 0.7 }}
      >
        <IconClose size={14} />
      </button>
    </div>
  );
}
function AutopostAlert({ theme }) {
  const [entry, setEntry] = useState(null);
  const [poolCount, setPoolCount] = useState(null);
  const [paused, setPaused] = useState(false);
  const [lastSeen, setLastSeen] = useState(() => loadJSON(STORAGE_KEY_AUTOPOST_LAST_SEEN, 0));
  // Not persisted on purpose — an empty pool is an ongoing fact, not a
  // one-time event, so it's meant to resurface on the next visit if it's
  // still true. This just quiets it for the rest of the current visit.
  const [lowPoolDismissed, setLowPoolDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`${AUTOPOST_BACKEND_URL}/.netlify/functions/autopost-pool`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const latest = (data.history || [])[0];
        if (latest) setEntry(latest);
        setPoolCount((data.videos || []).length);
        setPaused(!!data.paused);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const showPost = entry && entry.postedAt > lastSeen;
  const showLowPool = !paused && poolCount !== null && poolCount <= AUTOPOST_LOW_POOL_THRESHOLD && !lowPoolDismissed;
  if (!showPost && !showLowPool) return null;

  function dismissPost() {
    saveJSON(STORAGE_KEY_AUTOPOST_LAST_SEEN, entry.postedAt);
    setLastSeen(entry.postedAt);
  }

  return (
    <div>
      {showPost &&
        (entry.status === "error" ? (
          <AutopostAlertRow theme={theme} tone="error" onDismiss={dismissPost}>
            Scheduled auto-post failed: {entry.message || "unknown error"}
            <span style={{ color: theme.textFaint, marginLeft: "8px" }}>{relTimeFrom(entry.postedAt)}</span>
          </AutopostAlertRow>
        ) : (
          <AutopostAlertRow theme={theme} tone="success" onDismiss={dismissPost}>
            Auto-posted <strong>&ldquo;{entry.title}&rdquo;</strong> to YouTube —{" "}
            <a
              href={`https://youtube.com/watch?v=${entry.youtubeVideoId}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: theme.accent, fontWeight: 700, textDecoration: "none" }}
            >
              Watch it →
            </a>
            <span style={{ color: theme.textFaint, marginLeft: "8px" }}>{relTimeFrom(entry.postedAt)}</span>
          </AutopostAlertRow>
        ))}
      {showLowPool && (
        <AutopostAlertRow theme={theme} tone="warn" onDismiss={() => setLowPoolDismissed(true)}>
          {poolCount === 0 ? "Auto-post pool is empty" : "Only 1 video left in the auto-post pool"} — add more below or it'll skip a day.
        </AutopostAlertRow>
      )}
    </div>
  );
}

/* ----------------------------------------------------------------------
   THE VIDEOS PAGE — the entire app.
---------------------------------------------------------------------- */
function VideoLibrarySection({ theme }) {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [statusById, setStatusById] = useState({});
  const [storageEstimate, setStorageEstimate] = useState(null);
  const [storageSupported, setStorageSupported] = useState(true);
  const [postingVideo, setPostingVideo] = useState(null);
  const [poolIds, setPoolIds] = useState(new Set());
  const [poolBusyById, setPoolBusyById] = useState({});
  const [paused, setPaused] = useState(false);
  const [pauseBusy, setPauseBusy] = useState(false);
  const fileInputRef = useRef(null);

  function refreshStorageEstimate() {
    if (!navigator.storage || !navigator.storage.estimate) {
      setStorageSupported(false);
      return;
    }
    navigator.storage
      .estimate()
      .then((est) => setStorageEstimate({ usage: est.usage || 0, quota: est.quota || 0 }))
      .catch(() => setStorageSupported(false));
  }

  useEffect(() => {
    let cancelled = false;
    dbGetAllVideos()
      .then((records) => {
        if (cancelled) return;
        const withUrls = records
          .sort((a, b) => b.createdAt - a.createdAt)
          .map((r) => ({ ...r, url: URL.createObjectURL(r.blob) }));
        setVideos(withUrls);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setDbError(err.message || "Couldn't open local video storage.");
        setLoading(false);
      });
    refreshStorageEstimate();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    return () => {
      videos.forEach((v) => URL.revokeObjectURL(v.url));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch(`${AUTOPOST_BACKEND_URL}/.netlify/functions/autopost-pool`)
      .then((res) => (res.ok ? res.json() : { videos: [] }))
      .then((data) => {
        if (cancelled) return;
        setPoolIds(new Set((data.videos || []).map((v) => v.id)));
        setPaused(!!data.paused);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  async function togglePause() {
    setPauseBusy(true);
    try {
      const res = await fetch(`${AUTOPOST_BACKEND_URL}/.netlify/functions/autopost-pool`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: paused ? "resume" : "pause" }),
      });
      if (!res.ok) throw new Error("request failed");
      setPaused((prev) => !prev);
    } catch {
      toast.error("Couldn't update the auto-poster's pause state — try again.");
    } finally {
      setPauseBusy(false);
    }
  }

  async function togglePool(video) {
    if (poolIds.has(video.id)) {
      setPoolBusyById((prev) => ({ ...prev, [video.id]: "removing" }));
      try {
        await removeVideoFromAutopostPool(video.id);
        setPoolIds((prev) => {
          const next = new Set(prev);
          next.delete(video.id);
          return next;
        });
      } catch {
        setStatus(video.id, { type: "error", message: "Couldn't remove from the auto-post pool." });
      } finally {
        setPoolBusyById((prev) => ({ ...prev, [video.id]: null }));
      }
      return;
    }
    setPoolBusyById((prev) => ({ ...prev, [video.id]: { sent: 0, total: 1 } }));
    try {
      await addVideoToAutopostPool(video, (sent, total) => setPoolBusyById((prev) => ({ ...prev, [video.id]: { sent, total } })));
      setPoolIds((prev) => new Set(prev).add(video.id));
    } catch (err) {
      setStatus(video.id, { type: "error", message: err.message || "Couldn't add to the auto-post pool." });
    } finally {
      setPoolBusyById((prev) => ({ ...prev, [video.id]: null }));
    }
  }

  function setStatus(id, status) {
    setStatusById((prev) => ({ ...prev, [id]: status }));
    if (status) {
      setTimeout(() => setStatusById((prev) => ({ ...prev, [id]: null })), 5000);
    }
  }

  async function handleFileChange(e) {
    const file = e.target.files && e.target.files[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const id = "v" + Date.now() + Math.random().toString(36).slice(2, 6);
      const record = { id, title: file.name.replace(/\.[^.]+$/, ""), type: file.type, size: file.size, createdAt: Date.now(), blob: file };
      await dbPutVideo(record);
      setVideos((prev) => [{ ...record, url: URL.createObjectURL(file) }, ...prev]);
      refreshStorageEstimate();
    } catch (err) {
      setDbError(err.message || "Couldn't save that video.");
    } finally {
      setUploading(false);
    }
  }

  async function renameVideo(id, title) {
    setVideos((prev) => prev.map((v) => (v.id === id ? { ...v, title } : v)));
    const video = videos.find((v) => v.id === id);
    if (video) {
      await dbPutVideo({ id: video.id, title, type: video.type, size: video.size, createdAt: video.createdAt, blob: video.blob });
    }
  }

  async function deleteVideo(id) {
    const video = videos.find((v) => v.id === id);
    if (video) URL.revokeObjectURL(video.url);
    setVideos((prev) => prev.filter((v) => v.id !== id));
    await dbDeleteVideo(id);
    refreshStorageEstimate();
    // Deleting locally shouldn't leave a copy sitting in the server-side
    // pool waiting to be auto-posted as a surprise later.
    if (poolIds.has(id)) {
      removeVideoFromAutopostPool(id).catch(() => {});
      setPoolIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }

  const totalVideoBytes = videos.reduce((s, v) => s + (v.size || 0), 0);
  const avgVideoBytes = videos.length > 0 ? totalVideoBytes / videos.length : 75 * 1024 * 1024;
  const usagePct = storageEstimate && storageEstimate.quota ? Math.min(100, Math.round((storageEstimate.usage / storageEstimate.quota) * 100)) : null;
  const remainingBytes = storageEstimate ? Math.max(0, storageEstimate.quota - storageEstimate.usage) : null;
  const estRemainingVideos = remainingBytes !== null ? Math.floor(remainingBytes / avgVideoBytes) : null;

  return (
    <Card theme={theme}>
      <SectionLabel theme={theme} icon={<IconVideo />}>Videos</SectionLabel>
      <AutopostAlert theme={theme} />
      <div style={{ fontSize: "12px", color: theme.textMuted, marginBottom: "16px", lineHeight: 1.4 }}>
        Stored locally in this browser only — not backed up or synced.
      </div>

      {storageSupported && storageEstimate && (
        <div style={{ marginBottom: "18px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              fontSize: "11.5px",
              color: theme.textMuted,
              marginBottom: "6px",
              gap: "8px",
            }}
          >
            <span>
              {formatBytes(storageEstimate.usage)} used of {formatBytes(storageEstimate.quota)}
            </span>
            {estRemainingVideos !== null && (
              <span style={{ color: theme.textFaint, flexShrink: 0 }}>
                ~{estRemainingVideos.toLocaleString()} more 1-min video{estRemainingVideos === 1 ? "" : "s"}
              </span>
            )}
          </div>
          <div style={{ height: "6px", borderRadius: "999px", background: theme.progressTrack, overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${usagePct || 0}%`,
                borderRadius: "999px",
                background: theme.progressFill,
                transition: "width 0.3s ease",
              }}
            />
          </div>
        </div>
      )}

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px", fontSize: "11.5px", color: theme.textFaint, marginBottom: "14px", flexWrap: "wrap" }}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          <span>
            {poolIds.size} video{poolIds.size === 1 ? "" : "s"} in the scheduled auto-post pool
            {paused && <strong style={{ color: theme.danger }}> · paused</strong>}
          </span>
          <button
            onClick={togglePause}
            disabled={pauseBusy}
            className="v-btn"
            style={{ border: `1px solid ${theme.inputBorder}`, background: "transparent", color: theme.textMuted, borderRadius: "6px", padding: "3px 8px", fontSize: "11px", fontWeight: 700, opacity: pauseBusy ? 0.6 : 1 }}
          >
            {pauseBusy ? "…" : paused ? "Resume" : "Pause"}
          </button>
        </span>
        <a
          href={`${AUTOPOST_BACKEND_URL}/.netlify/functions/youtube-auth-start`}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: theme.accent, fontWeight: 600, textDecoration: "none" }}
        >
          Set up / re-authorize auto-poster →
        </a>
      </div>

      {dbError && (
        <div style={{ fontSize: "13px", color: theme.danger, marginBottom: "14px" }}>{dbError}</div>
      )}

      {loading ? (
        <div style={{ fontSize: "13px", color: theme.textFaint }}>Loading videos…</div>
      ) : videos.length === 0 ? (
        <div style={{ fontSize: "13px", color: theme.textFaint, marginBottom: "18px" }}>
          No videos yet — upload one below.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))",
            gap: "16px",
            marginBottom: "20px",
          }}
        >
          {videos.map((v) => {
            const status = statusById[v.id];
            return (
              <div
                key={v.id}
                style={{
                  background: theme.accentSoft,
                  border: `1px solid ${theme.divider}`,
                  borderRadius: "14px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
                }}
              >
                <video
                  src={v.url}
                  controls
                  style={{ width: "100%", borderRadius: "10px", background: "#000", display: "block", maxHeight: "220px" }}
                />
                <input
                  value={v.title}
                  onChange={(e) => renameVideo(v.id, e.target.value)}
                  className="v-input"
                  style={{
                    width: "100%",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: theme.text,
                    background: "transparent",
                    border: "none",
                    borderRadius: "6px",
                    padding: "2px 0",
                    "--focus-ring": theme.accentSoft,
                    "--focus-border": "transparent",
                  }}
                />
                <div style={{ fontSize: "11px", color: theme.textFaint }}>{formatBytes(v.size)}</div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    onClick={() => shareVideoFile(v, (s) => setStatus(v.id, s), "TikTok")}
                    className="v-btn"
                    title="Share to TikTok"
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      background: theme.accent,
                      color: theme.accentText,
                      border: "none",
                      borderRadius: "8px",
                      padding: "7px 8px",
                      fontSize: "11.5px",
                      fontWeight: 700,
                    }}
                  >
                    <IconShare size={13} />
                    TikTok
                  </button>
                  <button
                    onClick={() => setPostingVideo(v)}
                    className="v-btn"
                    title="Post to YouTube"
                    style={{
                      flex: 1,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px",
                      background: "transparent",
                      color: theme.text,
                      border: `1px solid ${theme.inputBorder}`,
                      borderRadius: "8px",
                      padding: "7px 8px",
                      fontSize: "11.5px",
                      fontWeight: 700,
                    }}
                  >
                    <IconYoutube size={13} />
                    YouTube
                  </button>
                  <button
                    onClick={() => deleteVideo(v.id)}
                    title="Delete"
                    className="v-btn"
                    style={{
                      border: `1px solid ${theme.inputBorder}`,
                      background: "transparent",
                      color: theme.danger,
                      borderRadius: "8px",
                      padding: "7px 10px",
                      fontSize: "12px",
                      fontWeight: 700,
                    }}
                  >
                    <IconClose size={13} />
                  </button>
                </div>
                <button
                  onClick={() => togglePool(v)}
                  disabled={!!poolBusyById[v.id]}
                  className="v-btn"
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px",
                    background: poolIds.has(v.id) ? theme.dangerSoft : "transparent",
                    color: poolIds.has(v.id) ? theme.danger : theme.textMuted,
                    border: `1px dashed ${poolIds.has(v.id) ? theme.danger : theme.inputBorder}`,
                    borderRadius: "8px",
                    padding: "6px 8px",
                    fontSize: "11px",
                    fontWeight: 700,
                    opacity: poolBusyById[v.id] ? 0.7 : 1,
                  }}
                >
                  {poolBusyById[v.id]
                    ? poolBusyById[v.id] === "removing"
                      ? "Removing…"
                      : `Adding to pool… ${poolBusyById[v.id].sent}/${poolBusyById[v.id].total}`
                    : poolIds.has(v.id)
                    ? "Remove from auto-post pool"
                    : "Add to auto-post pool"}
                </button>
                {status && (
                  <div
                    style={{
                      fontSize: "11px",
                      fontWeight: 600,
                      color: status.type === "error" ? theme.danger : theme.positive,
                    }}
                  >
                    {status.message}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        disabled={uploading}
        className="v-btn"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: theme.accent,
          color: theme.accentText,
          border: "none",
          borderRadius: "8px",
          padding: "10px 18px",
          fontSize: "13.5px",
          fontWeight: 700,
          opacity: uploading ? 0.6 : 1,
        }}
      >
        <IconUpload />
        {uploading ? "Saving…" : "Upload Video"}
      </button>
      <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileChange} style={{ display: "none" }} />

      {postingVideo && (
        <PostToYouTubeModal
          theme={theme}
          video={postingVideo}
          onClose={() => setPostingVideo(null)}
        />
      )}
    </Card>
  );
}

/* ----------------------------------------------------------------------
   App — a single always-visible page, no routing/nav/theme-picker.
---------------------------------------------------------------------- */
function App() {
  useEffect(() => { applyThemeVars(THEME); }, []);
  return (
    <div
      className="v-app"
      style={{
        minHeight: "100vh",
        background: THEME.pageBgGradient !== "none" ? THEME.pageBgGradient : THEME.pageBg,
        color: THEME.text,
      }}
    >
      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "32px 20px" }}>
        <VideoLibrarySection theme={THEME} />
      </div>
      <ToastHost theme={THEME} />
    </div>
  );
}

// A document-level listener (rather than e.target) swaps `title` for the
// CSS tooltip pill in index.shell.html on hover/focus instead of the
// browser's native tooltip.
function initTooltipDelegation() {
  function show(e) {
    const el = e.composedPath()[0].closest && e.composedPath()[0].closest("[title]");
    if (!el) return;
    el.setAttribute("data-tip", el.getAttribute("title"));
    el.removeAttribute("title");
  }
  function hide(e) {
    const el = e.composedPath()[0].closest && e.composedPath()[0].closest("[data-tip]");
    if (!el) return;
    el.setAttribute("title", el.getAttribute("data-tip"));
    el.removeAttribute("data-tip");
  }
  document.addEventListener("mouseover", show);
  document.addEventListener("mouseout", hide);
  document.addEventListener("focusin", show);
  document.addEventListener("focusout", hide);
}
initTooltipDelegation();

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
