// Lists the current Yahoo account's NFL fantasy leagues, so Onboarding can
// show a checklist of which ones to link.
const { corsHeaders } = require("./_lib/cors");
const { getLeaguesForCurrentUser } = require("./_lib/yahooClient");

exports.handler = async (event) => {
  const headers = corsHeaders(event);
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: { ...headers, "Access-Control-Allow-Methods": "GET, OPTIONS" } };
  }

  try {
    const leagues = await getLeaguesForCurrentUser();
    return { statusCode: 200, headers, body: JSON.stringify({ leagues }) };
  } catch (err) {
    console.error("Yahoo preview error:", err);
    return { statusCode: 502, headers, body: JSON.stringify({ error: err.message }) };
  }
};
