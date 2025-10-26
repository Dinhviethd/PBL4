import express from "express";
import {
  getMyInfo,
  updateMyInfo,
  deleteMyAccount,
  uploadAvatar,
  changePassword,
  confirmPasswordChange,
  deactivateAccount,
  reactivateAccount,
  getAccountStatus,
  lookupUser,
} from "@/controllers/user.controller";
import { authMiddleware, checkAccountStatus } from "@/middlewares/auth.middleware";
import { upload as uploadMiddleware } from "@/middlewares/upload.middleware";
import { asyncHandler } from "@/utils/error.response";

const router = express.Router();

//Routes không yêu cầu tài khoản phải ACTIVE 
router.get("/me", authMiddleware, asyncHandler(getMyInfo));
router.get('/lookup', authMiddleware, asyncHandler(lookupUser));
router.get("/status", authMiddleware, asyncHandler(getAccountStatus));
router.put("/reactivate", authMiddleware, asyncHandler(reactivateAccount));

// Routes yêu cầu tài khoản ACTIVE
router.put("/me", authMiddleware, checkAccountStatus, asyncHandler(updateMyInfo));
router.put("/change-password", authMiddleware, checkAccountStatus, asyncHandler(changePassword));
router.put("/confirm-password-change", authMiddleware, checkAccountStatus, asyncHandler(confirmPasswordChange));
router.put("/deactivate", authMiddleware, checkAccountStatus, asyncHandler(deactivateAccount));

router.post(
  "/avatar",
  authMiddleware,
  checkAccountStatus,
  uploadMiddleware.single("avatar"),
  asyncHandler(uploadAvatar)
);


router.delete("/me", authMiddleware, checkAccountStatus, asyncHandler(deleteMyAccount));

export default router;
