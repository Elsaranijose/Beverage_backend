const express = require("express");
const ctrl = require("../controllers/content.controller");
const { authRequired, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", ctrl.listVideos);
router.post("/", authRequired, adminOnly, ctrl.upsertVideo);
router.delete("/:id", authRequired, adminOnly, ctrl.deleteVideo);

module.exports = router;
