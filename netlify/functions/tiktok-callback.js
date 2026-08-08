// Receives TikTok's OAuth redirect (?code=...), exchanges it for an access
// token using the client secret (kept only in this server-side environment
// variable, never sent to the browser), stores the token in Netlify Blobs,
// and sends the browser back to Vantage.
//
// Required environment variables (set in Netlify site settings, not here):
//   TIKTOK_CLIENT_KEY     — public, same value used in the frontend
//   TIKTOK_CLIENT_SECRET  — secret, only ever lives here
//   TIKTOK_REDIRECT_URI   — this function's own URL, must exactly match
//                           what's registered in TikTok's Login Kit settings
//   VANTAGE_URL           — https://andrewmakris2.github.io/hub/

const { getStore } = require("@netlify/blobs");

exports.handler = async (event) => {
  const vantageUrl = process.env.VANTAGE_URL || "https://andrewmakris2.github.io/hub/";
  const code = event.queryStringParameters && event.queryStringParameters.code;
  const errorParam = event.queryStringParameters && event.queryStringParameters.error;

  if (errorParam) {
    return redirect(`${vantageUrl}?tiktok=error&reason=${encodeURIComponent(errorParam)}`);
  }
  if (!code) {
    return redirect(`${vantageUrl}?tiktok=error&reason=missing_code`);
  }

  try {
    const body = new URLSearchParams({
      client_key: process.env.TIKTOK_CLIENT_KEY,
      client_secret: process.env.TIKTOK_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: process.env.TIKTOK_REDIRECT_URI,
    });

    const tokenRes = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Cache-Control": "no-cache" },
      body: body.toString(),
    });

    const tokenData = await tokenRes.json();

    if (!tokenRes.ok || tokenData.error) {
      console.error("TikTok token exchange failed:", tokenData);
      return redirect(`${vantageUrl}?tiktok=error&reason=token_exchange_failed`);
    }

    const store = getStore("tiktok-tokens");
    await store.setJSON("primary", {
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      open_id: tokenData.open_id,
      expires_at: Date.now() + tokenData.expires_in * 1000,
      refresh_expires_at: Date.now() + tokenData.refresh_expires_in * 1000,
    });

    return redirect(`${vantageUrl}?tiktok=connected`);
  } catch (err) {
    console.error("TikTok callback error:", err);
    return redirect(`${vantageUrl}?tiktok=error&reason=server_error`);
  }
};

function redirect(location) {
  return { statusCode: 302, headers: { Location: location } };
}
