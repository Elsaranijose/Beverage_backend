const { query } = require("../config/db");

const DEFAULT_COCKTAILS = {
  heroImage: "/images/cocktails/hero-vault.png",
  subtitle: "Explore classic and modern cocktails from around the world.",
  eyebrow: "The Collection",
  headline: "A library built for mastery",
  body: "From foundational builds to timeless classics, explore categories designed to deepen your understanding of balance, garnish, and glass.",
};

function mapRow(row) {
  if (!row) return null;
  let payload = row.payload;
  if (typeof payload === "string") {
    try {
      payload = JSON.parse(payload);
    } catch {
      payload = {};
    }
  }
  return {
    key: row.section_key,
    title: row.title || "",
    payload: payload || {},
    status: row.status || "published",
  };
}

async function findByKey(sectionKey) {
  const rows = await query(
    `SELECT section_key, title, payload, status FROM homepage_sections WHERE section_key = ? LIMIT 1`,
    [sectionKey],
  );
  const mapped = mapRow(rows[0]);
  if (mapped) return mapped;

  if (sectionKey === "cocktails") {
    return {
      key: "cocktails",
      title: "Cocktails",
      payload: { ...DEFAULT_COCKTAILS },
      status: "published",
    };
  }
  return null;
}

async function upsert(sectionKey, data) {
  const existing = await query(
    `SELECT id FROM homepage_sections WHERE section_key = ? LIMIT 1`,
    [sectionKey],
  );
  const title = data.title || sectionKey;
  const payload = data.payload || {};
  const status = data.status || "published";
  const payloadJson = JSON.stringify(payload);

  if (existing[0]) {
    await query(
      `UPDATE homepage_sections SET title=?, payload=?, status=? WHERE section_key=?`,
      [title, payloadJson, status, sectionKey],
    );
  } else {
    const id = `hs-${sectionKey}`;
    await query(
      `INSERT INTO homepage_sections (id, section_key, title, payload, sort_order, status)
       VALUES (?, ?, ?, ?, 0, ?)`,
      [id, sectionKey, title, payloadJson, status],
    );
  }

  return findByKey(sectionKey);
}

module.exports = { findByKey, upsert, DEFAULT_COCKTAILS };
