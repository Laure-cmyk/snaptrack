import cloudinaryModule from 'cloudinary';
import multer from 'multer';

const cloudinary = cloudinaryModule.v2;

// Check for required environment variables
const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

console.log('☁️ Cloudinary config loading...');
console.log('  - Cloud name:', cloudName ? '✅ Set' : '❌ Missing');
console.log('  - API key:', apiKey ? '✅ Set' : '❌ Missing');
console.log('  - API secret:', apiSecret ? '✅ Set' : '❌ Missing');

if (!cloudName || !apiKey || !apiSecret) {
  console.warn('⚠️ Cloudinary credentials not fully configured. Image upload will not work.');
}

// Configure Cloudinary
cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret
});

console.log('☁️ Cloudinary configured successfully');

// Configure Multer for memory storage (we'll upload to Cloudinary manually)
const storage = multer.memoryStorage();

export const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

export { cloudinary };

