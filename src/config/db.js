require("dotenv").config();
const mysql = require("mysql2/promise");

let pool;

function getPool() {
  if (!pool) {
    // Prefer 127.0.0.1 over "localhost" on Windows (avoids IPv6 stalls).
    const host =
      process.env.DB_HOST === "localhost"
        ? "127.0.0.1"
        : process.env.DB_HOST || "127.0.0.1";
    pool = mysql.createPool({
      host,
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
