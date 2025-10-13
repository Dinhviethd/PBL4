import express from "express";
import authRoute from './apis/auth.route'
import userRoute from './apis/user.route'
import notificationRoute from './apis/notification.route'
import friendshipRoute from './apis/friendship.route'
import groupRoute from './apis/group.route'
import groupInvitationRoute from './apis/groupInvitation.route'
import messageRoute from './apis/message.route'

const router = express.Router()

router.use("/auth", authRoute)
      .use("/users", userRoute)
      .use("/notifications", notificationRoute)
      .use("/friendship", friendshipRoute)
      .use('/groups', groupRoute)
      .use('/groups/:groupId/invite', groupInvitationRoute)
      .use('/groups/invite', groupInvitationRoute)

      .use("/messages", messageRoute)

export default router