const { query } = require("../config/db");

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  await query(`
    CREATE TABLE IF NOT EXISTS vault_items (
      id              VARCHAR(80)    NOT NULL PRIMARY KEY,
      variety_id      CHAR(36)       NOT NULL,
      slug            VARCHAR(120)   NOT NULL,
      name            VARCHAR(200)   NOT NULL,
      description     TEXT           NULL,
      image           VARCHAR(500)   NULL,
      notes           TEXT           NULL,
      status          ENUM('published','draft','archived') NOT NULL DEFAULT 'published',
      created_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at      DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      UNIQUE KEY uq_vault_item_variety_slug (variety_id, slug),
      CONSTRAINT fk_vault_item_variety
        FOREIGN KEY (variety_id) REFERENCES varieties(id)
        ON DELETE CASCADE ON UPDATE CASCADE
    ) ENGINE=InnoDB
  `);

  const columns = [
    ["origin", "VARCHAR(255) NULL"],
    ["tagline", "VARCHAR(500) NULL"],
    ["short_story", "TEXT NULL"],
    ["ingredients_json", "TEXT NULL"],
    ["preparation", "TEXT NULL"],
    ["garnish", "TEXT NULL"],
    ["glassware", "VARCHAR(255) NULL"],
    ["experience", "TEXT NULL"],
  ];
  for (const [name, def] of columns) {
    try {
      await query(`ALTER TABLE vault_items ADD COLUMN ${name} ${def}`);
    } catch (err) {
      if (!/Duplicate column/i.test(String(err?.message || err))) throw err;
    }
  }

  // Classifications with recipes should not stay locked as Coming Soon
  try {
    await query(`UPDATE varieties SET coming_soon = 0 WHERE count > 0 AND coming_soon = 1`);
  } catch {
    /* varieties table may not exist yet in some setups */
  }

  schemaReady = true;
}

function parseIngredients(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw
      .map((row) => ({
        name: String(row?.name || "").trim(),
        quantity: String(row?.quantity || "").trim(),
      }))
      .filter((row) => row.name);
  }
  try {
    const parsed = JSON.parse(raw);
    return parseIngredients(parsed);
  } catch {
    return [];
  }
}

function mapItem(row) {
  return {
    id: row.id,
    varietyId: row.variety_id,
    slug: row.slug,
    name: row.name,
    description: row.description || "",
    image: row.image || "",
    notes: row.notes || "",
    origin: row.origin || "",
    tagline: row.tagline || "",
    shortStory: row.short_story || "",
    ingredients: parseIngredients(row.ingredients_json),
    preparation: row.preparation || "",
    garnish: row.garnish || "",
    glassware: row.glassware || "",
    experience: row.experience || "",
    status: row.status || "published",
    createdAt: row.created_at,
  };
}

async function findByVariety(varietyId) {
  await ensureSchema();
  const rows = await query(
    `SELECT * FROM vault_items WHERE variety_id = ? ORDER BY name ASC`,
    [varietyId],
  );
  return rows.map(mapItem);
}

async function findBySlugs(vaultKey, varietySlug, itemSlug) {
  await ensureSchema();
  const rows = await query(
    `SELECT vi.*,
            v.slug AS variety_slug,
            v.name AS variety_name,
            vt.\`key\` AS vault_key,
            vt.name AS vault_name
     FROM vault_items vi
     INNER JOIN varieties v ON v.id = vi.variety_id
     INNER JOIN vaults vt ON vt.id = v.vault_id
     WHERE vt.\`key\` = ?
       AND v.slug = ?
       AND vi.slug = ?
       AND vi.status = 'published'
     LIMIT 1`,
    [vaultKey, varietySlug, itemSlug],
  );
  if (!rows[0]) return null;
  return {
    ...mapItem(rows[0]),
    varietySlug: rows[0].variety_slug,
    varietyName: rows[0].variety_name,
    vaultKey: rows[0].vault_key,
    vaultName: rows[0].vault_name,
  };
}

async function findLatestByVaultKey(vaultKey, limit = 4) {
  await ensureSchema();
  const safeLimit = Math.max(1, Math.min(24, Number(limit) || 4));
  const rows = await query(
    `SELECT vi.*,
            v.slug AS variety_slug,
            v.name AS variety_name,
            vt.\`key\` AS vault_key
     FROM vault_items vi
     INNER JOIN varieties v ON v.id = vi.variety_id
     INNER JOIN vaults vt ON vt.id = v.vault_id
     WHERE vt.\`key\` = ?
       AND vi.status = 'published'
       AND v.status <> 'draft'
       AND v.status <> 'archived'
       AND v.coming_soon = 0
     ORDER BY vi.created_at DESC, vi.updated_at DESC
     LIMIT ${safeLimit}`,
    [vaultKey],
  );
  return rows.map((row) => ({
    ...mapItem(row),
    varietySlug: row.variety_slug,
    varietyName: row.variety_name,
    vaultKey: row.vault_key,
  }));
}

async function countByVariety(varietyId) {
  await ensureSchema();
  const rows = await query(
    `SELECT COUNT(*) AS count FROM vault_items WHERE variety_id = ?`,
    [varietyId],
  );
  return Number(rows[0]?.count) || 0;
}

async function upsert(item) {
  await ensureSchema();
  const status = ["published", "draft", "archived"].includes(item.status)
    ? item.status
    : "published";
  const ingredients = parseIngredients(item.ingredients);
  const ingredientsJson = JSON.stringify(ingredients);
  const existing = await query("SELECT id FROM vault_items WHERE id = ? LIMIT 1", [item.id]);
  const params = [
    item.varietyId,
    item.slug,
    item.name,
    item.description || "",
    item.image || "",
    item.notes || "",
    item.origin || "",
    item.tagline || "",
    item.shortStory || item.short_story || "",
    ingredientsJson,
    item.preparation || "",
    item.garnish || "",
    item.glassware || "",
    item.experience || "",
    status,
  ];

  if (existing[0]) {
    await query(
      `UPDATE vault_items SET
        variety_id=?, slug=?, name=?, description=?, image=?, notes=?,
        origin=?, tagline=?, short_story=?, ingredients_json=?, preparation=?,
        garnish=?, glassware=?, experience=?, status=?
       WHERE id=?`,
      [...params, item.id],
    );
  } else {
    await query(
      `INSERT INTO vault_items
        (id, variety_id, slug, name, description, image, notes,
         origin, tagline, short_story, ingredients_json, preparation,
         garnish, glassware, experience, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [item.id, ...params],
    );
  }

  const count = await countByVariety(item.varietyId);
  await query(`UPDATE varieties SET count = ? WHERE id = ?`, [count, item.varietyId]);

  // Opening a classification once it has entries (admin can lock again via Coming Soon)
  if (count > 0) {
    await query(`UPDATE varieties SET coming_soon = 0 WHERE id = ?`, [item.varietyId]);
  }

  return {
    ...item,
    status,
    varietyId: item.varietyId,
    ingredients,
    shortStory: item.shortStory || item.short_story || "",
  };
}

async function remove(id) {
  await ensureSchema();
  const rows = await query(`SELECT variety_id FROM vault_items WHERE id = ? LIMIT 1`, [id]);
  await query(`DELETE FROM vault_items WHERE id = ?`, [id]);
  if (rows[0]?.variety_id) {
    const count = await countByVariety(rows[0].variety_id);
    await query(`UPDATE varieties SET count = ? WHERE id = ?`, [count, rows[0].variety_id]);
  }
}

module.exports = {
  ensureSchema,
  findByVariety,
  findBySlugs,
  findLatestByVaultKey,
  countByVariety,
  upsert,
  remove,
};
