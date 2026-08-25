// Scheduled trigger only (see netlify.toml) — picks a video from the pool
// and hands off to post-random-video-background.js, which does the actual
// upload. Kept intentionally thin: Netlify caps *scheduled* function
// execution at 30s, but reassembling a video from chunks and uploading it
// to YouTube can plausibly take longer than that for a multi-minute clip,
// hence the two-function relay — the background function gets a 15-minute
// cap instead.
const { readIndex } = require("./_lib/videoPool");

exports.handler = async (event) => {
  const list = await readIndex();
  if (list.length === 0) {
    console.log("post-random-video: pool is empty, nothing to post.");
    return { statusCode: 200, body: "pool empty" };
  }

  const secret = process.env.INTERNAL_TRIGGER_SECRET;
  if (!secret) {
    console.error("post-random-video: INTERNAL_TRIGGER_SECRET isn't set — refusing to trigger the background function.");
    return { statusCode: 200, body: "not configured" };
  }

  const picked = list[Math.floor(Math.random() * list.length)];
  const siteUrl =
    process.env.URL ||
    (event.headers && event.headers.host && `https://${event.headers.host}`) ||
    "https://bearvantagehub.netlify.app";

  try {
    await fetch(`${siteUrl}/.netlify/functions/post-random-video-background`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Internal-Secret": secret },
      body: JSON.stringify({ videoId: picked.id }),
    });
    console.log(`post-random-video: handed off video ${picked.id} ("${picked.title}") to the background function.`);
    return { statusCode: 200, body: "handed off" };
  } catch (err) {
    console.error("post-random-video: failed to reach the background function:", err.message);
    return { statusCode: 502, body: err.message };
  }
};
