import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

/**
 * Checks if Cloudinary credentials are configured in the environment
 */
export const isCloudinaryConfigured = () => {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
};

// Initialize Cloudinary if credentials are present
if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  console.log('✓ Cloudinary persistent image storage configured successfully');
}

/**
 * Uploads a local file to Cloudinary if configured; otherwise returns relative path
 * @param {Express.Multer.File} file Multer file object
 * @param {string} folder Cloudinary folder name (e.g., 'complaints', 'completion_proofs')
 * @returns {Promise<string|null>} Cloudinary HTTPS URL or local relative path
 */
export const uploadImageToStorage = async (file, folder = 'complaints') => {
  if (!file) return null;

  // 1. If Cloudinary is configured, upload to cloud CDN
  if (isCloudinaryConfigured()) {
    try {
      const uploadResult = await cloudinary.uploader.upload(file.path, {
        folder: `smartwaste/${folder}`,
        resource_type: 'image',
        transformation: [
          { quality: 'auto', fetch_format: 'auto' },
        ],
      });

      // Safely clean up local temporary file after successful cloud upload
      if (fs.existsSync(file.path)) {
        try {
          fs.unlinkSync(file.path);
        } catch (unlinkErr) {
          // Ignore temp cleanup warnings
        }
      }

      return uploadResult.secure_url;
    } catch (uploadError) {
      console.warn('Cloudinary upload failed, falling back to local storage:', uploadError.message);
    }
  }

  // 2. Fallback to local relative URL path (e.g. /uploads/complaints/filename.jpg)
  if (file.path) {
    const normalized = file.path.replace(/\\/g, '/');
    const uploadsIdx = normalized.indexOf('/uploads/');
    if (uploadsIdx !== -1) {
      return normalized.substring(uploadsIdx);
    }
  }

  return `/uploads/${folder}/${file.filename || path.basename(file.path)}`;
};

export default cloudinary;
