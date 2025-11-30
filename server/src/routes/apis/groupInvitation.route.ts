
import express from 'express';
import groupInvitationController from '@/controllers/groupInvitation.controller';
import { authMiddleware, checkAccountStatus } from '@/middlewares/auth.middleware';
import { asyncHandler } from '@/utils/error.response';

const router = express.Router({ mergeParams: true });

router.post('/', authMiddleware, checkAccountStatus, asyncHandler(groupInvitationController.sendInvitation));

router.delete('/invitation/:invitationId', authMiddleware, checkAccountStatus, asyncHandler(groupInvitationController.deleteInvitation));

router.put('/invitation/:invitationId/accept', authMiddleware, checkAccountStatus, asyncHandler(groupInvitationController.acceptInvitation));


router.get('/received', authMiddleware, checkAccountStatus, asyncHandler(groupInvitationController.getReceivedInvites));

router.get('/sent', authMiddleware, checkAccountStatus, asyncHandler(groupInvitationController.getSentInvites));

// Route lấy danh sách lời mời cần admin duyệt
router.get('/admin-approval', authMiddleware, checkAccountStatus, asyncHandler(groupInvitationController.getInvitesNeedAdminApprove));

// Route lấy danh sách lời mời vào nhóm (pending members)
router.get('/pending', authMiddleware, checkAccountStatus, asyncHandler(groupInvitationController.getPendingMembers));
export default router;
