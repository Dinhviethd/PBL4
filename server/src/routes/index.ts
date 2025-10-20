import express from "express";
import authRoute from './apis/auth.route'
import userRoute from './apis/user.route'
import notificationRoute from './apis/notification.route'
import messageRoutes from './apis/message.route';
import groupRoutes from './apis/group.route';

const router = express.Router()

router.use("/auth", authRoute)
      .use("/users", userRoute)
      .use("/messages", messageRoutes)
      .use("/notifications", notificationRoute)
      .use('/groups', groupRoutes)

export default router