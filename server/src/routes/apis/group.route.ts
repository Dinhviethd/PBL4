import { Router } from 'express';
import { GroupController } from '@/controllers/group.controller';
import { authMiddleware, checkAccountStatus } from '@/middlewares/auth.middleware';

const router = Router();
const groupController = new GroupController();

// Tạo group
router.post('/', authMiddleware, checkAccountStatus, groupController.createGroup);

// Lấy danh sách group của user - phải đặt TRƯỚC các route với :groupId
router.get('/my-groups', authMiddleware, checkAccountStatus, groupController.getUserGroups);

// Thêm thành viên vào group
router.post('/:groupId/members', authMiddleware, checkAccountStatus, groupController.addMember);

// Rời nhóm
router.delete('/:groupId/leave', authMiddleware, checkAccountStatus, groupController.leaveGroup);

// Kick thành viên (chỉ admin)
router.delete('/:groupId/members', authMiddleware, checkAccountStatus, groupController.kickMember);

// Cập nhật group (chỉ admin)
router.put('/:groupId', authMiddleware, checkAccountStatus, groupController.updateGroup);
// Xóa group (chỉ admin)
router.delete('/:groupId', authMiddleware, checkAccountStatus, groupController.deleteGroup);

// Lấy thông tin chi tiết group theo id
router.get('/:groupId', authMiddleware, checkAccountStatus, groupController.getGroupById);
// Lấy danh sách thành viên group
router.get('/:groupId/members', authMiddleware, checkAccountStatus, groupController.getGroupMembers);


export default router;
