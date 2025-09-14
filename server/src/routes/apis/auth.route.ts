import { register,
         login,
         forgotPassword, resetPassword         
} from '@/controllers/auth.controller'
import { asyncHandler } from '@/utils/error.response'
import express from 'express'
const router= express.Router()

router.route("/register")
    .post(asyncHandler(register))

router.route("/login")
    .post(asyncHandler(login))

router.route("/forgot-password")
    .post(asyncHandler(forgotPassword))

router.route("/reset-password")
    .post(asyncHandler(resetPassword))

export default router;