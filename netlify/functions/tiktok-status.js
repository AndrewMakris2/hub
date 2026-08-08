// Tells the frontend whether a TikTok account is connected, without ever
// exposing the actual access token to the browser.

const { getStore } = require("@netlify/blobs");

exports.handler = async () => {
  const origin = process.env.VANTAGE_ORIGIN || "https://andrewmakris2.github.io";
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
  };

  try {
    const store = getStore("tiktok-tokens");
    const tokens = await store.get("primary", { type: "json" });
    const connected = !!(tokens && tokens.access_token && tokens.refresh_expires_at > Date.now());
    return { statusCode: 200, headers, body: JSON.stringify({ connected }) };
  } catch (err) {
    console.error("TikTok status check error:", err);
    return { statusCode: 200, headers, body: JSON.stringify({ connected: false }) };
  }
};
