import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import { asyncHandler } from '@/utils/error.response';
import messageService from '@/services/message.service';
import { SendPrivateMessageSchema, SendGroupMessageSchema } from '@/schemas/message.schema';

const router = Router();

// Gửi tin nhắn riêng tư
router.post('/private', authMiddleware, asyncHandler(async (req, res) => {
  const senderId = req.user!.userId;
  const validatedData = SendPrivateMessageSchema.parse(req.body);
  
  const message = await messageService.sendPrivateMessage(senderId, validatedData);
  
  res.status(201).json({
    success: true,
    message: message
  });
}));

// Gửi tin nhắn nhóm
router.post('/group', authMiddleware, asyncHandler(async (req, res) => {
  const senderId = req.user!.userId;
  const validatedData = SendGroupMessageSchema.parse(req.body);
  
  const message = await messageService.sendGroupMessage(senderId, validatedData);
  
  res.status(201).json({
    success: true,
    message: message
  });
}));

// Lấy tin nhắn riêng tư
router.get('/private/:friendId', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const friendId = parseInt(req.params.friendId);
  const { page = 1, limit = 20, search } = req.query;
  
  const messages = await messageService.getPrivateMessages(userId, friendId, {
    page: Number(page),
    limit: Number(limit),
    search: search as string
  });
  
  res.json({
    success: true,
    data: messages
  });
}));

// Lấy tin nhắn nhóm
router.get('/group/:groupId', authMiddleware, asyncHandler(async (req, res) => {
  const userId = req.user!.userId;
  const groupId = parseInt(req.params.groupId);
  const { page = 1, limit = 20, search } = req.query;
  
  const messages = await messageService.getGroupMessages(userId, groupId, {
    page: Number(page),
    limit: Number(limit),
    search: search as string
  });
  
  res.json({
    success: true,
    data: messages
  });
}));

export default router;