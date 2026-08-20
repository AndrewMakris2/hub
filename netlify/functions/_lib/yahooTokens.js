// Encrypted Yahoo token storage in Netlify Blobs — single-tenant (one set of
// tokens for the one person who uses this dashboard), same as the original
// FantasyFootballTool's db.ts.
//
// Reads degrade to "not connected" on any failure (corrupted blob, rotated
// SESSION_SECRET, or — observed on this site — Netlify Blobs' automatic
// environment config not reliably kicking in for newly-added store names,
// even though the pre-existing tiktok-tokens store works fine). A read
// failure isn't distinguishable from "never connected" to the user anyway,
// so degrading is strictly better than a raw 500.
//
// Writes can't degrade the same way — if the store genuinely can't persist,
// the "Connect Yahoo" flow will complete without actually saving a working
// connection (status will keep reporting disconnected). That's a real
// platform-level risk this environment surfaced that a code-level fix can't
// fully rule out; it needs verifying against a real Yahoo login once
// SESSION_SECRET is set.
const { getStore } = require("@netlify/blobs");

const STORE_NAME = "yahoo-tokens";
const KEY = "primary";

function requireSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not set — required to store Yahoo tokens securely.");
  return secret;
}

async function getYahooTokens() {
  try {
    const { decrypt } = require("./yahooCrypto");
    const store = getStore(STORE_NAME);
    const encrypted = await store.get(KEY, { type: "text" });
    if (!encrypted) return null;
    const json = decrypt(encrypted, requireSecret());
    return JSON.parse(json);
  } catch (err) {
    console.error("Failed to read Yahoo tokens:", err.message);
    return null;
  }
}

async function setYahooTokens(tokens) {
  const { encrypt } = require("./yahooCrypto");
  const store = getStore(STORE_NAME);
  const encrypted = encrypt(JSON.stringify(tokens), requireSecret());
  await store.set(KEY, encrypted);
}

async function deleteYahooTokens() {
  const store = getStore(STORE_NAME);
  await store.delete(KEY);
}

module.exports = { getYahooTokens, setYahooTokens, deleteYahooTokens };
