import express from 'express';
import groupController from '@/controllers/group.controller';
import { authMiddleware, checkAccountStatus } from '@/middlewares/auth.middleware';
import { asyncHandler } from '@/utils/error.response';

const router = express.Router();

router.post('/', authMiddleware, checkAccountStatus, asyncHandler(groupController.createGroup));
router.post('/:groupId/members', authMiddleware, checkAccountStatus, asyncHandler(groupController.addMember));
router.delete('/:groupId/members/:memberId', authMiddleware, checkAccountStatus, asyncHandler(groupController.removeMember));

router.get('/list', authMiddleware, checkAccountStatus, asyncHandler(groupController.getUserGroupsPaginated));
router.get('/:groupId', authMiddleware, checkAccountStatus, asyncHandler(groupController.getGroupDetails));
router.get('/', authMiddleware, checkAccountStatus, asyncHandler(groupController.getUserGroups));
router.put('/:groupId', authMiddleware, checkAccountStatus, asyncHandler(groupController.updateGroup));
router.delete('/:groupId', authMiddleware, checkAccountStatus, asyncHandler(groupController.deleteGroup));
router.post('/:groupId/leave', authMiddleware, checkAccountStatus, asyncHandler(groupController.leaveGroup));

export default router;
