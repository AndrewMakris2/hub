// Tells the frontend whether a Yahoo account is connected, without ever
// exposing the actual tokens to the browser.
const { corsHeaders } = require("./_lib/cors");
const { isYahooConnected } = require("./_lib/yahooClient");

exports.handler = async (event) => {
  const headers = corsHeaders(event);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { ...headers, "Access-Control-Allow-Methods": "GET, OPTIONS" } };
  }

  try {
    const connected = await isYahooConnected();
    return { statusCode: 200, headers, body: JSON.stringify({ connected }) };
  } catch (err) {
    console.error("Yahoo status check error:", err);
    return { statusCode: 200, headers, body: JSON.stringify({ connected: false }) };
  }
};
