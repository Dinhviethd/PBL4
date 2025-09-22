import express from "express";
import { getNotifications } from "@/controllers/notification.controller";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router = express.Router();

router.get("/", authMiddleware, getNotifications);

export default router;