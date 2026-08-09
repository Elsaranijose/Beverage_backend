const express = require("express");
const ctrl = require("../controllers/auth.controller");
const { authRequired } = require("../middleware/auth");

const router = express.Router();

router.post("/login", ctrl.login);
router.post("/register", ctrl.register);
router.get("/me", authRequired, ctrl.me);
router.put("/me/password", authRequired, ctrl.changePassword);

module.exports = router;
