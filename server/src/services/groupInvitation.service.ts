import { AppDataSource } from '@/configs/database.config'; // Import DataSource để chạy SQL
import groupInvitationRepository from '@/repositories/groupInvitation.repository';
import { GroupRepository } from '@/repositories/group.repository';
import { AppError } from '@/utils/error.response';
import { UserResponse } from '@/DTOs/user.dto';
import { GroupInvitationStatus } from '@/constants/constants';
import notificationService from '@/services/notification.service';
import { Group } from '@/models/group.model';

export class GroupInvitationService {
  private groupRepository: GroupRepository;

  constructor() {
    this.groupRepository = new GroupRepository();
  }

  // --- HÀM NÀY ĐÃ SỬA: CHẠY SQL TRỰC TIẾP (RAW QUERY) ---
  async sendInvitation(userId: number, groupId: number, inviteeId: number, message?: string) {
    // 1. Kiểm tra nhóm tồn tại
    const group = await this.groupRepository.getGroupById(groupId);
    if (!group) return { status: 'not-found' };

    // 2. Kiểm tra quyền người mời
    const inviterIsMember = await this.groupRepository.checkMembership(groupId, userId);
    if (!inviterIsMember) return { status: 'not-member' };

    if (userId == inviteeId) return { status: 'self' };

    // 3. Kiểm tra người được mời đã trong nhóm chưa
    const isMember = await this.groupRepository.checkMembership(groupId, inviteeId);
    if (isMember) return { status: 'already-member' };

    // 4. Kiểm tra lời mời đã tồn tại chưa
    const existing = await groupInvitationRepository.findByGroupAndInvitee(groupId, inviteeId);
    if (existing) {
      return {
        status: 'pending',
        invitation: {
          idInvitation: existing.idInvitation,
          inviter: existing.inviter,
          invitee: existing.invitee,
          message: existing.message,
          createdAt: existing.createdAt,
          needAdminApprove: existing.needAdminApprove || false,
        }
      };
    }

    // 5. --- THỰC THI INSERT BẰNG RAW SQL (KHÔNG DÙNG REPOSITORY) ---
    // Logic này đảm bảo 100% không bị lỗi "invalid syntax"
    
    let needAdminApprove = true;
    if (group.createdBy && group.createdBy.idUser == userId) {
      needAdminApprove = false;
    }

    // Câu lệnh SQL cứng, fix chặt vị trí tham số
    const query = `
      INSERT INTO group_invitation ("idGroup", inviter, invitee, message, "needAdminApprove", status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING "idInvitation"
    `;

    const params = [
      groupId,                        // $1 -> idGroup (integer)
      userId,                         // $2 -> inviter (integer)
      inviteeId,                      // $3 -> invitee (integer)
      message || null,                // $4 -> message (text)
      needAdminApprove,               // $5 -> needAdminApprove (boolean)
      GroupInvitationStatus.PENDING   // $6 -> status (varchar)
    ];

    let invId;
    try {
      const result = await AppDataSource.query(query, params);
      invId = result[0]?.idInvitation; // Lấy ID vừa tạo
    } catch (err) {
      console.error('[BACKEND] Insert Raw SQL Failed:', err);
      throw err;
    }
        console.log('Received sendInvitation request with body22222222');
    // 6. Lấy lại dữ liệu đầy đủ để trả về Frontend
    // (Lúc này data đã nằm trong DB rồi, nên gọi repo findById sẽ an toàn)
    const inv = await groupInvitationRepository.findById(invId);
    if (!inv) return { status: 'error' };

    // 7. Gửi thông báo (Notification)
    const groupName = group.name; // Lấy tên nhóm từ biến group ở bước 1 cho chắc ăn
    try {
      await notificationService.createGroupInviteNotification(userId, inviteeId, groupId, groupName);
    } catch (error) {
      console.error('Failed to create notification:', error);
    }

    // 8. Map dữ liệu trả về (Format lại User object)
    const mapUser = (u: any): UserResponse => ({
      idUser: u?.idUser,
      name: u?.name || u?.fullName,
      email: u?.email,
      avatarUrl: u?.avatarUrl,
      phone: u?.phone,
      gender: u?.gender,
      birthday: u?.birthday,
      createdAt: u?.createdAt
    });

    return {
      status: 'invited',
      idInvitation: inv.idInvitation,
      message: inv.message,
      inviter: mapUser(inv.inviter),
      invitee: mapUser(inv.invitee),
      createdAt: inv.createdAt,
      needAdminApprove: inv.needAdminApprove || false,
    };
  }
  // -------------------------------------------------------------

  // --- CÁC HÀM DƯỚI ĐÂY GIỮ NGUYÊN (NHƯNG SỬA NHẸ PHẦN MAP DỮ LIỆU) ---
  
  async getPendingMembers(groupId: number) {
    const items = await groupInvitationRepository.getPendingMembers(groupId);
    const mapUser = (u: any): UserResponse => ({
      idUser: u?.idUser,
      name: u?.name || u?.fullName,
      email: u?.email,
      avatarUrl: u?.avatarUrl,
      phone: u?.phone,
      gender: u?.gender,
      birthday: u?.birthday,
      createdAt: u?.createdAt
    });
    return items.map((inv: any) => ({
      idInvitation: inv.idInvitation,
      message: inv.message,
      createdAt: inv.createdAt,
      status: inv.status,
      // Fix lỗi map: kiểm tra cả 'group' (mới) và 'idGroup' (cũ)
      idGroup: (inv.group || inv.idGroup) && { 
        idGroup: (inv.group || inv.idGroup).idGroup, 
        name: (inv.group || inv.idGroup).name 
      },
      inviter: mapUser(inv.inviter),
      invitee: mapUser(inv.invitee),
    }));
  }

