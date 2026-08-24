// Shared CORS allowlist for Vantage's Netlify Functions. Vantage itself is
// static and deployed to two places (GitHub Pages + this Netlify site), and
// pages loaded from either origin call these functions cross-origin via an
// absolute URL — both known Vantage origins are allowed rather than one
// hardcoded default.
const ALLOWED_ORIGINS = new Set(["https://andrewmakris2.github.io", "https://bearvantagehub.netlify.app"]);

function corsHeaders(event, extra) {
  const origin = (event.headers && (event.headers.origin || event.headers.Origin)) || "";
  const allowOrigin = ALLOWED_ORIGINS.has(origin) ? origin : "https://andrewmakris2.github.io";
  return {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": allowOrigin,
    Vary: "Origin",
    ...extra,
  };
}

module.exports = { corsHeaders, ALLOWED_ORIGINS };
