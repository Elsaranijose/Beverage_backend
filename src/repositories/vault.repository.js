const { query } = require("../config/db");

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  const columns = [
    ["subtitle", "VARCHAR(500) NULL"],
    ["eyebrow", "VARCHAR(255) NULL"],
    ["headline", "VARCHAR(500) NULL"],
  ];
  for (const [name, def] of columns) {
    try {
      await query(`ALTER TABLE vaults ADD COLUMN ${name} ${def}`);
    } catch (err) {
      if (!/Duplicate column/i.test(String(err?.message || err))) throw err;
    }
  }

  // One-time defaults for existing rows (admin can overwrite)
  const defaults = [
    ["spirits", "Learn every spirit from beginner to expert.", "The Collection", "Spirits from foundation to craft"],
    ["wine", "Regions, grapes, and glassware.", "The Collection", "Regions, grapes, and glass"],
    ["beer", "Styles, brewing, and serve culture.", "The Collection", "Styles, brewing, and serve culture"],
    ["coffee", "Origin, roast, and ritual.", "The Collection", "Origin, roast, and ritual"],
    ["tea", "Leaves, steep, and tradition.", "The Collection", "Leaves, steep, and tradition"],
    ["mocktails", "Zero-proof builds with intention.", "The Collection", "Zero-proof builds with intention"],
    ["ingredients", "The pantry behind every serve.", "The Collection", "The pantry behind every serve"],
  ];
  for (const [key, subtitle, eyebrow, headline] of defaults) {
    await query(
      `UPDATE vaults
       SET subtitle = COALESCE(NULLIF(TRIM(subtitle), ''), ?),
           eyebrow = COALESCE(NULLIF(TRIM(eyebrow), ''), ?),
           headline = COALESCE(NULLIF(TRIM(headline), ''), ?)
       WHERE \`key\` = ?`,
      [subtitle, eyebrow, headline, key],
    );
  }

  schemaReady = true;
}

function mapVault(v, varieties) {
  return {
    key: v.key,
    name: v.name,
    description: v.description || "",
    heroImage: v.heroImage || "",
    subtitle: v.subtitle || "",
    eyebrow: v.eyebrow || "",
    headline: v.headline || "",
    categories: varieties
      .filter((c) => c.vaultId === v.id)
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        description: c.description || "",
        image: c.image || "",
        count: c.count,
        comingSoon: Boolean(c.comingSoon),
        status: c.status,
      })),
  };
}

async function findAllVaults() {
  await ensureSchema();
  const vaults = await query(
    `SELECT id, \`key\`, name, description, hero_image AS heroImage,
            subtitle, eyebrow, headline,
            sort_order AS sortOrder, status
     FROM vaults WHERE status <> 'archived' ORDER BY sort_order ASC`,
  );
  const varieties = await query(
    `SELECT id, vault_id AS vaultId, slug, name, description, image, count, coming_soon AS comingSoon, status, sort_order AS sortOrder
     FROM varieties WHERE status <> 'archived' ORDER BY sort_order ASC`,
  );

  return vaults.map((v) => mapVault(v, varieties));
}

async function findVaultByKey(key) {
  const all = await findAllVaults();
  return all.find((v) => v.key === key) || null;
}

async function upsertVariety(vaultKey, variety) {
  await ensureSchema();
  const vaults = await query("SELECT id FROM vaults WHERE `key` = ? LIMIT 1", [vaultKey]);
  const vault = vaults[0];
  if (!vault) throw new Error("Vault not found");

  const existing = await query("SELECT id FROM varieties WHERE id = ? LIMIT 1", [variety.id]);
  if (existing[0]) {
    await query(
      `UPDATE varieties SET slug=?, name=?, description=?, image=?, coming_soon=?, status=?
       WHERE id=?`,
      [
        variety.slug,
        variety.name,
        variety.description || "",
        variety.image || "",
        variety.comingSoon ? 1 : 0,
        variety.status || "published",
        variety.id,
      ],
    );
  } else {
    await query(
      `INSERT INTO varieties (id, vault_id, slug, name, description, image, count, coming_soon, status)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)`,
      [
        variety.id,
        vault.id,
        variety.slug,
        variety.name,
        variety.description || "",
        variety.image || "",
        variety.comingSoon ? 1 : 0,
        variety.status || "published",
      ],
    );
  }
  return variety;
}

async function deleteVariety(varietyId) {
  await query("DELETE FROM varieties WHERE id = ?", [varietyId]);
}

async function updateSection(vaultKey, patch) {
  await ensureSchema();
  const vaults = await query("SELECT id FROM vaults WHERE `key` = ? LIMIT 1", [vaultKey]);
  if (!vaults[0]) throw new Error("Vault not found");

  const current = await findVaultByKey(vaultKey);
  const name = patch.name !== undefined ? patch.name : current?.name || vaultKey;
  const description =
    patch.description !== undefined ? patch.description : current?.description || "";
  const heroImage =
    patch.heroImage !== undefined ? patch.heroImage : current?.heroImage || "";
  const subtitle = patch.subtitle !== undefined ? patch.subtitle : current?.subtitle || "";
  const eyebrow = patch.eyebrow !== undefined ? patch.eyebrow : current?.eyebrow || "";
  const headline = patch.headline !== undefined ? patch.headline : current?.headline || "";

  await query(
    `UPDATE vaults SET name=?, description=?, hero_image=?, subtitle=?, eyebrow=?, headline=?
     WHERE \`key\`=?`,
    [name, description, heroImage, subtitle, eyebrow, headline, vaultKey],
  );

  return findVaultByKey(vaultKey);
}

module.exports = {
  findAllVaults,
  findVaultByKey,
  upsertVariety,
  deleteVariety,
  updateSection,
};
