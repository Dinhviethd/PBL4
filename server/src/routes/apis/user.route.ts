import express from "express";
import {
  getMyInfo,
  updateMyInfo,
  deleteMyAccount,
  uploadAvatar,
  changePassword,
  deactivateAccount,
  reactivateAccount,
  getAccountStatus,
} from "@/controllers/user.controller";
import { authMiddleware, checkAccountStatus } from "@/middlewares/auth.middleware";
import { upload as uploadMiddleware } from "@/middlewares/upload.middleware";

const router = express.Router();

// Routes không yêu cầu kiểm tra trạng thái tài khoản (LOCKED vẫn truy cập được)
router.get("/me", authMiddleware, getMyInfo);
router.get("/status", authMiddleware, getAccountStatus);
router.put("/reactivate", authMiddleware, reactivateAccount);

// Routes yêu cầu tài khoản đang hoạt động (ACTIVE)
router.put("/me", authMiddleware, checkAccountStatus, updateMyInfo);
router.put("/change-password", authMiddleware, checkAccountStatus, changePassword);
router.put("/deactivate", authMiddleware, checkAccountStatus, deactivateAccount);

// Upload avatar → middleware xử lý file + kiểm tra quyền truy cập
router.post(
  "/avatar",
  authMiddleware,
  checkAccountStatus,
  uploadMiddleware.single("avatar"),
  uploadAvatar
);

// Xóa tài khoản
router.delete("/me", authMiddleware, checkAccountStatus, deleteMyAccount);

export default router;
