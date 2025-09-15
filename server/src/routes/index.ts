import express from "express";
import authRoute from './apis/auth.route'
import userRoute from './apis/user.route'
const router= express.Router()
router.use("/auth", authRoute)
        .use("/users", userRoute)
export default router