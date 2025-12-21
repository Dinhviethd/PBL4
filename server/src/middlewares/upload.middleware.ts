import multer from "multer";
import path from "path";

//lưu tạm
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "src/upload/avatars"); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

export const upload = multer({ storage });
