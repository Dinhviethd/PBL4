import { register } from '@/controllers/auth.controller'
import { asyncHandler } from '@/utils/error.response'
import express from 'express'
const router= express.Router()
router.route("/test")
    .post(asyncHandler(register))

export default router;