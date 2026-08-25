// Lists or removes videos in the scheduled auto-poster's server-side pool.
// Used by VideoLibrarySection (app.jsx) to show pool membership/count and
// let the user pull a video back out before it gets posted.
const { corsHeaders } = require("./_lib/cors");
const { readIndex, removeVideo } = require("./_lib/videoPool");

exports.handler = async (event) => {
  const headers = corsHeaders(event);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { ...headers, "Access-Control-Allow-Methods": "GET, POST, OPTIONS" } };
  }

  if (event.httpMethod === "GET") {
    const videos = await readIndex();
    return { statusCode: 200, headers, body: JSON.stringify({ videos }) };
  }

  if (event.httpMethod === "POST") {
    let payload;
    try {
      payload = JSON.parse(event.body || "{}");
    } catch {
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Invalid JSON body." }) };
    }
    if (payload.action === "remove" && payload.id) {
      try {
        await removeVideo(payload.id);
        return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
      } catch (err) {
        console.error("autopost-pool remove error:", err);
        return { statusCode: 502, headers, body: JSON.stringify({ error: err.message }) };
      }
    }
    return { statusCode: 400, headers, body: JSON.stringify({ error: "Unsupported action." }) };
  }

  return { statusCode: 405, headers, body: JSON.stringify({ error: "GET or POST only." }) };
};
