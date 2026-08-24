// Kicks off TikTok's OAuth2 flow with a server-signed state parameter, so
// tiktok-callback.js can verify the redirect actually originated from here
// (rather than trusting whatever `code`/`state` a caller sends back) — see
// _lib/oauthState.js for the HMAC-signing helpers. The frontend used to
// generate its own state and hand it straight to TikTok without ever
// verifying it came back unchanged; this replaces that with a real
// HMAC-signed, time-limited state, checked server-side in the callback.
//
// Required environment variables (set in Netlify site settings, not here):
//   SESSION — HMAC-signs the OAuth state param
//
// client_key is TikTok's public app identifier (not a secret — see
// tiktok-callback.js's own comment), passed through from the frontend the
// same way it always has been, since it's user-configured there rather than
// duplicated into a Netlify env var.
const { createState } = require("./_lib/oauthState");

exports.handler = async (event) => {
  const secret = process.env.SESSION;
  if (!secret) {
    return { statusCode: 500, body: "SESSION is not configured." };
  }

  const clientKey = event.queryStringParameters && event.queryStringParameters.client_key;
  if (!clientKey) {
    return { statusCode: 400, body: "Missing client_key." };
  }

  const proto = (event.headers && event.headers["x-forwarded-proto"]) || "https";
  const host = event.headers && event.headers.host;
  const redirectUri = `${proto}://${host}/.netlify/functions/tiktok-callback`;

  const state = createState(secret);
  const authUrl =
    "https://www.tiktok.com/v2/auth/authorize/" +
    `?client_key=${encodeURIComponent(clientKey)}` +
    "&scope=video.publish" +
    "&response_type=code" +
    `&redirect_uri=${encodeURIComponent(redirectUri)}` +
    `&state=${encodeURIComponent(state)}`;

  return { statusCode: 302, headers: { Location: authUrl } };
};
