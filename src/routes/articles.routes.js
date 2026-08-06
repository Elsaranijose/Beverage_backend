const express = require("express");
const ctrl = require("../controllers/content.controller");
const { authRequired, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", ctrl.listArticles);
router.get("/:id", ctrl.getArticle);
router.post("/", authRequired, adminOnly, ctrl.upsertArticle);
router.put("/:id", authRequired, adminOnly, ctrl.upsertArticle);
router.delete("/:id", authRequired, adminOnly, ctrl.deleteArticle);

module.exports = router;
