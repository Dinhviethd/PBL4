import express from "express";
import { getMyInfo, updateMyInfo, deleteMyAccount, uploadAvatar, changePassword, deactivateAccount, reactivateAccount, getAccountStatus } from "@/controllers/user.controller.";
import { authMiddleware, checkAccountStatus } from "@/middlewares/auth.middleware";
import { uploadAvatar as uploadMiddleware } from "@/middlewares/upload.middleware";

const router = express.Router();

// Routes that don't require account status check (allow LOCKED accounts)
router.get("/me", authMiddleware, getMyInfo);
router.get("/status", authMiddleware, getAccountStatus);
router.put("/reactivate", authMiddleware, reactivateAccount);

// Routes that require active account status
router.put("/me", authMiddleware, checkAccountStatus, updateMyInfo);
router.put("/change-password", authMiddleware, checkAccountStatus, changePassword);
router.put("/deactivate", authMiddleware, checkAccountStatus, deactivateAccount);
router.post("/avatar", authMiddleware, checkAccountStatus, uploadMiddleware.single('avatar'), uploadAvatar);
router.delete("/me", authMiddleware, checkAccountStatus, deleteMyAccount);

export default router;