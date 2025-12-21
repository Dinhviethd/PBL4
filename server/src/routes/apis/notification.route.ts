import express from "express";
import { getNotifications, markNotificationAsSeen } from "@/controllers/notification.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";
import { asyncHandler } from "@/utils/error.response";

const router = express.Router();

router.get("/", authMiddleware, asyncHandler(getNotifications));
router.patch("/:id/seen", authMiddleware, asyncHandler(markNotificationAsSeen));

export default router;
