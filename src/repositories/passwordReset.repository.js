const { randomUUID, createHash, randomBytes } = require("crypto");
const { query } = require("../config/db");

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  await query(`
    CREATE TABLE IF NOT EXISTS password_reset_tokens (
      id          CHAR(36)     NOT NULL PRIMARY KEY,
      user_id     CHAR(36)     NOT NULL,
      token_hash  CHAR(64)     NOT NULL,
      expires_at  DATETIME     NOT NULL,
      used_at     DATETIME     NULL,
      created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_reset_token_hash (token_hash),
      INDEX idx_reset_user (user_id)
    ) ENGINE=InnoDB
  `);
  schemaReady = true;
}

function hashToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

function createRawToken() {
  return randomBytes(32).toString("hex");
}

async function invalidateOpenTokens(userId) {
  await ensureSchema();
  await query(
    `UPDATE password_reset_tokens
     SET used_at = NOW()
     WHERE user_id = ? AND used_at IS NULL AND expires_at > NOW()`,
    [userId],
  );
}

async function createToken(userId, ttlMinutes = 60) {
  await ensureSchema();
  await invalidateOpenTokens(userId);
  const raw = createRawToken();
  const id = randomUUID();
  await query(
    `INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at)
     VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL ? MINUTE))`,
    [id, userId, hashToken(raw), ttlMinutes],
  );
  return raw;
}

async function findValidToken(rawToken) {
  await ensureSchema();
  const token = String(rawToken || "").trim();
  if (!token) return null;
  const rows = await query(
    `SELECT id, user_id, expires_at, used_at
     FROM password_reset_tokens
     WHERE token_hash = ?
     LIMIT 1`,
    [hashToken(token)],
  );
  const row = rows[0];
  if (!row) return null;
  if (row.used_at) return null;
  if (new Date(row.expires_at).getTime() <= Date.now()) return null;
  return row;
}

async function markUsed(id) {
  await ensureSchema();
  await query(`UPDATE password_reset_tokens SET used_at = NOW() WHERE id = ?`, [id]);
}

module.exports = {
  ensureSchema,
  createToken,
  findValidToken,
  markUsed,
  invalidateOpenTokens,
};