  async getInvitesNeedAdminApprove(adminId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return await groupInvitationRepository.getInvitesNeedAdminApprove(adminId, skip, limit);
  }

  async getInvitesWaitingForAdmin(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    return await groupInvitationRepository.getInvitesWaitingForAdmin(userId, skip, limit);
  }

  async deleteInvitation(userId: number, invitationId: number) {
    const inv = await groupInvitationRepository.findById(invitationId);
    if (!inv) throw new AppError(404, 'Invitation not found');

    let isAdmin = false;
    // Fix lỗi check admin: lấy group từ inv.group hoặc inv.idGroup
    const groupData = inv.group || (inv as any).idGroup;
    
    if (groupData && groupData.idGroup) {
      isAdmin = await this.groupRepository.checkAdmin(groupData.idGroup, userId);
    }

    if (inv.inviter.idUser !== userId && inv.invitee.idUser !== userId && !isAdmin) {
      throw new AppError(403, 'Not allowed');
    }

    await groupInvitationRepository.deleteInvitationById(invitationId);
    return { message: 'Invitation removed' };
  }

  async acceptInvitation(userId: number, invitationId: number) {
    const inv = await groupInvitationRepository.findById(invitationId);
    if (!inv) throw new AppError(404, 'Invitation not found');

    let isAdmin = false;
    const groupData = inv.group || (inv as any).idGroup;
    if (groupData && groupData.idGroup) {
      isAdmin = await this.groupRepository.checkAdmin(groupData.idGroup, userId);
    }

    if (inv.invitee.idUser !== userId && !isAdmin) throw new AppError(403, 'Not allowed');

    const groupId = groupData?.idGroup;
    const groupName = groupData?.name;
    const creatorId = groupData?.createdBy?.idUser;

    if (!groupId) throw new AppError(500, 'Group info missing in invitation');

    if (isAdmin) {
      await this.groupRepository.addMember(groupId, inv.invitee.idUser);
      await groupInvitationRepository.deleteInvitationById(invitationId);
      try {
        if (inv.invitee) {
          const members = await this.groupRepository.getGroupMembers(groupId);
          const memberIds = members.map(m => m.user.idUser);
          await notificationService.createGroupMemberJoinedNotification(
            inv.invitee.idUser, groupId, groupName || '', memberIds
          );
        }
      } catch (error) { console.error(error); }
      return { message: 'Admin đã duyệt, thành viên đã được thêm vào nhóm' };
    } else if (inv.needAdminApprove) {
      await groupInvitationRepository.updateInvitationStatus(invitationId, GroupInvitationStatus.ACCEPTED);
      try {
        if (inv.invitee && creatorId) {
          await notificationService.createGroupInviteAdminNotification(
            inv.invitee.idUser, creatorId, groupId, groupName || ''
          );
        }
      } catch (error) { console.error(error); }
      return { message: 'Đã xác nhận, chờ admin duyệt' };
    } else {
      await this.groupRepository.addMember(groupId, userId);
      await groupInvitationRepository.deleteInvitationById(invitationId);
      try {
        if (inv.invitee) {
          const members = await this.groupRepository.getGroupMembers(groupId);
          const memberIds = members.map(m => m.user.idUser);
          await notificationService.createGroupMemberJoinedNotification(
            userId, groupId, groupName || '', memberIds
          );
        }
      } catch (error) { console.error(error); }
      return { message: 'Joined group successfully' };
    }
  }

  async getReceivedInvites(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const { items, total } = await groupInvitationRepository.getReceivedInvitesPaginated(userId, skip, limit);
    const mapUser = (u: any): UserResponse => ({
      idUser: u?.idUser,
      name: u?.name || u?.fullName,
      email: u?.email,
      avatarUrl: u?.avatarUrl,
      phone: u?.phone,
      gender: u?.gender,
      birthday: u?.birthday,
      createdAt: u?.createdAt
    });
    const mapped = items.map((inv: any) => ({
      idInvitation: inv.idInvitation,
      message: inv.message,
      createdAt: inv.createdAt,
      status: inv.status,
      // Fix map
      idGroup: (inv.group || inv.idGroup) && { 
        idGroup: (inv.group || inv.idGroup).idGroup, 
        name: (inv.group || inv.idGroup).name 
      },
      inviter: mapUser(inv.inviter),
      invitee: mapUser(inv.invitee),
    }));
    return { items: mapped, total };
  }

  async getSentInvites(userId: number, page = 1, limit = 10) {
    const skip = (page - 1) * limit;
    const { items, total } = await groupInvitationRepository.getSentInvitesPaginated(userId, skip, limit);
    const mapUser = (u: any): UserResponse => ({
      idUser: u?.idUser,
      name: u?.name || u?.fullName,
      email: u?.email,
      avatarUrl: u?.avatarUrl,
      phone: u?.phone,
      gender: u?.gender,
      birthday: u?.birthday,
      createdAt: u?.createdAt
    });
    const mapped = items.map((inv: any) => ({
      idInvitation: inv.idInvitation,
      message: inv.message,
      createdAt: inv.createdAt,
      // Fix map
      idGroup: (inv.group || inv.idGroup) && { 
        idGroup: (inv.group || inv.idGroup).idGroup, 
        name: (inv.group || inv.idGroup).name 
      },
      inviter: mapUser(inv.inviter),
      invitee: mapUser(inv.invitee)
    }));
    return { items: mapped, total };
  }
}

export default new GroupInvitationService();