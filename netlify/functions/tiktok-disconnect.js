// Lets Vantage clear the stored TikTok connection (e.g. a "Disconnect"
// button) without needing to go through TikTok's own settings.

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const origin = process.env.VANTAGE_ORIGIN || "https://andrewmakris2.github.io";
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": origin,
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { ...headers, "Access-Control-Allow-Methods": "POST, OPTIONS" } };
  }

  try {
    const store = getStore("tiktok-tokens");
    await store.delete("primary");
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("TikTok disconnect error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false }) };
  }
};
