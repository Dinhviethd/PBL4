import express from "express";
import authRoute from './apis/auth.route'
import userRoute from './apis/user.route'
import notificationRoute from './apis/notification.route'

const router = express.Router()

router.use("/auth", authRoute)
      .use("/users", userRoute)
      .use("/notifications", notificationRoute)

export default router