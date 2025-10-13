import express from "express";
import authRoute from './apis/auth.route'
import userRoute from './apis/user.route'
import notificationRoute from './apis/notification.route'
import messageRoute from './apis/message.route'

const router = express.Router()

router.use("/auth", authRoute)
      .use("/users", userRoute)
      .use("/notifications", notificationRoute)
      .use("/messages", messageRoute)

export default router