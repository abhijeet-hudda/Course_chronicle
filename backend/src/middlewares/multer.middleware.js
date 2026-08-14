import multer from "multer";
import fs from "fs";
import path from "path";

// Files land here briefly before uploadOnCloudinary() ships them out and
// deletes the local copy. Keeping this on disk (rather than in memory,
// which the old code used) keeps uploadPaper's memory footprint flat
// regardless of file size, and matches the provided utils/cloudinary.js,
// which expects a local file path.
const tempDir = path.join(process.cwd(), "public", "temp");
fs.mkdirSync(tempDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, tempDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${uniqueSuffix}-${file.originalname}`);
  },
});

const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);

export const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB — tune to taste
  fileFilter: (_req, file, cb) => {
    if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
      return cb(new Error("Only JPEG, PNG, WEBP or PDF files are allowed"));
    }
    cb(null, true);
  },
});