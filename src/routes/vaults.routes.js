const express = require("express");
const ctrl = require("../controllers/content.controller");
const { authRequired, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", ctrl.listVaults);
router.get("/:key/featured-items", ctrl.listVaultFeaturedItems);
router.get(
  "/:key/by-variety/:varietySlug/items/:itemSlug",
  ctrl.getVaultItemBySlug,
);
router.get("/:key", ctrl.getVault);
router.put("/:key", authRequired, adminOnly, ctrl.updateVault);
router.post("/:key/varieties", authRequired, adminOnly, ctrl.upsertVariety);
router.delete("/:key/varieties/:varietyId", authRequired, adminOnly, ctrl.deleteVariety);

router.get("/:key/varieties/:varietyId/items", ctrl.listVaultItems);
router.post("/:key/varieties/:varietyId/items", authRequired, adminOnly, ctrl.upsertVaultItem);
router.put(
  "/:key/varieties/:varietyId/items/:itemId",
  authRequired,
  adminOnly,
  ctrl.upsertVaultItem,
);
router.delete(
  "/:key/varieties/:varietyId/items/:itemId",
  authRequired,
  adminOnly,
  ctrl.deleteVaultItem,
);

module.exports = router;
