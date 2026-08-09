const { query } = require("../config/db");

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  try {
    await query(
      `ALTER TABLE classic_cocktails
       ADD COLUMN division_slug VARCHAR(120) NOT NULL DEFAULT 'classic-cocktails'`,
    );
  } catch (err) {
    const msg = String(err?.message || err);
    if (!/Duplicate column/i.test(msg)) throw err;
  }
  try {
    await query(
      `CREATE INDEX idx_classic_division ON classic_cocktails (division_slug)`,
    );
  } catch (err) {
    const msg = String(err?.message || err);
    if (!/Duplicate|exists/i.test(msg)) throw err;
  }
  schemaReady = true;
}

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapClassic(row) {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    category: "classic",
    divisionSlug: row.division_slug || "classic-cocktails",
    drinkStyle: row.drink_style || undefined,
    description: row.description || "",
    history: row.history || "",
    origin: row.origin || "",
    interestingFacts: parseJson(row.interesting_facts, []),
    difficulty: row.difficulty,
    preparationTime: row.preparation_time || "",
    alcoholPercentage: Number(row.alcohol_percentage) || 0,
    spirit: row.spirit || "",
    glass: row.glass || "",
    garnish: row.garnish || "",
    notes: row.notes || undefined,
    garnishImage: row.garnish_image || undefined,
    glassImage: row.glass_image || undefined,
    heroImage: row.hero_image || "",
    thumbnail: row.thumbnail || "",
    gallery: parseJson(row.gallery, []),
    ingredients: parseJson(row.ingredients, []),
    preparationSteps: parseJson(row.preparation_steps, []),
    foodPairing: parseJson(row.food_pairing, []),
    relatedCocktails: parseJson(row.related_cocktails, []),
    relatedArticles: parseJson(row.related_articles, []),
    relatedVideos: parseJson(row.related_videos, []),
    popularity: row.popularity,
    createdAt: row.created_at,
    featured: Boolean(row.featured),
    status: row.status || "published",
  };
}

async function findAll(divisionSlug) {
  await ensureSchema();
  if (divisionSlug) {
    const rows = await query(
      `SELECT * FROM classic_cocktails WHERE division_slug = ? ORDER BY name ASC`,
      [divisionSlug],
    );
    return rows.map(mapClassic);
  }
  const rows = await query(`SELECT * FROM classic_cocktails ORDER BY name ASC`);
  return rows.map(mapClassic);
}

async function findBySlug(slug) {
  await ensureSchema();
  const rows = await query(
    `SELECT * FROM classic_cocktails WHERE slug = ? AND status = 'published' LIMIT 1`,
    [slug],
  );
  return rows[0] ? mapClassic(rows[0]) : null;
}

async function countByDivision() {
  await ensureSchema();
  const rows = await query(
    `SELECT division_slug AS slug, COUNT(*) AS count
     FROM classic_cocktails
     WHERE status = 'published'
     GROUP BY division_slug`,
  );
  const out = {};
  for (const row of rows) {
    out[row.slug || "classic-cocktails"] = Number(row.count) || 0;
  }
  return out;
}

async function upsert(c) {
  await ensureSchema();
  const existing = await query("SELECT id FROM classic_cocktails WHERE id = ? LIMIT 1", [c.id]);
  const status = ["published", "draft", "archived"].includes(c.status) ? c.status : "published";
  const divisionSlug = c.divisionSlug || c.division_slug || "classic-cocktails";
  const params = [
    c.slug,
    c.name,
    c.drinkStyle || null,
    c.description || "",
    c.history || "",
    c.origin || "",
    JSON.stringify(c.interestingFacts || []),
    c.difficulty || "Easy",
    c.preparationTime || "",
    c.alcoholPercentage || 0,
    c.spirit || "",
    c.glass || "",
    c.garnish || "",
    c.notes || null,
    c.garnishImage || null,
    c.glassImage || null,
    c.heroImage || "",
    c.thumbnail || "",
    JSON.stringify(c.gallery || []),
    JSON.stringify(c.ingredients || []),
    JSON.stringify(c.preparationSteps || []),
    JSON.stringify(c.foodPairing || []),
    JSON.stringify(c.relatedCocktails || []),
    JSON.stringify(c.relatedArticles || []),
    JSON.stringify(c.relatedVideos || []),
    c.popularity || 50,
    c.featured ? 1 : 0,
    status,
    divisionSlug,
  ];

  if (existing[0]) {
    await query(
      `UPDATE classic_cocktails SET
        slug=?, name=?, drink_style=?, description=?, history=?, origin=?, interesting_facts=?,
        difficulty=?, preparation_time=?, alcohol_percentage=?, spirit=?, glass=?, garnish=?, notes=?,
        garnish_image=?, glass_image=?, hero_image=?, thumbnail=?, gallery=?, ingredients=?,
        preparation_steps=?, food_pairing=?, related_cocktails=?, related_articles=?, related_videos=?,
        popularity=?, featured=?, status=?, division_slug=?
       WHERE id=?`,
      [...params, c.id],
    );
  } else {
    await query(
      `INSERT INTO classic_cocktails (
        id, slug, name, drink_style, description, history, origin, interesting_facts,
        difficulty, preparation_time, alcohol_percentage, spirit, glass, garnish, notes,
        garnish_image, glass_image, hero_image, thumbnail, gallery, ingredients,
        preparation_steps, food_pairing, related_cocktails, related_articles, related_videos,
        popularity, featured, status, division_slug
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, ...params],
    );
  }
  return { ...c, status, divisionSlug };
}

async function remove(id) {
  await ensureSchema();
  await query("DELETE FROM classic_cocktails WHERE id = ?", [id]);
}

module.exports = { findAll, findBySlug, countByDivision, upsert, remove, ensureSchema };
