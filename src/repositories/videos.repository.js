const { query } = require("../config/db");

function mapVideo(row) {
  return {
    id: row.id,
    title: row.title,
    thumbnail: row.thumbnail,
    instagramUrl: row.instagram_url,
    category: row.category,
    description: row.description || "",
    featured: Boolean(row.featured),
    status: row.status,
  };
}

async function findAll() {
  const rows = await query(
    `SELECT * FROM videos WHERE status <> 'archived' ORDER BY created_at DESC`,
  );
  return rows.map(mapVideo);
}

async function upsert(v) {
  const existing = await query("SELECT id FROM videos WHERE id = ? LIMIT 1", [v.id]);
  if (existing[0]) {
    await query(
      `UPDATE videos SET title=?, thumbnail=?, instagram_url=?, category=?, description=?, featured=?, status=?
       WHERE id=?`,
      [
        v.title,
        v.thumbnail,
        v.instagramUrl,
        v.category,
        v.description || "",
        v.featured ? 1 : 0,
        v.status || "published",
        v.id,
      ],
    );
  } else {
    await query(
      `INSERT INTO videos (id, title, thumbnail, instagram_url, category, description, featured, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        v.id,
        v.title,
        v.thumbnail,
        v.instagramUrl,
        v.category,
        v.description || "",
        v.featured ? 1 : 0,
        v.status || "published",
      ],
    );
  }
  return v;
}

async function remove(id) {
  await query("DELETE FROM videos WHERE id = ?", [id]);
}

module.exports = { findAll, upsert, remove };
