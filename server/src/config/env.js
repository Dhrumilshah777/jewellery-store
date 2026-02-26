import dotenv from 'dotenv';

dotenv.config();

const required = ['MONGODB_URI', 'JWT_SECRET'];
const missing = required.filter((key) => !process.env[key]);
if (missing.length && process.env.NODE_ENV === 'production') {
  console.error('Missing required env:', missing.join(', '));
  process.exit(1);
}

export const config = {
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 5000,
  apiVersion: process.env.API_VERSION || 'v1',
  mongodbUri: process.env.MONGODB_URI,
  jwt: {
    secret: process.env.JWT_SECRET || 'dev-secret',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',
  // Comma-separated CLIENT_URL for multiple origins (e.g. Vercel + custom domain)
  clientUrls: process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(',').map((u) => u.trim()).filter(Boolean)
    : ['http://localhost:3000'],
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
  },
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
    apiKey: process.env.CLOUDINARY_API_KEY || '',
    apiSecret: process.env.CLOUDINARY_API_SECRET || '',
  },
};
