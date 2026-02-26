import { v2 as cloudinary } from 'cloudinary';
import { config } from '../config/env.js';

if (config.cloudinary.cloudName && config.cloudinary.apiKey && config.cloudinary.apiSecret) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
  });
}

export const uploadImage = async (req, res, next) => {
  try {
    if (!config.cloudinary.cloudName || !config.cloudinary.apiSecret) {
      return res.status(503).json({ success: false, message: 'Image upload is not configured.' });
    }
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const folder = req.body.folder || 'jewellery-products';
    return new Promise((resolve) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (err, result) => {
          if (err) {
            return resolve(res.status(400).json({ success: false, message: err.message || 'Upload failed' }));
          }
          resolve(res.json({ success: true, url: result.secure_url, publicId: result.public_id }));
        }
      );
      stream.end(req.file.buffer);
    });
  } catch (err) {
    next(err);
  }
};
