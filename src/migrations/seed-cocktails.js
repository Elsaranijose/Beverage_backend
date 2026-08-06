/**
 * Import classic + signature cocktails from Beverage-frontend JSON into MySQL.
 *
 * Usage (from Beverage-backend):
 *   node src/migrations/seed-cocktails.js
 */
require("dotenv").config();
const fs = require("fs");
const path = require("path");
const mysql = require("mysql2/promise");
const classicRepo = require("../repositories/classicCocktails.repository");
const signatureRepo = require("../repositories/signatureCocktails.repository");
const { getPool } = require("../config/db");

function loadJson(relativeFromBackend) {
  const full = path.resolve(__dirname, relativeFromBackend);
  if (!fs.existsSync(full)) {
    throw new Error(`JSON not found: ${full}`);
  }
  return JSON.parse(fs.readFileSync(full, "utf8"));
}

async function widenIdColumns(connection) {
  // Frontend IDs are short (ck-bellini, sig-...) — VARCHAR avoids CHAR(36) padding issues
  await connection.query(
    "ALTER TABLE classic_cocktails MODIFY id VARCHAR(80) NOT NULL",
  );
  await connection.query(
    "ALTER TABLE signature_cocktails MODIFY id VARCHAR(80) NOT NULL",
  );
}

async function updateCategoryCounts(classicCount, signatureCount) {
  const pool = getPool();
  await pool.execute(
    `UPDATE cocktail_categories SET count = ? WHERE slug = 'classic-cocktails'`,
    [classicCount],
  );
  await pool.execute(
    `UPDATE cocktail_categories SET count = ? WHERE slug = 'signature-cocktails'`,
    [signatureCount],
  );
}

async function main() {
  const classicPath = "../../../Beverage-frontend/src/data/classicCocktails.json";
  const signaturePath = "../../../Beverage-frontend/src/data/signatureCocktails.json";

  const classics = loadJson(classicPath);
  const signatures = loadJson(signaturePath);

  if (!Array.isArray(classics) || !Array.isArray(signatures)) {
    throw new Error("Expected classicCocktails.json and signatureCocktails.json to be arrays");
  }

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "beverage_vault",
  });

  console.log("Widening cocktail id columns…");
  await widenIdColumns(connection);
  await connection.end();

  console.log("Ensuring division_slug column…");
  await classicRepo.ensureSchema();

  console.log(`Importing ${classics.length} classic cocktails…`);
  for (const c of classics) {
    await classicRepo.upsert({
      ...c,
      divisionSlug: c.divisionSlug || "classic-cocktails",
    });
  }

  console.log(`Importing ${signatures.length} signature cocktails…`);
  for (const s of signatures) {
    await signatureRepo.upsert({
      ...s,
      status: s.status || "published",
    });
  }

  await updateCategoryCounts(classics.length, signatures.length);

  const classicRows = await classicRepo.findAll();
  const signatureRows = await signatureRepo.findAll();
  console.log("Done.");
  console.log(`classic_cocktails in DB: ${classicRows.length}`);
  console.log(`signature_cocktails in DB: ${signatureRows.length}`);
  console.log("Refresh http://localhost:3000/cocktails — counts should update.");

  await getPool().end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
