// Server-side storage for the scheduled YouTube auto-poster's video pool.
// Nothing else in this project stores user media server-side — the Videos
// page is deliberately browser-local only (see README.md) — but an
// unattended scheduled job has no browser to read from, so videos added to
// the pool live here instead, in this Netlify site's own Blobs store.
//
// A single JSON "index" blob carries all metadata for every pooled video.
// Each video's bytes are split into separate chunk blobs under
// chunks/{id}/{i} — Netlify Functions cap request bodies at ~4.5MB
// effective (binary gets base64-encoded internally), well under real video
// sizes, so the client uploads in pieces (see autopost-upload-chunk.js).
const { getStore } = require("@netlify/blobs");

const INDEX_KEY = "index";
const HISTORY_KEY = "history";
const HISTORY_MAX = 20;

// Netlify's "automatic" getStore(name) config (reading site/token from an
// injected context) turned out to be unreliable specifically for writes on
// this project's functions — reads succeeded, writes threw
// MissingBlobsEnvironmentError even on retry. Falling back to explicit
// siteID/token (Netlify's own documented manual-config path) sidesteps
// that detection entirely. NETLIFY_BLOBS_TOKEN is a Netlify Personal
// Access Token — see README.md. Falls back to automatic mode if it isn't
// set, so `netlify dev` locally still works unconfigured.
function store() {
  const token = process.env.NETLIFY_BLOBS_TOKEN;
  if (token) {
    return getStore({ name: "autopost-videos", siteID: process.env.SITE_ID || "76b83faf-a147-4bff-976d-907546ada669", token });
  }
  return getStore("autopost-videos");
}

async function readIndex() {
  // Same defensive stance as _lib/statsData.js: getStore() has been
  // observed to fail even when the identical pattern works elsewhere in
  // this project. An empty pool is a safe fallback for a listing; write
  // operations below let errors propagate so a failed save isn't silent.
  try {
    const data = await store().get(INDEX_KEY, { type: "json" });
    return data || [];
  } catch (err) {
    console.error("autopost-videos index unavailable:", err.message);
    return [];
  }
}

async function writeIndex(list) {
  await store().setJSON(INDEX_KEY, list);
}

async function addToIndex(entry) {
  const list = await readIndex();
  const next = list.filter((v) => v.id !== entry.id);
  next.push(entry);
  await writeIndex(next);
}

async function writeChunk(id, i, buffer) {
  await store().set(`chunks/${id}/${i}`, buffer);
}

async function readChunk(id, i) {
  return store().get(`chunks/${id}/${i}`, { type: "arrayBuffer" });
}

async function removeVideo(id) {
  const list = await readIndex();
  const entry = list.find((v) => v.id === id);
  await writeIndex(list.filter((v) => v.id !== id));
  if (!entry) return;
  const s = store();
  await Promise.all(
    Array.from({ length: entry.chunkCount }, (_, i) => s.delete(`chunks/${id}/${i}`).catch(() => {}))
  );
}

// So the Home page can show "auto-posted X — Watch it" (or a failure) the
// next time someone opens the app, without any push/notification system —
// it just reads this on load. Newest first, capped so it can't grow
// forever across months of daily posts.
async function readHistory() {
  try {
    const data = await store().get(HISTORY_KEY, { type: "json" });
    return data || [];
  } catch (err) {
    console.error("autopost-videos history unavailable:", err.message);
    return [];
  }
}

async function appendHistory(entry) {
  try {
    const list = await readHistory();
    list.unshift(entry);
    await store().setJSON(HISTORY_KEY, list.slice(0, HISTORY_MAX));
  } catch (err) {
    // A failed history write shouldn't mask the real upload result.
    console.error("Failed to append autopost history:", err.message);
  }
}

module.exports = { readIndex, writeIndex, addToIndex, writeChunk, readChunk, removeVideo, readHistory, appendHistory };
