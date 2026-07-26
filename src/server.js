require("dotenv").config();

const express = require("express");
const cors = require("cors");
const healthRoutes = require("./routes/health.routes");

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json());

app.use("/api/health", healthRoutes);

app.get("/", (_req, res) => {
  res.json({
    name: "Beverage Vault API",
    status: "scaffold",
    message: "Backend repo ready. Build APIs next.",
  });
});

app.listen(PORT, () => {
  console.log(`Beverage Vault API listening on http://localhost:${PORT}`);
});
