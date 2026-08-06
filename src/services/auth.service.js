const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");
const { query } = require("../config/db");
const usersRepo = require("../repositories/users.repository");

function signToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, fullName: user.full_name },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "7d" },
  );
}

async function login(email, password) {
  await usersRepo.ensureSchema();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const rows = await query("SELECT * FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);
  const user = rows[0];
  if (!user) return { ok: false, message: "Invalid email or password" };
  if (user.status === "inactive") {
    return { ok: false, message: "This account has been deactivated. Contact support." };
  }
  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) return { ok: false, message: "Invalid email or password" };
  const token = signToken(user);
  return {
    ok: true,
    token,
    session: {
      userId: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      loggedInAt: new Date().toISOString(),
    },
  };
}

async function register({ fullName, email, password, dateOfBirth }) {
  await usersRepo.ensureSchema();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const name = String(fullName || "").trim();
  if (!name || !normalizedEmail || !password) {
    return { ok: false, message: "Full name, email, and password are required" };
  }
  if (String(password).length < 6) {
    return { ok: false, message: "Password must be at least 6 characters" };
  }

  const existing = await query("SELECT id FROM users WHERE email = ? LIMIT 1", [normalizedEmail]);
  if (existing[0]) return { ok: false, message: "Email already registered" };

  const id = randomUUID();
  const hash = await bcrypt.hash(password, 10);
  await query(
    `INSERT INTO users (id, email, password_hash, full_name, role, date_of_birth, age_confirmed)
     VALUES (?, ?, ?, ?, 'USER', ?, 1)`,
    [id, normalizedEmail, hash, name, dateOfBirth || null],
  );
  return login(normalizedEmail, password);
}

async function getUserById(id, { includeInactive = false } = {}) {
  await usersRepo.ensureSchema();
  const rows = await query(
    "SELECT id, email, full_name, role, date_of_birth, age_confirmed, status, created_at FROM users WHERE id = ? LIMIT 1",
    [id],
  );
  const user = rows[0];
  if (!user) return null;
  if (!includeInactive && user.status === "inactive" && user.role !== "ADMIN") return null;
  return user;
}

module.exports = { login, register, getUserById, signToken };
