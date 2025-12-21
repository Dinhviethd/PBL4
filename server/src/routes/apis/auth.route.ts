import { 
    register,
    login,
    forgotPassword,
    resetPassword,
    resetPasswordRequest,
    confirmPasswordReset,
    refreshToken,
    logout
} from '@/controllers/auth.controller'
import { asyncHandler } from '@/utils/error.response'
import { authMiddleware } from '@/middlewares/auth.middleware'
import express from 'express'

const router = express.Router()

router.post("/register", asyncHandler(register))
router.post("/login", asyncHandler(login))
router.post("/forgot-password", asyncHandler(forgotPassword))
router.post("/reset-password", asyncHandler(resetPassword))
router.post("/reset-password-request", asyncHandler(resetPasswordRequest))
router.post("/confirm-password-reset", asyncHandler(confirmPasswordReset))
router.post("/refresh-token", asyncHandler(refreshToken))
router.post("/logout", authMiddleware, asyncHandler(logout))

export default router
