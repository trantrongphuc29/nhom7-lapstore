const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { slugify } = require("../utils/slug");

const imagesRootDir = path.resolve(process.cwd(), "images");
if (!fs.existsSync(imagesRootDir)) fs.mkdirSync(imagesRootDir, { recursive: true });

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) return cb(new Error("Only image files are allowed"));
    cb(null, true);
  },
});

async function processUploadedImages(files = [], folderName = "") {
  const folderSlug = slugify(folderName) || "san-pham-chua-dat-ten";
  const targetDir = path.resolve(imagesRootDir, "laptop", folderSlug);
  if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
  const saved = [];
  for (const file of files) {
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const fullPath = path.join(targetDir, filename);
    await sharp(file.buffer)
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 82 })
      .toFile(fullPath);
    saved.push(`images/laptop/${folderSlug}/${filename}`);
  }
  return saved;
}

module.exports = { upload, processUploadedImages };
