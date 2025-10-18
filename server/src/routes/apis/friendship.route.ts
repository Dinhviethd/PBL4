import express from "express";
import {
  sendFriendRequest,
  acceptFriendRequest,
  getReceivedRequests,
  getSentRequests,
  getRelationStatus,
  deleteFriendship,
  getFriends,
  getPendingRequests,
  blockFriend,
  unblockFriend,
  deleteFriendRequest,
} from "@/controllers/friendship.controller";
import { authMiddleware, checkAccountStatus } from "@/middlewares/auth.middleware";
import { asyncHandler } from "@/utils/error.response";

const router = express.Router();

router.post(
  "/request",
  authMiddleware,
  checkAccountStatus,
  asyncHandler(sendFriendRequest)
);

router.delete(
  "/request/:requestId",
  authMiddleware,
  checkAccountStatus,
  asyncHandler(deleteFriendRequest)
);

router.put(
  "/accept/:requestId",
  authMiddleware,
  checkAccountStatus,
  asyncHandler(acceptFriendRequest)
);

router.delete(
  "/:friendId",
  authMiddleware,
  checkAccountStatus,
  asyncHandler(deleteFriendship)
);

router.get(
  "/list",
  authMiddleware,
  checkAccountStatus,
  asyncHandler(getFriends)
);

router.get(
  "/pending",
  authMiddleware,
  checkAccountStatus,
  asyncHandler(getPendingRequests)
);

router.get(
  "/pending/received",
  authMiddleware,
  checkAccountStatus,
  asyncHandler(getReceivedRequests)
);

router.get(
  "/pending/sent",
  authMiddleware,
  checkAccountStatus,
  asyncHandler(getSentRequests)
);

router.get(
  "/status/:targetId",
  authMiddleware,
  checkAccountStatus,
  asyncHandler(getRelationStatus)
);

router.put(
  "/block/:friendId",
  authMiddleware,
  checkAccountStatus,
  asyncHandler(blockFriend)
);

router.delete(
  "/unblock/:friendId",
  authMiddleware,
  checkAccountStatus,
  asyncHandler(unblockFriend)
);

export default router;
