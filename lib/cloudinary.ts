import { v2 as cloudinary } from 'cloudinary';

// Configuration
cloudinary.config({ 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'ddiv7qbkc', 
  api_key: process.env.CLOUDINARY_API_KEY || '453924282784974', 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

export default cloudinary;
