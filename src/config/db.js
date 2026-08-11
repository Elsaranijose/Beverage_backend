require("dotenv").config();
const mysql = require("mysql2/promise");

let pool;

function resolveDbHost() {
  const configured = (process.env.DB_HOST || "").trim();

  // Hostinger / Linux: keep "localhost" — MySQL users are often granted as user@localhost
  // (connecting as 127.0.0.1 is treated as a different host and gets "Access denied").
  if (configured) {
    if (configured === "localhost" && process.platform === "win32") {
      return "127.0.0.1";
    }
    return configured;
  }

  // Defaults when DB_HOST is unset
  return process.platform === "win32" ? "127.0.0.1" : "localhost";
}

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: resolveDbHost(),
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || "root",
      password: process.env.DB_PASSWORD || "",
      database: process.env.DB_NAME || "beverage_vault",
      waitForConnections: true,
      connectionLimit: 10,
      connectTimeout: 10000,
      namedPlaceholders: true,
    });
  }
  return pool;
}

async function query(sql, params) {
  const [rows] = await getPool().execute(sql, params);
  return rows;
}

module.exports = { getPool, query };
