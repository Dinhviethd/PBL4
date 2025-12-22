import multer from "multer";
import path from "path";
import fs from "fs";

// Dynamic storage based on folder type
const createStorage = (folder: string = 'avatars') => {
  const uploadPath = `src/upload/${folder}`;
  
  // Ensure directory exists
  if (!fs.existsSync(uploadPath)) {
    fs.mkdirSync(uploadPath, { recursive: true });
  }
  
  return multer.diskStorage({
    destination: (req, file, cb) => {
      // Double-check and create if needed
      if (!fs.existsSync(uploadPath)) {
        fs.mkdirSync(uploadPath, { recursive: true });
      }
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + path.extname(file.originalname));
    },
  });
};

// Default avatar upload
export const upload = multer({ storage: createStorage('avatars') });

// File upload (images, documents, etc.)
export const fileUpload = multer({ 
  storage: createStorage('messages'),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow common file types
    const allowedMimes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/plain',
      'audio/mpeg', 'audio/wav',
      'video/mp4', 'video/mpeg'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  }
});
