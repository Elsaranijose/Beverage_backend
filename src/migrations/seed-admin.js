require("dotenv").config();
const bcrypt = require("bcrypt");
const mysql = require("mysql2/promise");
const { randomUUID } = require("crypto");

async function main() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "beverage_vault",
    multipleStatements: true,
  });

  const adminEmail = "admin@beveragevault.com";
  const adminPass = "Admin@Vault1";
  const hash = await bcrypt.hash(adminPass, 10);
  const id = randomUUID();

  await connection.execute(
    `INSERT INTO users (id, email, password_hash, full_name, role, age_confirmed)
     VALUES (?, ?, ?, ?, 'ADMIN', 1)
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash), role = 'ADMIN'`,
    [id, adminEmail, hash, "Vault Admin"],
  );

  console.log("Seeded admin user:", adminEmail);
  console.log("Password:", adminPass);
  await connection.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
