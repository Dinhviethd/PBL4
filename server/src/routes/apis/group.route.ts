import { Router } from 'express';
import groupController from '@/controllers/group.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

router.post('/', authMiddleware, groupController.createGroup);
router.get('/', authMiddleware, groupController.getUserGroups);
router.get('/:groupId', authMiddleware, groupController.getGroupDetails);
router.put('/:groupId', authMiddleware, groupController.updateGroup);
router.delete('/:groupId', authMiddleware, groupController.deleteGroup);

// Member management
router.post('/:groupId/members', authMiddleware, groupController.addMember);
router.delete('/:groupId/members/:memberId', authMiddleware, groupController.removeMember);
router.post('/:groupId/leave', authMiddleware, groupController.leaveGroup);

// Pending member management
router.get('/:groupId/pending', authMiddleware, groupController.getPendingMembers);
router.post('/:groupId/members/:memberId/approve', authMiddleware, groupController.approveMember);
router.post('/:groupId/members/:memberId/reject', authMiddleware, groupController.rejectMember);

export default router;