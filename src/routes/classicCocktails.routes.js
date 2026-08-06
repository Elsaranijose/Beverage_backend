const express = require("express");
const ctrl = require("../controllers/content.controller");
const { authRequired, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", ctrl.listClassic);
router.get("/:slug", ctrl.getClassic);
router.post("/", authRequired, adminOnly, ctrl.upsertClassic);
router.put("/:id", authRequired, adminOnly, ctrl.upsertClassic);
router.delete("/:id", authRequired, adminOnly, ctrl.deleteClassic);

module.exports = router;
