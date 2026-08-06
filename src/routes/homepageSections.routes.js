const express = require("express");
const ctrl = require("../controllers/content.controller");
const { authRequired, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/:key", ctrl.getHomepageSection);
router.put("/:key", authRequired, adminOnly, ctrl.upsertHomepageSection);

module.exports = router;
