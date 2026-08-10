// Full league detail (settings, standings, rosters) for one linked Yahoo
// league (?leagueKey=<yahoo league key>).
const { corsHeaders } = require("./_lib/cors");
const { getLeagueDetail } = require("./_lib/yahooClient");

exports.handler = async (event) => {
  const headers = corsHeaders(event);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { ...headers, "Access-Control-Allow-Methods": "GET, OPTIONS" } };
  }

  const leagueKey = event.queryStringParameters && event.queryStringParameters.leagueKey;
  if (!leagueKey) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: "leagueKey query param is required" }) };
  }

  try {
    const league = await getLeagueDetail(leagueKey);
    return { statusCode: 200, headers, body: JSON.stringify(league) };
  } catch (err) {
    console.error("Yahoo league error:", err);
    return { statusCode: 502, headers, body: JSON.stringify({ error: err.message }) };
  }
};
