const express = require("express");
const ctrl = require("../controllers/users.controller");
const { authRequired, adminOnly } = require("../middleware/auth");

const router = express.Router();

router.get("/", authRequired, adminOnly, ctrl.listMembers);
router.put("/:id/status", authRequired, adminOnly, ctrl.updateMemberStatus);
router.delete("/:id", authRequired, adminOnly, ctrl.deleteMember);

module.exports = router;
