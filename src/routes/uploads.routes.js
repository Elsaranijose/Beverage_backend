const fs = require("fs");
const path = require("path");
const express = require("express");
const multer = require("multer");
const { randomBytes } = require("crypto");
const { authRequired, adminOnly } = require("../middleware/auth");

const router = express.Router();

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_DOC_BYTES = 15 * 1024 * 1024;

const IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const DOC_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/markdown",
  "text/x-markdown",
  "text/plain",
]);
const DOC_EXTS = new Set(["pdf", "doc", "docx", "md", "txt"]);

const ROOT = path.join(process.cwd(), "uploads");
const IMAGE_DIR = path.join(ROOT, "images");
const DOC_DIR = path.join(ROOT, "documents");

function ensureDirs() {
  for (const dir of [IMAGE_DIR, DOC_DIR]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function imageExt(type, originalName) {
  if (type === "image/jpeg") return "jpg";
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  if (type === "image/gif") return "gif";
  const fromName = path.extname(originalName || "").replace(".", "").toLowerCase();
  return fromName || "jpg";
}

function docExt(type, originalName) {
  const fromName = path.extname(originalName || "").replace(".", "").toLowerCase();
  if (DOC_EXTS.has(fromName)) return fromName;
  if (type === "application/pdf") return "pdf";
  if (type === "application/msword") return "doc";
  if (type.includes("wordprocessingml")) return "docx";
  if (type.includes("markdown")) return "md";
  return "txt";
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_DOC_BYTES },
});

/** Live: https://api.beveragevaults.com — so Vercel can load files without private-IP rewrites. */
function publicBaseUrl(req) {
  const configured = (
    process.env.PUBLIC_API_URL ||
    process.env.API_PUBLIC_URL ||
    ""
  ).trim().replace(/\/$/, "");
  if (configured) return configured;
  const proto = String(req.headers["x-forwarded-proto"] || req.protocol || "http");
  const host = String(req.headers["x-forwarded-host"] || req.headers.host || "").trim();
  if (host && !host.includes("localhost") && !host.startsWith("127.")) {
    return `${proto}://${host}`;
  }
  return "";
}

function mediaUrl(req, pathname) {
  const base = publicBaseUrl(req);
  return base ? `${base}${pathname}` : pathname;
}

router.post("/", authRequired, adminOnly, upload.single("file"), (req, res) => {
  try {
    ensureDirs();
    const kind = String(req.query.kind || "image");
    const file = req.file;

    if (!file) {
      return res.status(400).json({ message: "No file provided" });
    }

    if (kind === "document") {
      const ext = docExt(file.mimetype || "", file.originalname);
      const typeOk = DOC_TYPES.has(file.mimetype) || DOC_EXTS.has(ext);
      if (!typeOk) {
        return res.status(400).json({
          message: "Only PDF, DOC, DOCX, or MD files are allowed",
        });
      }
      if (file.size > MAX_DOC_BYTES) {
        return res.status(400).json({ message: "File must be 15MB or smaller" });
      }

      const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
      fs.writeFileSync(path.join(DOC_DIR, filename), file.buffer);
      const pathname = `/documents/articles/${filename}`;

      return res.json({
        ok: true,
        url: mediaUrl(req, pathname),
        fileName: file.originalname,
      });
    }

    if (!IMAGE_TYPES.has(file.mimetype)) {
      return res.status(400).json({
        message: "Only JPG, PNG, WEBP, or GIF images are allowed",
      });
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return res.status(400).json({ message: "Image must be 5MB or smaller" });
    }

    const ext = imageExt(file.mimetype, file.originalname);
    const filename = `${Date.now()}-${randomBytes(4).toString("hex")}.${ext}`;
    fs.writeFileSync(path.join(IMAGE_DIR, filename), file.buffer);
    const pathname = `/images/uploads/${filename}`;

    return res.json({
      ok: true,
      url: mediaUrl(req, pathname),
    });
  } catch (err) {
    console.error("[upload]", err);
    return res.status(500).json({ message: "Upload failed" });
  }
});

router.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ message: "File is too large (max 15MB)" });
    }
    return res.status(400).json({ message: err.message });
  }
  console.error("[upload]", err);
  return res.status(500).json({ message: "Upload failed" });
});

module.exports = router;
