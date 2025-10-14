import { Router } from 'express';
import messageController from '@/controllers/message.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.post('/private', messageController.sendPrivateMessage);
router.get('/private/:friendId', messageController.getPrivateMessages);
router.get('/private/:friendId/older', messageController.getOlderPrivateMessages); // Load more

router.post('/group', messageController.sendGroupMessage);
router.get('/group/:groupId', messageController.getGroupMessages);
router.get('/group/:groupId/older', messageController.getOlderGroupMessages); // Load more

router.delete('/:messageId', messageController.deleteMessage);

router.get('/conversations', messageController.getRecentConversations);

export default router;