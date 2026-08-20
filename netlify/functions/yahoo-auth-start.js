// Kicks off Yahoo's OAuth2 flow. Redirect URI must exactly match what's
// registered in Yahoo's developer console for this app.
//
// Required environment variables (set in Netlify site settings, not here):
//   YAHOO_CLIENT_ID      — public, same value used server-side only here
//   YAHOO_CLIENT_SECRET  — secret, only ever used in yahoo-auth-callback.js
//   SESSION               — HMAC-signs the OAuth state param
const { createState } = require("./_lib/oauthState");
const { buildAuthorizeUrl } = require("./_lib/yahooClient");

exports.handler = async (event) => {
  const secret = process.env.SESSION;
  if (!secret) {
    return { statusCode: 500, body: "SESSION is not configured." };
  }

  const proto = (event.headers && event.headers["x-forwarded-proto"]) || "https";
  const host = event.headers && event.headers.host;
  const redirectUri = `${proto}://${host}/.netlify/functions/yahoo-auth-callback`;

  const state = createState(secret);
  return { statusCode: 302, headers: { Location: buildAuthorizeUrl(state, redirectUri) } };
};
