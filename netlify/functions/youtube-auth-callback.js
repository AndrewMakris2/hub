// Exchanges the one-time authorization code from youtube-auth-start.js for
// a refresh token, and shows it once, in plain text, for the user to copy
// into Netlify's YOUTUBE_REFRESH_TOKEN environment variable. This function
// never stores or logs the token itself — it only ever passes through the
// response.
function page(body) {
  return {
    statusCode: 200,
    headers: { "Content-Type": "text/html; charset=utf-8" },
    body: `<!DOCTYPE html><html><body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:640px;margin:60px auto;padding:0 20px;line-height:1.6">${body}</body></html>`,
  };
}

exports.handler = async (event) => {
  const clientId = process.env.GOOGLE_SERVER_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_SERVER_CLIENT_SECRET;
  const code = event.queryStringParameters && event.queryStringParameters.code;

  if (!clientId || !clientSecret) {
    return page("<p>GOOGLE_SERVER_CLIENT_ID / GOOGLE_SERVER_CLIENT_SECRET aren't set yet — add them in Netlify's environment variables first (see README.md).</p>");
  }
  if (!code) {
    return page("<p>No authorization code in the URL — start from <code>/.netlify/functions/youtube-auth-start</code> instead of visiting this page directly.</p>");
  }

  const proto = (event.headers && (event.headers["x-forwarded-proto"] || event.headers["X-Forwarded-Proto"])) || "https";
  const host = event.headers && (event.headers.host || event.headers.Host);
  const redirectUri = `${proto}://${host}/.netlify/functions/youtube-auth-callback`;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data || !data.refresh_token) {
      const reason = (data && (data.error_description || data.error)) || `HTTP ${res.status}`;
      return page(`<p>Token exchange failed: ${reason}.</p>`);
    }
    return page(
      `<p>Copy this into Netlify's <strong>YOUTUBE_REFRESH_TOKEN</strong> environment variable, then trigger a redeploy so the scheduled function picks it up:</p>` +
        `<pre style="background:#f4f4f4;padding:16px;border-radius:8px;overflow-wrap:anywhere;white-space:pre-wrap">${data.refresh_token}</pre>` +
        `<p>This page doesn't store it anywhere — copy it now.</p>`
    );
  } catch (err) {
    return page(`<p>Token exchange request failed: ${err.message}</p>`);
  }
};
