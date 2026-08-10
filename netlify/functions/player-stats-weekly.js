// Week-by-week stat lines for a single player (?playerId=<sleeper id>).
// Same underlying cached dataset as player-stats.js — see _lib/statsData.js.
const { corsHeaders } = require("./_lib/cors");
const { loadPlayerStats } = require("./_lib/statsData");

exports.handler = async (event) => {
  const headers = corsHeaders(event);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { ...headers, "Access-Control-Allow-Methods": "GET, OPTIONS" } };
  }

  const playerId = event.queryStringParameters && event.queryStringParameters.playerId;
  if (!playerId) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "playerId query param is required" }) };
  }

  try {
    const { weekly } = await loadPlayerStats();
    return { statusCode: 200, headers, body: JSON.stringify(weekly[playerId] || []) };
  } catch (err) {
    console.error("player-stats-weekly error:", err);
    return { statusCode: 502, headers, body: JSON.stringify({ error: err.message }) };
  }
};
