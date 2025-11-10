import { Router } from 'express';
import { GroupController } from '@/controllers/group.controller';
import { authMiddleware, checkAccountStatus } from '@/middlewares/auth.middleware';

const router = Router();
const groupController = new GroupController();

// Tạo group
router.post('/', authMiddleware, checkAccountStatus, groupController.createGroup);

// Lấy danh sách group của user - phải đặt TRƯỚC các route với :groupId
router.get('/my-groups', authMiddleware, checkAccountStatus, groupController.getUserGroups);

// Lấy danh sách users có thể mời
router.get('/:groupId/invitable-users', authMiddleware, checkAccountStatus, groupController.getInvitableUsers);

// Mời user vào group
router.post('/:groupId/invite', authMiddleware, checkAccountStatus, groupController.inviteUserToGroup);

// Thêm thành viên vào group
router.post('/:groupId/members', authMiddleware, checkAccountStatus, groupController.addMember);

// Duyệt thành viên pending
router.patch('/:groupId/members/approve', authMiddleware, checkAccountStatus, groupController.approveMember);

// Rời nhóm
router.delete('/:groupId/leave', authMiddleware, checkAccountStatus, groupController.leaveGroup);

// Kick thành viên (chỉ admin)
router.delete('/:groupId/members', authMiddleware, checkAccountStatus, groupController.kickMember);

// Xóa group (chỉ admin)
router.delete('/:groupId', authMiddleware, checkAccountStatus, groupController.deleteGroup);

// Lấy danh sách thành viên group
router.get('/:groupId/members', authMiddleware, checkAccountStatus, groupController.getGroupMembers);

// Lấy danh sách thành viên pending (chỉ admin)
router.get('/:groupId/pending', authMiddleware, checkAccountStatus, groupController.getPendingMembers);

export default router;
