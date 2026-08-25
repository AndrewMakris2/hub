// Receives one base64-encoded slice of a video from the "Add to auto-post
// pool" button in VideoLibrarySection (app.jsx) and writes it to the
// server-side pool. On the last chunk, also records the video in the pool
// index so the scheduled poster can pick it.
const { corsHeaders } = require("./_lib/cors");
const { writeChunk, addToIndex } = require("./_lib/videoPool");

exports.handler = async (event) => {
  const headers = corsHeaders(event);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { ...headers, "Access-Control-Allow-Methods": "POST, OPTIONS" } };
  }
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, headers, body: JSON.stringify({ error: "POST only." }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body." }) };
  }
  const { videoId, chunkIndex, chunkCount, title, type, size, dataBase64 } = payload;
  if (!videoId || chunkIndex == null || !chunkCount || !dataBase64) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Missing videoId/chunkIndex/chunkCount/dataBase64." }) };
  }

  try {
    await writeChunk(videoId, chunkIndex, Buffer.from(dataBase64, "base64"));
    const complete = chunkIndex === chunkCount - 1;
    if (complete) {
      await addToIndex({
        id: videoId,
        title: title || "Untitled",
        type: type || "video/mp4",
        size: size || 0,
        chunkCount,
        addedAt: Date.now(),
      });
    }
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true, complete }) };
  } catch (err) {
    console.error("autopost-upload-chunk error:", err);
    return { statusCode: 502, headers, body: JSON.stringify({ error: err.message }) };
  }
};
