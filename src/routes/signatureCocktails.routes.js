const express = require("express");
const ctrl = require("../controllers/content.controller");
const { authRequired, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", ctrl.listSignature);
router.get("/:slug", ctrl.getSignature);
router.post("/", authRequired, adminOnly, ctrl.upsertSignature);
router.put("/:id", authRequired, adminOnly, ctrl.upsertSignature);
router.delete("/:id", authRequired, adminOnly, ctrl.deleteSignature);

module.exports = router;
