import { Router } from 'express';
import messageController from '@/controllers/message.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

// Test route without auth first
router.get('/test', (req, res) => {
  res.json({ message: 'Message routes working' });
});

// Apply auth middleware to all routes below this line
router.use(authMiddleware);


// Conversations
router.get('/conversations', messageController.getRecentConversations);

// Private messages
router.post('/private', messageController.sendPrivateMessage);
router.get('/private/:friendId', messageController.getPrivateMessages);
router.get('/private/:friendId/older', messageController.getOlderPrivateMessages);

// Group messages
router.post('/group', messageController.sendGroupMessage);
router.get('/group/:groupId', messageController.getGroupMessages);
router.get('/group/:groupId/older', messageController.getOlderGroupMessages);

// Message actions
router.delete('/:messageId', messageController.deleteMessage);

export default router;