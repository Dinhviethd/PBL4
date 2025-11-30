
import { Request, Response } from "express";
import friendshipService from "@/services/friendship.service";
import { AppError } from "@/utils/error.response";

export const sendFriendRequest = async (req: Request, res: Response) => {
  const senderId = req.user?.userId;
  const { receiverId, message } = req.body;

  if (!senderId) throw new AppError(401, "Unauthorized");
  if (!receiverId) throw new AppError(400, "Thiếu thông tin người nhận");

  const result = await friendshipService.sendRequest(senderId, receiverId, message);
  res.json({ success: true, data: result, message: "Gửi lời mời kết bạn thành công" });
};
export const getBlockedList = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError(401, "Unauthorized");
  const blockedList = await friendshipService.getBlockedList(userId);
  res.json({ success: true, data: blockedList });
};

export const getFriends = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError(401, "Unauthorized");

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const friends = await friendshipService.getFriends(userId, page, limit);
  res.json({ success: true, ...friends });
};

export const getPendingRequests = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError(401, "Unauthorized");

  const requests = await friendshipService.getPendingRequests(userId);
  res.json({ success: true, data: requests });
};

export const getReceivedRequests = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError(401, "Unauthorized");

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await friendshipService.getReceivedRequests(userId, page, limit);
  res.json({ success: true, ...result });
};

export const getSentRequests = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  if (!userId) throw new AppError(401, "Unauthorized");

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  const result = await friendshipService.getSentRequests(userId, page, limit);
  res.json({ success: true, ...result });
};

export const acceptFriendRequest = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { requestId } = req.params;

  if (!userId) throw new AppError(401, "Unauthorized");

  const result = await friendshipService.acceptRequest(userId, parseInt(requestId));
  res.json({ success: true, message: result.message });
};

export const deleteFriendship = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { friendId } = req.params;

  if (!userId) throw new AppError(401, "Unauthorized");

  const result = await friendshipService.deleteFriendship(userId, parseInt(friendId));
  res.json({ success: true, message: result.message });
};

export const deleteFriendRequest = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { requestId } = req.params;

  if (!userId) throw new AppError(401, "Unauthorized");

  const result = await friendshipService.deleteRequest(userId, parseInt(requestId));
  res.json({ success: true, message: result.message });
};

export const blockFriend = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { friendId } = req.params;

  if (!userId) throw new AppError(401, "Unauthorized");

  const result = await friendshipService.blockFriend(userId, parseInt(friendId));
  res.json({ success: true, message: result.message });
};

export const unblockFriend = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const { friendId } = req.params;

  if (!userId) throw new AppError(401, "Unauthorized");

  const result = await friendshipService.unblockFriend(userId, parseInt(friendId));
  res.json({ success: true, message: result.message });
};

export const getRelationStatus = async (req: Request, res: Response) => {
  const userId = req.user?.userId;
  const targetId = parseInt(req.params.targetId);

  if (!userId) throw new AppError(401, 'Unauthorized');

  const result = await friendshipService.getRelationStatus(userId, targetId);
  res.json({ success: true, data: result });
};
