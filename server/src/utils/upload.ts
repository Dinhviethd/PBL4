import fs from "fs/promises";
import cloudinary from "../configs/cloudinary";

/**
 * Xác định resource_type dựa trên file extension
 */
const getResourceType = (fileName: string): string => {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  // Image types
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'ico'].includes(ext)) {
    return 'image';
  }
  
  // Video types
  if (['mp4', 'avi', 'mov', 'mkv', 'webm', 'mpeg', 'flv', 'wmv'].includes(ext)) {
    return 'video';
  }
  
  // Audio types
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma'].includes(ext)) {
    return 'video'; // Cloudinary treats audio as video
  }
  
  // PDF và các file document khác - phải dùng 'raw' để tránh auto-detect thành 'image'
  if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) {
    return 'raw';
  }
  
  // All other files
  return 'auto';
};

export const uploadToCloudinary = async (filePath: string, folder: string) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `chatmate_uploads/${folder}`,
    resource_type: "image" as const,
  });

  await fs.unlink(filePath);
  return result;
};

/**
 * Upload file (ảnh, video, document, etc.) lên Cloudinary
 * Tự động nhận diện loại file và dùng resource_type phù hợp
 */
export const uploadFileToCloudinary = async (filePath: string, folder: string, fileName: string) => {
  const resourceType = getResourceType(fileName) as 'image' | 'video' | 'raw' | 'auto';
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  
  console.log(`[UPLOAD] File: ${fileName}, Ext: ${ext}, Resource Type: ${resourceType}`);
  
  const uploadOptions: any = {
    folder: `chatmate_uploads/${folder}`,
    resource_type: resourceType,
    type: 'upload',
  };

  const result = await cloudinary.uploader.upload(filePath, uploadOptions);
  console.log(`[UPLOAD SUCCESS] URL: ${result.secure_url}`);

  // Xóa file tạm sau khi upload thành công
  try {
    await fs.unlink(filePath);
    console.log(`[CLEANUP] Deleted temp file: ${filePath}`);
  } catch (error: any) {
    console.warn(`[CLEANUP] Failed to delete temp file ${filePath}:`, error.message);
  }
  
  return result;
};

/**
 * Xóa 1 file khỏi Cloudinary bằng public_id
 */
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Xóa file thất bại:", error);
  }
};