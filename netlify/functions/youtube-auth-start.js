// One-time (and, if ever needed again, repeatable) step in the scheduled
// auto-poster setup: redirects to Google's consent screen for the
// server-side, refresh-token-capable OAuth client (separate from the
// browser-only Client ID the manual "Post to YouTube" button uses — that
// one can't issue refresh tokens). See README.md "Environment variables"
// for the full setup checklist. prompt=consent forces a fresh refresh token
// on every visit, so this is safe to revisit if the token is ever lost.
exports.handler = async (event) => {
  const clientId = process.env.GOOGLE_SERVER_CLIENT_ID;
  if (!clientId) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "text/plain" },
      body: "GOOGLE_SERVER_CLIENT_ID isn't set yet — add it in Netlify's environment variables first (see README.md).",
    };
  }
  const proto = (event.headers && (event.headers["x-forwarded-proto"] || event.headers["X-Forwarded-Proto"])) || "https";
  const host = event.headers && (event.headers.host || event.headers.Host);
  const redirectUri = `${proto}://${host}/.netlify/functions/youtube-auth-callback`;
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "https://www.googleapis.com/auth/youtube.upload",
    access_type: "offline",
    prompt: "consent",
  });
  return {
    statusCode: 302,
    headers: { Location: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` },
  };
};
