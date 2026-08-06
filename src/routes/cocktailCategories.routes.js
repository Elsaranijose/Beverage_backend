const express = require("express");
const ctrl = require("../controllers/content.controller");
const { authRequired, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", ctrl.listCocktailCategories);
router.post("/", authRequired, adminOnly, ctrl.upsertCocktailCategory);
router.put("/:id", authRequired, adminOnly, ctrl.upsertCocktailCategory);
router.delete("/:id", authRequired, adminOnly, ctrl.deleteCocktailCategory);

module.exports = router;
