const express = require("express");
const { query } = require("../config/db");

const router = express.Router();

router.get("/", async (_req, res) => {
  const payload = {
    ok: true,
    service: "beverage-vault-api",
    timestamp: new Date().toISOString(),
    database: "unknown",
  };

  try {
    await query("SELECT 1 AS ok");
    payload.database = "connected";
    return res.json(payload);
  } catch (err) {
    console.error("[health] database check failed:", err.message || err);
    payload.ok = false;
    payload.database = "error";
    payload.message = err.message || "Database connection failed";
    return res.status(503).json(payload);
  }
});

module.exports = router;
