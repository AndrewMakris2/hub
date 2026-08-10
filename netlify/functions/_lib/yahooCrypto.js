// Ported from FantasyFootballTool's server/src/store/crypto.ts — AES-256-GCM
// encryption for Yahoo's access/refresh tokens at rest in Netlify Blobs.
const crypto = require("crypto");

const ALGORITHM = "aes-256-gcm";

function deriveKey(secret) {
  return crypto.createHash("sha256").update(secret).digest();
}

function encrypt(plaintext, secret) {
  const key = deriveKey(secret);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, encrypted].map((buf) => buf.toString("base64")).join(".");
}

function decrypt(payload, secret) {
  const [ivB64, authTagB64, encryptedB64] = payload.split(".");
  const key = deriveKey(secret);
  const iv = Buffer.from(ivB64, "base64");
  const authTag = Buffer.from(authTagB64, "base64");
  const encrypted = Buffer.from(encryptedB64, "base64");
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}

module.exports = { encrypt, decrypt };
