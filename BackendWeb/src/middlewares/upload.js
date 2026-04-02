const multer = require("multer");
const path = require("path");
const fs = require("fs");
const sharp = require("sharp");
const { v2: cloudinary } = require("cloudinary");
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

function hasCloudinaryConfig() {
  // Prefer CLOUDINARY_URL (single env) but support split config too.
  if (process.env.CLOUDINARY_URL) return true;
  return Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);
}

async function uploadToCloudinary(buffer, folderSlug) {
  if (!hasCloudinaryConfig()) return null;
  const folder = `lapstore/laptop/${folderSlug}`;
  return await new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "image",
        format: "webp",
        transformation: [{ width: 1600, crop: "limit" }, { quality: "auto:good" }],
      },
      (err, result) => {
        if (err) return reject(err);
        resolve(result?.secure_url || result?.url || null);
      }
    );
    stream.end(buffer);
  });
}

async function processUploadedImages(files = [], folderName = "") {
  const folderSlug = slugify(folderName) || "san-pham-chua-dat-ten";
  const saved = [];
  for (const file of files) {
    // Prefer cloud storage in production to avoid ephemeral filesystem.
    const uploadedUrl = await uploadToCloudinary(file.buffer, folderSlug).catch(() => null);
    if (uploadedUrl) {
      saved.push(uploadedUrl);
      continue;
    }

    const targetDir = path.resolve(imagesRootDir, "laptop", folderSlug);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
    const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
    const fullPath = path.join(targetDir, filename);
    await sharp(file.buffer).resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(fullPath);
    saved.push(`images/laptop/${folderSlug}/${filename}`);
  }
  return saved;
}

module.exports = { upload, processUploadedImages };
