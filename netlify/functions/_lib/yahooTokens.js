// Encrypted Yahoo token storage in Netlify Blobs — single-tenant (one set of
// tokens for the one person who uses this dashboard), same as the original
// FantasyFootballTool's db.ts. Unlike the stats-cache/sleeper-cache stores,
// there's no safe "degrade gracefully" fallback here if Blobs is
// unavailable — a token that can't be persisted just isn't connected, and
// that has to surface as a real error rather than a silent no-op.
const { getStore } = require("@netlify/blobs");

const STORE_NAME = "yahoo-tokens";
const KEY = "primary";

function requireSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set — required to store Yahoo tokens securely.");
  return secret;
}

async function getYahooTokens() {
  const { decrypt } = require("./yahooCrypto");
  const store = getStore(STORE_NAME);
  const encrypted = await store.get(KEY, { type: "text" });
  if (!encrypted) return null;
  try {
    const json = decrypt(encrypted, requireSecret());
    return JSON.parse(json);
  } catch (err) {
    // A corrupted blob or rotated SESSION_SECRET would throw deep inside
    // decrypt() — degrade to "not connected" instead of a raw 500.
    console.error("Failed to decrypt Yahoo tokens:", err.message);
    return null;
  }
}

async function setYahooTokens(tokens) {
  const { encrypt } = require("./yahooCrypto");
  const store = getStore(STORE_NAME);
  const encrypted = encrypt(JSON.stringify(tokens), requireSecret());
  await store.set(KEY, encrypted);
}

module.exports = { getYahooTokens, setYahooTokens };
