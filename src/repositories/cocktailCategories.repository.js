const { query } = require("../config/db");
const { randomUUID } = require("crypto");

function mapRow(r) {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description || "",
    image: r.image || "",
    href: r.href || "#",
    count: r.count || 0,
    comingSoon: Boolean(r.coming_soon ?? r.comingSoon),
    sortOrder: r.sort_order ?? r.sortOrder ?? 0,
  };
}

async function findAll() {
  const rows = await query(
    `SELECT id, slug, name, description, image, href, count, coming_soon, sort_order
     FROM cocktail_categories ORDER BY sort_order ASC, name ASC`,
  );
  return rows.map(mapRow);
}

async function upsert(cat) {
  const id = cat.id || randomUUID();
  const existing = await query("SELECT id FROM cocktail_categories WHERE id = ? LIMIT 1", [id]);
  const comingSoon = cat.comingSoon ? 1 : 0;
  const sortOrder = Number(cat.sortOrder) || 0;

  if (existing[0]) {
    await query(
      `UPDATE cocktail_categories
       SET slug=?, name=?, description=?, image=?, href=?, count=?, coming_soon=?, sort_order=?
       WHERE id=?`,
      [
        cat.slug,
        cat.name,
        cat.description || "",
        cat.image || "",
        cat.href || "#",
        Number(cat.count) || 0,
        comingSoon,
        sortOrder,
        id,
      ],
    );
  } else {
    await query(
      `INSERT INTO cocktail_categories
        (id, slug, name, description, image, href, count, coming_soon, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        cat.slug,
        cat.name,
        cat.description || "",
        cat.image || "",
        cat.href || "#",
        Number(cat.count) || 0,
        comingSoon,
        sortOrder,
      ],
    );
  }

  const rows = await query("SELECT * FROM cocktail_categories WHERE id = ? LIMIT 1", [id]);
  return mapRow(rows[0]);
}

async function remove(id) {
  await query("DELETE FROM cocktail_categories WHERE id = ?", [id]);
}

async function updateCount(slug, count) {
  await query(`UPDATE cocktail_categories SET count = ? WHERE slug = ?`, [
    Number(count) || 0,
    slug,
  ]);
}

module.exports = { findAll, upsert, remove, updateCount };
