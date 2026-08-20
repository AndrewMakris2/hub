// Lets Vantage clear the stored Yahoo Fantasy connection (a "Disconnect
// Yahoo" button in Fantasy onboarding) without needing to go through Yahoo's
// own account settings — mirrors tiktok-disconnect.js.
const { corsHeaders } = require("./_lib/cors");
const { deleteYahooTokens } = require("./_lib/yahooTokens");

exports.handler = async (event) => {
  const headers = corsHeaders(event);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { ...headers, "Access-Control-Allow-Methods": "POST, OPTIONS" } };
  }

  try {
    await deleteYahooTokens();
    return { statusCode: 200, headers, body: JSON.stringify({ ok: true }) };
  } catch (err) {
    console.error("Yahoo disconnect error:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ ok: false }) };
  }
};
