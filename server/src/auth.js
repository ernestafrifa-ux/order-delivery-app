// Minimal session-token auth — no extra dependency, just Node's built-in
// crypto. A token is base64url(payload) + "." + HMAC-SHA256(payload) using
// a secret only the server knows. Accounts live in the users table (see
// db.js); the very first one is bootstrapped from ADMIN_USERNAME/
// ADMIN_PASSWORD, and more can be added from the app's Users page.
const crypto = require("crypto");
const db = require("./db");
const { verifyPassword } = require("./passwords");

const SECRET = process.env.JWT_SECRET || "dev-only-insecure-secret-change-me";
const SHORT_SESSION_MS = 12 * 60 * 60 * 1000; // 12 hours
const LONG_SESSION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days ("keep me signed in")

function base64url(input) {
  return Buffer.from(input).toString("base64url");
}

function sign(payloadObj) {
  const payload = base64url(JSON.stringify(payloadObj));
  const sig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

function verify(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  const expectedSig = crypto.createHmac("sha256", SECRET).update(payload).digest("base64url");
  const sigBuf = Buffer.from(sig || "");
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (!data.exp || Date.now() > data.exp) return null;
  return data;
}

function issueToken(username, rememberMe) {
  const ttl = rememberMe ? LONG_SESSION_MS : SHORT_SESSION_MS;
  return sign({ u: username, exp: Date.now() + ttl });
}

function checkCredentials(username, password) {
  if (!username || !password) return false;
  const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
  if (!user) {
    // Still do a dummy hash so a nonexistent-vs-wrong-password response
    // takes about the same time either way.
    verifyPassword(String(password), "0".repeat(32) + ":" + "0".repeat(128));
    return false;
  }
  return verifyPassword(password, user.password_hash);
}

// Express middleware: requires a valid "Authorization: Bearer <token>" header.
function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  const data = verify(token);
  if (!data) return res.status(401).json({ error: "Not authenticated" });
  req.user = { username: data.u };
  next();
}

module.exports = { issueToken, checkCredentials, requireAuth, verify };
