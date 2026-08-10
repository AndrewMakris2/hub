// Season-total stats for every player, keyed by Sleeper player ID. Ported
// from FantasyFootballTool's netlify/functions/player-stats.mts — see
// _lib/statsData.js for why this has to stay server-side (nflverse's CSV
// has no CORS headers, so the browser can't fetch it directly).
const { corsHeaders } = require("./_lib/cors");
const { loadPlayerStats } = require("./_lib/statsData");

exports.handler = async (event) => {
  const headers = corsHeaders(event);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { ...headers, "Access-Control-Allow-Methods": "GET, OPTIONS" } };
  }

  try {
    const { season } = await loadPlayerStats();
    return { statusCode: 200, headers, body: JSON.stringify(season) };
  } catch (err) {
    console.error("player-stats error:", err);
    return { statusCode: 502, headers, body: JSON.stringify({ error: err.message }) };
  }
};
