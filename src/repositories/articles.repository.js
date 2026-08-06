const { query } = require("../config/db");

let schemaReady = false;

async function ensureSchema() {
  if (schemaReady) return;
  try {
    await query(
      `ALTER TABLE articles ADD COLUMN section_key VARCHAR(64) NOT NULL DEFAULT 'home'`,
    );
  } catch (err) {
    if (!/Duplicate column/i.test(String(err?.message || err))) throw err;
  }
  try {
    await query(
      `ALTER TABLE articles ADD COLUMN subsection_slug VARCHAR(120) NULL`,
    );
  } catch (err) {
    if (!/Duplicate column/i.test(String(err?.message || err))) throw err;
  }
  try {
    await query(`ALTER TABLE articles ADD COLUMN document_url VARCHAR(500) NULL`);
  } catch (err) {
    if (!/Duplicate column/i.test(String(err?.message || err))) throw err;
  }
  try {
    await query(`ALTER TABLE articles ADD COLUMN document_name VARCHAR(255) NULL`);
  } catch (err) {
    if (!/Duplicate column/i.test(String(err?.message || err))) throw err;
  }
  try {
    await query(`ALTER TABLE articles MODIFY id VARCHAR(80) NOT NULL`);
  } catch {
    /* already wide or unsupported */
  }
  schemaReady = true;
}

function toDateOnly(value) {
  if (!value) {
    return new Date().toISOString().slice(0, 10);
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  const raw = String(value).trim();
  const m = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  if (m) return m[1];
  const parsed = new Date(raw);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

function mapArticle(row) {
  return {
    id: row.id,
    title: row.title,
    excerpt: row.excerpt,
    category: row.category,
    image: row.image,
    href: row.href,
    documentUrl: row.document_url || "",
    documentName: row.document_name || "",
    publishedAt: toDateOnly(row.published_at),
    readTime: row.read_time,
    featured: Boolean(row.featured),
    author: row.author,
    sectionKey: row.section_key || "home",
    subsectionSlug: row.subsection_slug || "",
  };
}

async function findAll() {
  await ensureSchema();
  const rows = await query(
    `SELECT * FROM articles WHERE status <> 'archived' ORDER BY published_at DESC`,
  );
  return rows.map(mapArticle);
}

async function findById(id) {
  await ensureSchema();
  const rows = await query(`SELECT * FROM articles WHERE id = ? LIMIT 1`, [id]);
  return rows[0] ? mapArticle(rows[0]) : null;
}

async function findForSection(sectionKey, subsectionSlug) {
  await ensureSchema();
  if (subsectionSlug) {
    // Exact subtype only (e.g. signature-cocktails) — not the parent page articles
    const rows = await query(
      `SELECT * FROM articles
       WHERE status = 'published'
         AND section_key = ?
         AND subsection_slug = ?
       ORDER BY published_at DESC`,
      [sectionKey, subsectionSlug],
    );
    return rows.map(mapArticle);
  }
  // Section landing only — exclude subtype-targeted articles
  const rows = await query(
    `SELECT * FROM articles
     WHERE status = 'published'
       AND section_key = ?
       AND (subsection_slug IS NULL OR subsection_slug = '')
     ORDER BY published_at DESC`,
    [sectionKey],
  );
  return rows.map(mapArticle);
}

async function upsert(article) {
  await ensureSchema();
  const existing = await query("SELECT id FROM articles WHERE id = ? LIMIT 1", [article.id]);
  const sectionKey = article.sectionKey || article.section_key || "home";
  const subsectionSlug = article.subsectionSlug || article.subsection_slug || null;
  const documentUrl = article.documentUrl || article.document_url || null;
  const documentName = article.documentName || article.document_name || null;
  const href = article.href || (article.id ? `/articles/${article.id}` : "/articles");
  const publishedAt = toDateOnly(article.publishedAt || article.published_at);
  if (existing[0]) {
    await query(
      `UPDATE articles SET title=?, excerpt=?, category=?, image=?, href=?, published_at=?,
       read_time=?, featured=?, author=?, section_key=?, subsection_slug=?,
       document_url=?, document_name=?, status='published' WHERE id=?`,
      [
        article.title,
        article.excerpt,
        article.category,
        article.image,
        href,
        publishedAt,
        article.readTime,
        article.featured ? 1 : 0,
        article.author,
        sectionKey,
        subsectionSlug || null,
        documentUrl,
        documentName,
        article.id,
      ],
    );
  } else {
    await query(
      `INSERT INTO articles (id, title, excerpt, category, image, href, published_at, read_time, featured, author, section_key, subsection_slug, document_url, document_name, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`,
      [
        article.id,
        article.title,
        article.excerpt,
        article.category,
        article.image,
        href,
        publishedAt,
        article.readTime,
        article.featured ? 1 : 0,
        article.author,
        sectionKey,
        subsectionSlug || null,
        documentUrl,
        documentName,
      ],
    );
  }
  return {
    ...article,
    href,
    publishedAt,
    sectionKey,
    subsectionSlug: subsectionSlug || "",
    documentUrl: documentUrl || "",
    documentName: documentName || "",
  };
}

async function remove(id) {
  await ensureSchema();
  await query("DELETE FROM articles WHERE id = ?", [id]);
}

module.exports = { findAll, findById, findForSection, upsert, remove, ensureSchema };
