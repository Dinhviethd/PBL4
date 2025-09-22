import { 
    register,
    login,
    forgotPassword,
    resetPassword,
    refreshToken
} from '@/controllers/auth.controller'
import { asyncHandler } from '@/utils/error.response'
import express from 'express'

const router = express.Router()

router.post("/register", asyncHandler(register))
router.post("/login", asyncHandler(login))
router.post("/forgot-password", asyncHandler(forgotPassword))
router.post("/reset-password", asyncHandler(resetPassword))
router.post("/refresh-token", asyncHandler(refreshToken))

export default router
