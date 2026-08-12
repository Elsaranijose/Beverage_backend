require("dotenv").config();

const path = require("path");
const fs = require("fs");
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
const uploadsRoutes = require("./routes/uploads.routes");

const app = express();
const PORT = process.env.PORT || 5000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || "http://localhost:3000";

const uploadsRoot = path.join(process.cwd(), "uploads");
fs.mkdirSync(path.join(uploadsRoot, "images"), { recursive: true });
fs.mkdirSync(path.join(uploadsRoot, "documents"), { recursive: true });

/** Always allow live site + local dev, plus anything in CORS_ORIGIN env. */
const allowedOrigins = new Set(
  [
    CORS_ORIGIN,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://beveragevaults.com",
    "https://www.beveragevaults.com",
  ]
    .filter(Boolean)
    .flatMap((v) => String(v).split(",").map((s) => s.trim()).filter(Boolean)),
);

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / server-to-server (no Origin) and listed frontends
      if (!origin || allowedOrigins.has(origin)) {
        return callback(null, true);
      }
      console.warn(`[cors] blocked origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);
app.use(express.json({ limit: "2mb" }));

// Persist admin uploads on Hostinger disk (Vercel cannot write lasting files)
app.use("/images/uploads", express.static(path.join(uploadsRoot, "images")));
app.use("/documents/articles", express.static(path.join(uploadsRoot, "documents")));

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
app.use("/api/uploads", uploadsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err && err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({ message: "File is too large (max 15MB)" });
  }
  res.status(500).json({ message: "Unexpected server error" });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Beverage Vault API listening on http://127.0.0.1:${PORT}`);
});
