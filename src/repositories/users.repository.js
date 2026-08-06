const { query } = require("../config/db");

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  try {
    await query(
      `ALTER TABLE users ADD COLUMN status ENUM('active','inactive') NOT NULL DEFAULT 'active'`,
    );
  } catch (err) {
    if (!/Duplicate column/i.test(String(err?.message || err))) throw err;
  }
  schemaReady = true;
}

function mapUser(row) {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    role: row.role,
    dateOfBirth: row.date_of_birth,
    ageConfirmed: Boolean(row.age_confirmed),
    status: row.status || "active",
    createdAt: row.created_at,
  };
}

async function findMembers() {
  await ensureSchema();
  const rows = await query(
    `SELECT id, email, full_name, role, date_of_birth, age_confirmed, status, created_at
     FROM users
     WHERE role = 'USER'
     ORDER BY created_at DESC`,
  );
  return rows.map(mapUser);
}

async function findById(id) {
  await ensureSchema();
  const rows = await query(
    `SELECT id, email, full_name, role, date_of_birth, age_confirmed, status, created_at
     FROM users WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0] ? mapUser(rows[0]) : null;
}

async function setStatus(id, status) {
  await ensureSchema();
  const user = await findById(id);
  if (!user) return { ok: false, message: "Member not found" };
  if (user.role === "ADMIN") {
    return { ok: false, message: "Admin accounts cannot be deactivated" };
  }
  if (status !== "active" && status !== "inactive") {
    return { ok: false, message: "Invalid status" };
  }
  await query("UPDATE users SET status = ? WHERE id = ?", [status, id]);
  return { ok: true, user: { ...user, status } };
}

async function remove(id) {
  await ensureSchema();
  const user = await findById(id);
  if (!user) return { ok: false, message: "Member not found" };
  if (user.role === "ADMIN") {
    return { ok: false, message: "Admin accounts cannot be deleted" };
  }
  await query("DELETE FROM users WHERE id = ?", [id]);
  return { ok: true };
}

module.exports = { findMembers, findById, setStatus, remove, ensureSchema };
