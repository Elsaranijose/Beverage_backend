const vaultRepo = require("../repositories/vault.repository");
const vaultItemsRepo = require("../repositories/vaultItems.repository");
const homepageSectionsRepo = require("../repositories/homepageSections.repository");
const articlesRepo = require("../repositories/articles.repository");
const classicRepo = require("../repositories/classicCocktails.repository");
const signatureRepo = require("../repositories/signatureCocktails.repository");
const videosRepo = require("../repositories/videos.repository");
const categoriesRepo = require("../repositories/cocktailCategories.repository");

function wrap(fn) {
  return async (req, res) => {
    try {
      await fn(req, res);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: err.message || "Server error" });
    }
  };
}

module.exports = {
  // Vaults
  listVaults: wrap(async (_req, res) => res.json(await vaultRepo.findAllVaults())),
  getVault: wrap(async (req, res) => {
    const vault = await vaultRepo.findVaultByKey(req.params.key);
    if (!vault) return res.status(404).json({ message: "Vault not found" });
    return res.json(vault);
  }),
  updateVault: wrap(async (req, res) => {
    const saved = await vaultRepo.updateSection(req.params.key, req.body || {});
    return res.json(saved);
  }),
  upsertVariety: wrap(async (req, res) => {
    const saved = await vaultRepo.upsertVariety(req.params.key, req.body);
    return res.json(saved);
  }),
  deleteVariety: wrap(async (req, res) => {
    await vaultRepo.deleteVariety(req.params.varietyId);
    return res.status(204).send();
  }),
  listVaultItems: wrap(async (req, res) => {
    const items = await vaultItemsRepo.findByVariety(req.params.varietyId);
    return res.json(items);
  }),
  listVaultFeaturedItems: wrap(async (req, res) => {
    const limit = Number(req.query.limit) || 4;
    const items = await vaultItemsRepo.findLatestByVaultKey(req.params.key, limit);
    return res.json(items);
  }),
  getVaultItemBySlug: wrap(async (req, res) => {
    const item = await vaultItemsRepo.findBySlugs(
      req.params.key,
      req.params.varietySlug,
      req.params.itemSlug,
    );
    if (!item) return res.status(404).json({ message: "Entry not found" });
    return res.json(item);
  }),
  upsertVaultItem: wrap(async (req, res) => {
    const body = {
      ...req.body,
      varietyId: req.body.varietyId || req.params.varietyId,
    };
    const saved = await vaultItemsRepo.upsert(body);
    return res.json(saved);
  }),
  deleteVaultItem: wrap(async (req, res) => {
    await vaultItemsRepo.remove(req.params.itemId);
    return res.status(204).send();
  }),

  // Homepage / landing heroes
  getHomepageSection: wrap(async (req, res) => {
    const section = await homepageSectionsRepo.findByKey(req.params.key);
    if (!section) return res.status(404).json({ message: "Section not found" });
    return res.json(section);
  }),
  upsertHomepageSection: wrap(async (req, res) => {
    const saved = await homepageSectionsRepo.upsert(req.params.key, req.body || {});
    return res.json(saved);
  }),

  // Articles
  listArticles: wrap(async (req, res) => {
    const sectionKey = typeof req.query.section === "string" ? req.query.section.trim() : "";
    const subsectionSlug =
      typeof req.query.subsection === "string" ? req.query.subsection.trim() : "";
    if (sectionKey) {
      return res.json(await articlesRepo.findForSection(sectionKey, subsectionSlug || undefined));
    }
    return res.json(await articlesRepo.findAll());
  }),
  getArticle: wrap(async (req, res) => {
    const article = await articlesRepo.findById(req.params.id);
    if (!article) return res.status(404).json({ message: "Article not found" });
    return res.json(article);
  }),
  upsertArticle: wrap(async (req, res) => {
    const body = { ...req.body };
    if (req.params?.id) body.id = req.params.id;
    return res.json(await articlesRepo.upsert(body));
  }),
  deleteArticle: wrap(async (req, res) => {
    await articlesRepo.remove(req.params.id);
    return res.status(204).send();
  }),

  // Classic (optional ?division=classic-cocktails|cocktail-basics|…)
  listClassic: wrap(async (req, res) => {
    const division = typeof req.query.division === "string" ? req.query.division : undefined;
    return res.json(await classicRepo.findAll(division));
  }),
  getClassic: wrap(async (req, res) => {
    const item = await classicRepo.findBySlug(req.params.slug);
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json(item);
  }),
  upsertClassic: wrap(async (req, res) => {
    const saved = await classicRepo.upsert(req.body);
    try {
      const counts = await classicRepo.countByDivision();
      const slug = saved.divisionSlug || "classic-cocktails";
      await categoriesRepo.updateCount(slug, counts[slug] || 0);
    } catch {
      /* count sync is best-effort */
    }
    return res.json(saved);
  }),
  deleteClassic: wrap(async (req, res) => {
    const before = await classicRepo.findAll();
    const item = before.find((c) => c.id === req.params.id);
    await classicRepo.remove(req.params.id);
    if (item?.divisionSlug) {
      try {
        const counts = await classicRepo.countByDivision();
        await categoriesRepo.updateCount(
          item.divisionSlug,
          counts[item.divisionSlug] || 0,
        );
      } catch {
        /* ignore */
      }
    }
    return res.status(204).send();
  }),

  // Signature
  listSignature: wrap(async (_req, res) => res.json(await signatureRepo.findAll())),
  getSignature: wrap(async (req, res) => {
    const item = await signatureRepo.findBySlug(req.params.slug);
    if (!item) return res.status(404).json({ message: "Not found" });
    return res.json(item);
  }),
  upsertSignature: wrap(async (req, res) => res.json(await signatureRepo.upsert(req.body))),
  deleteSignature: wrap(async (req, res) => {
    await signatureRepo.remove(req.params.id);
    return res.status(204).send();
  }),

  // Videos
  listVideos: wrap(async (_req, res) => res.json(await videosRepo.findAll())),
  upsertVideo: wrap(async (req, res) => res.json(await videosRepo.upsert(req.body))),
  deleteVideo: wrap(async (req, res) => {
    await videosRepo.remove(req.params.id);
    return res.status(204).send();
  }),

  // Cocktail categories
  listCocktailCategories: wrap(async (_req, res) =>
    res.json(await categoriesRepo.findAll()),
  ),
  upsertCocktailCategory: wrap(async (req, res) =>
    res.json(await categoriesRepo.upsert(req.body)),
  ),
  deleteCocktailCategory: wrap(async (req, res) => {
    await categoriesRepo.remove(req.params.id);
    return res.status(204).send();
  }),
};
