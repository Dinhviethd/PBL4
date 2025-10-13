import fs from "fs/promises";
import cloudinary from "../configs/cloudinary";

export const uploadToCloudinary = async (filePath: string, folder: string) => {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: `chatmate_uploads/${folder}`, // folder = "avatars" hoặc "messages" ...
    resource_type: "image",
  });

  // Xóa file tạm sau khi upload thành công
  await fs.unlink(filePath);
  return result;
};

/**
 * Xóa 1 file khỏi Cloudinary bằng public_id
 */
export const deleteFromCloudinary = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Xóa ảnh thất bại:", error);
  }
};
