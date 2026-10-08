import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const baseUploadDir = path.resolve(__dirname, '../../uploads');

// Ensure directories exist
const ensureDir = (subDir) => {
  const target = path.join(baseUploadDir, subDir);
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  return target;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = 'general';
    if (req.baseUrl?.includes('complaints') || req.path?.includes('complaint')) {
      subfolder = 'complaints';
    } else if (req.baseUrl?.includes('workers') || req.path?.includes('completion-proof')) {
      subfolder = 'completion_proofs';
    } else if (req.baseUrl?.includes('profile')) {
      subfolder = 'profiles';
    }
    const dest = ensureDir(subfolder);
    cb(null, dest);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const sanitizedBase = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 30);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${sanitizedBase}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
  const allowedExtensions = ['.jpg', '.jpeg', '.png', '.webp'];

  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP images are allowed.'));
  }
};

export const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter,
});

export const getRelativeUploadPath = (file) => {
  if (!file) return null;
  // Convert absolute disk path to URL path like /uploads/complaints/xyz.jpg
  const relative = path.relative(path.resolve(__dirname, '../../'), file.path);
  return `/${relative.replace(/\\/g, '/')}`;
};

export { uploadImageToStorage, isCloudinaryConfigured } from './cloudinary.js';
