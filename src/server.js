require("dotenv").config();

const express = require("express");
const cors = require("cors");

const healthRoutes = require("./routes/health.routes");
const authRoutes = require("./routes/auth.routes");
const vaultRoutes = require("./routes/vaults.routes");
const articlesRoutes = require("./routes/articles.routes");
const classicRoutes = require("./routes/classicCocktails.routes");
const signatureRoutes = require("./routes/signatureCocktails.routes");
const videosRoutes = require("./routes/videos.routes");
const cocktailCategoriesRoutes = require("./routes/cocktailCategories.routes");

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

const allowedOrigins = new Set(
  [CORS_ORIGIN, "http://localhost:3000", "http://127.0.0.1:3000"]
    .filter(Boolean)
    .flatMap((v) => String(v).split(",").map((s) => s.trim())),
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / tools with no Origin header, plus local Next.js hosts
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));

app.get("/", (_req, res) => {
  res.json({
    name: "Beverage Vault API",
    status: "ok",
    docs: "See README.md and src/migrations for MySQL setup",
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", require("./routes/users.routes"));
app.use("/api/vaults", vaultRoutes);
app.use("/api/homepage-sections", require("./routes/homepageSections.routes"));
app.use("/api/articles", articlesRoutes);
app.use("/api/classic-cocktails", classicRoutes);
app.use("/api/signature-cocktails", signatureRoutes);
app.use("/api/videos", videosRoutes);
app.use("/api/cocktail-categories", cocktailCategoriesRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Unexpected server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Beverage Vault API listening on http://127.0.0.1:${PORT}`);
});
