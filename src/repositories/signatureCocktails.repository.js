const { query } = require("../config/db");

function parseJson(value, fallback) {
  if (value == null) return fallback;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapSig(row) {
  return {
    id: row.id,
    slug: row.slug,
    category: "Signature Cocktails",
    title: row.title,
    tagline: row.tagline || "",
    shortStory: row.short_story || "",
    story: row.story || "",
    heroImage: row.hero_image || "",
    gallery: parseJson(row.gallery, []),
    quickInfo: parseJson(row.quick_info, {}),
    ingredients: parseJson(row.ingredients, []),
    equipment: parseJson(row.equipment, []),
    preparationSteps: parseJson(row.preparation_steps, []),
    flavorProfile: parseJson(row.flavor_profile, {}),
    glassware: parseJson(row.glassware, {}),
    garnish: parseJson(row.garnish, {}),
    experience: parseJson(row.experience, {}),
    bartenderNotes: parseJson(row.bartender_notes, []),
    interestingFacts: parseJson(row.interesting_facts, []),
    relatedCocktails: parseJson(row.related_cocktails, []),
    featured: Boolean(row.featured),
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function findAll() {
  const rows = await query(
    `SELECT * FROM signature_cocktails ORDER BY title ASC`,
  );
  return rows.map(mapSig);
}

async function findBySlug(slug) {
  const rows = await query(
    `SELECT * FROM signature_cocktails WHERE slug = ? AND status <> 'archived' LIMIT 1`,
    [slug],
  );
  return rows[0] ? mapSig(rows[0]) : null;
}

async function upsert(c) {
  const existing = await query("SELECT id FROM signature_cocktails WHERE id = ? LIMIT 1", [c.id]);
  const params = [
    c.slug,
    c.title,
    c.tagline || "",
    c.shortStory || "",
    c.story || "",
    c.heroImage || "",
    JSON.stringify(c.gallery || []),
    JSON.stringify(c.quickInfo || {}),
    JSON.stringify(c.ingredients || []),
    JSON.stringify(c.equipment || []),
    JSON.stringify(c.preparationSteps || []),
    JSON.stringify(c.flavorProfile || {}),
    JSON.stringify(c.glassware || {}),
    JSON.stringify(c.garnish || {}),
    JSON.stringify(c.experience || {}),
    JSON.stringify(c.bartenderNotes || []),
    JSON.stringify(c.interestingFacts || []),
    JSON.stringify(c.relatedCocktails || []),
    c.featured ? 1 : 0,
    c.status || "published",
  ];

  if (existing[0]) {
    await query(
      `UPDATE signature_cocktails SET
        slug=?, title=?, tagline=?, short_story=?, story=?, hero_image=?, gallery=?, quick_info=?,
        ingredients=?, equipment=?, preparation_steps=?, flavor_profile=?, glassware=?, garnish=?,
        experience=?, bartender_notes=?, interesting_facts=?, related_cocktails=?, featured=?, status=?
       WHERE id=?`,
      [...params, c.id],
    );
  } else {
    await query(
      `INSERT INTO signature_cocktails (
        id, slug, title, tagline, short_story, story, hero_image, gallery, quick_info,
        ingredients, equipment, preparation_steps, flavor_profile, glassware, garnish,
        experience, bartender_notes, interesting_facts, related_cocktails, featured, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, ...params],
    );
  }
  return c;
}

async function remove(id) {
  await query("DELETE FROM signature_cocktails WHERE id = ?", [id]);
}

module.exports = { findAll, findBySlug, upsert, remove };
