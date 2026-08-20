// Receives Yahoo's OAuth redirect (?code=&state=), verifies the state,
// exchanges the code for tokens (client secret never leaves this function),
// stores the encrypted tokens, and sends the browser back to Vantage.
const { verifyState } = require("./_lib/oauthState");
const { exchangeCodeForTokens } = require("./_lib/yahooClient");

function redirect(location) {
  return { statusCode: 302, headers: { Location: location } };
}

exports.handler = async (event) => {
  const vantageUrl = process.env.VANTAGE_URL || "https://andrewmakris2.github.io/hub/";
  const params = event.queryStringParameters || {};
  const { code, state, error: errorParam } = params;

  if (errorParam) {
    return redirect(`${vantageUrl}#fantasy/onboarding?yahoo=error`);
  }

  const secret = process.env.SESSION;
  if (!code || !secret || !verifyState(state, secret)) {
    return redirect(`${vantageUrl}#fantasy/onboarding?yahoo=error`);
  }

  const proto = (event.headers && event.headers["x-forwarded-proto"]) || "https";
  const host = event.headers && event.headers.host;
  const redirectUri = `${proto}://${host}/.netlify/functions/yahoo-auth-callback`;

  try {
    await exchangeCodeForTokens(code, redirectUri);
    return redirect(`${vantageUrl}#fantasy/onboarding?yahoo=connected`);
  } catch (err) {
    console.error("Yahoo callback error:", err);
    return redirect(`${vantageUrl}#fantasy/onboarding?yahoo=error`);
  }
};
