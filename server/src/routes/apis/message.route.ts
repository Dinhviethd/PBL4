import { Router } from 'express';
import { MessageController } from '@/controllers/message.controller';
import { authMiddleware, checkAccountStatus } from '@/middlewares/auth.middleware';

const router = Router();
const messageController = new MessageController();

// Gửi tin nhắn riêng tư
router.post('/private', authMiddleware, checkAccountStatus, messageController.sendPrivateMessage);

// Gửi tin nhắn nhóm
router.post('/group/:groupId', authMiddleware, checkAccountStatus, messageController.sendGroupMessage);

// Lấy tin nhắn riêng tư với pagination
router.get('/private/:partnerId', authMiddleware, checkAccountStatus, messageController.getPrivateMessages);

// Lấy tin nhắn nhóm với pagination
router.get('/group/:groupId', authMiddleware, checkAccountStatus, messageController.getGroupMessages);

// Chỉnh sửa tin nhắn
router.put('/:messageId', authMiddleware, checkAccountStatus, messageController.editMessage);

// Xóa tin nhắn
router.delete('/:messageId', authMiddleware, checkAccountStatus, messageController.deleteMessage);

// Đánh dấu đã đọc
router.post('/:messageId/read', authMiddleware, checkAccountStatus, messageController.markAsRead);

// Lấy cuộc hội thoại gần đây
router.get('/conversations/recent', authMiddleware, checkAccountStatus, messageController.getRecentConversations);

export default router;