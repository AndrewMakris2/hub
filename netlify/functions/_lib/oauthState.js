// Ported from FantasyFootballTool's server/src/store/oauthState.ts — signs
// the OAuth "state" param with SESSION so the callback can verify the
// request actually originated from a /auth/start redirect within the last
// 10 minutes, rather than trusting whatever "state" a caller sends back.
const crypto = require("crypto");

const MAX_AGE_MS = 10 * 60 * 1000;

function sign(timestamp, secret) {
  return crypto.createHmac("sha256", secret).update(timestamp).digest("base64url");
}

function createState(secret) {
  const timestamp = String(Date.now());
  const signature = sign(timestamp, secret);
  return `${timestamp}.${signature}`;
}

function verifyState(state, secret) {
  if (!state) return false;
  const [timestamp, signature] = state.split(".");
  if (!timestamp || !signature) return false;
  if (Date.now() - Number(timestamp) > MAX_AGE_MS) return false;

  const expected = sign(timestamp, secret);
  const expectedBuf = Buffer.from(expected);
  const actualBuf = Buffer.from(signature);
  if (expectedBuf.length !== actualBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, actualBuf);
}

module.exports = { createState, verifyState };
