import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AppError } from '@/utils/error.response';

// Tạo thư mục upload nếu chưa có
const uploadDir = path.join(__dirname, '../../upload/avatars');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Cấu hình storage cho multer
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Tạo tên file unique với timestamp và user ID
    const userId = req.user?.id || 'unknown';
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const filename = `avatar-${userId}-${timestamp}${extension}`;
    cb(null, filename);
  }
});

// File filter để chỉ cho phép ảnh
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'Chỉ chấp nhận file ảnh (JPEG, PNG, GIF, WebP)') as any, false);
  }
};

// Cấu hình multer
export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // Chỉ cho phép 1 file
  }
});

// Helper function để xóa file cũ
export const deleteOldAvatar = (avatarUrl: string) => {
  try {
    if (avatarUrl && avatarUrl.startsWith('/upload/avatars/')) {
      const filePath = path.join(__dirname, '../../', avatarUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch (error) {
    console.error('Error deleting old avatar:', error);
  }
};