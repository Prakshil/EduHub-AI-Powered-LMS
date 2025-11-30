import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadOnCloudinary = async (localFilePath, options = {}) => {
  return cloudinary.uploader.upload(localFilePath, { resource_type: 'image', ...options });
};

export const uploadDocumentOnCloudinary = async (localFilePath, options = {}) => {
  // For documents, use 'raw' resource type or 'auto' to detect
  return cloudinary.uploader.upload(localFilePath, { 
    resource_type: 'auto', // Auto-detect file type
    ...options 
  });
};