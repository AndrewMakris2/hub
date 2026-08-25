// Netlify's `-background` filename suffix marks this as a Background
// Function (15-minute execution cap, vs. 30s for the scheduled function
// that triggers it in post-random-video.js) — reassembling a video from
// chunks and uploading it to YouTube can plausibly take longer than 30s.
// Gated by X-Internal-Secret so this isn't a bare public "post a video
// right now" URL — only post-random-video.js is meant to call it.
const { readIndex, readChunk, removeVideo } = require("./_lib/videoPool");

async function getAccessToken() {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_SERVER_CLIENT_ID,
      client_secret: process.env.GOOGLE_SERVER_CLIENT_SECRET,
      refresh_token: process.env.YOUTUBE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json().catch(() => null);
  if (!res.ok || !data) {
    throw new Error((data && (data.error_description || data.error)) || `Token refresh failed (${res.status}).`);
  }
  return data.access_token;
}

// Same hand-rolled multipart/related body app.jsx's uploadVideoToYouTube
// builds client-side — Node's global Blob accepts the identical
// constructor shape, so this is a near-direct port, not new logic.
async function uploadToYouTube(videoBuffer, mimeType, title, accessToken) {
  const boundary = "vantage" + Date.now().toString(36);
  const metadata = { snippet: { title, description: "" }, status: { privacyStatus: "private" } };
  const head =
    `--${boundary}\r\n` +
    "Content-Type: application/json; charset=UTF-8\r\n\r\n" +
    JSON.stringify(metadata) +
    `\r\n--${boundary}\r\n` +
    `Content-Type: ${mimeType || "video/mp4"}\r\n\r\n`;
  const tail = `\r\n--${boundary}--`;
  const body = new Blob([head, videoBuffer, tail]);

  const res = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=multipart&part=snippet,status", {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": `multipart/related; boundary=${boundary}` },
    body,
  });
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error((data && data.error && data.error.message) || `YouTube upload failed (${res.status}).`);
  }
  return data;
}

exports.handler = async (event) => {
  const secret = process.env.INTERNAL_TRIGGER_SECRET;
  const gotSecret = event.headers && (event.headers["x-internal-secret"] || event.headers["X-Internal-Secret"]);
  if (!secret || gotSecret !== secret) {
    console.error("post-random-video-background: rejected — missing/incorrect X-Internal-Secret.");
    return { statusCode: 401, body: "unauthorized" };
  }

  let videoId;
  try {
    videoId = JSON.parse(event.body || "{}").videoId;
  } catch {
    return { statusCode: 400, body: "invalid body" };
  }
  if (!videoId) return { statusCode: 400, body: "missing videoId" };

  const list = await readIndex();
  const entry = list.find((v) => v.id === videoId);
  if (!entry) {
    console.error(`post-random-video-background: video ${videoId} is no longer in the pool.`);
    return { statusCode: 404, body: "video not found" };
  }

  try {
    const chunkBuffers = await Promise.all(Array.from({ length: entry.chunkCount }, (_, i) => readChunk(videoId, i)));
    const videoBuffer = Buffer.concat(chunkBuffers.map((b) => Buffer.from(b)));

    const accessToken = await getAccessToken();
    const title = process.env.AUTOPOST_TITLE || "Vantage auto-post";
    const result = await uploadToYouTube(videoBuffer, entry.type, title, accessToken);

    await removeVideo(videoId);
    console.log(`post-random-video-background: posted "${title}" as https://youtube.com/watch?v=${result.id}, removed from pool.`);
    return { statusCode: 200, body: JSON.stringify({ ok: true, videoId: result.id }) };
  } catch (err) {
    console.error("post-random-video-background error:", err.message);
    return { statusCode: 500, body: err.message };
  }
};
