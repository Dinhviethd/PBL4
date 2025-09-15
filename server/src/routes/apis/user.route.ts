import express from "express";
import { getMyInfo, updateMyInfo, deleteMyAccount } from "@/controllers/user.controller.";
import { authMiddleware } from "@/middlewares/auth.middleware";

const router = express.Router();

router.get("/me", authMiddleware, getMyInfo);
router.put("/me", authMiddleware, updateMyInfo);
router.delete("/me", authMiddleware, deleteMyAccount);

export default router;