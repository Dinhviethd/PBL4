import groupInvitationRepository from '@/repositories/groupInvitation.repository';
import { GroupRepository } from '@/repositories/group.repository';
import { AppError } from '@/utils/error.response';
import { UserResponse } from '@/DTOs/user.dto';
import { th } from 'zod/v4/locales/index.cjs';
import { GroupInvitationStatus } from '@/constants/constants';

export class GroupInvitationService {
      // Lấy toàn bộ danh sách pending members của nhóm (không phân trang)
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
          idGroup: inv.idGroup && { idGroup: inv.idGroup.idGroup, name: inv.idGroup.name },
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
  private groupRepository: GroupRepository;

  constructor() {
    this.groupRepository = new GroupRepository();
  }

  async sendInvitation(userId: number, groupId: number, inviteeId: number, message?: string) {
    const group = await this.groupRepository.getGroupById(groupId);
    if (!group) return { status: 'not-found' };
    // inviter must be a member of the group
    const inviterIsMember = await this.groupRepository.checkMembership(groupId, userId);
    if (!inviterIsMember) return { status: 'not-member' };

    if (userId == inviteeId) return { status: 'self' };

    // invitee must not already be a member
    const isMember = await this.groupRepository.checkMembership(groupId, inviteeId);
    if (isMember) return { status: 'already-member' };

    // check existing invitation
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

    // Chỉ tạo invitation, không thêm vào nhóm
    const inv = await groupInvitationRepository.createInvitation(groupId, userId, inviteeId, message);
    if (!inv) return { status: 'error' };
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

  async deleteInvitation(userId: number, invitationId: number) {
    const inv = await groupInvitationRepository.findById(invitationId);
    if (!inv) throw new AppError(404, 'Invitation not found');

    // Cho phép admin của nhóm xóa lời mời
    let isAdmin = false;
    if (inv.idGroup && inv.idGroup.idGroup) {
      isAdmin = await this.groupRepository.checkAdmin(inv.idGroup.idGroup, userId);
    }

    // Chỉ inviter, invitee hoặc admin mới được xóa
    if (inv.inviter.idUser !== userId && inv.invitee.idUser !== userId && !isAdmin) {
      throw new AppError(403, 'Not allowed');
    }

    await groupInvitationRepository.deleteInvitationById(invitationId);
    return { message: 'Invitation removed' };
  }

  async acceptInvitation(userId: number, invitationId: number) {
    const inv = await groupInvitationRepository.findById(invitationId);
    if (!inv) throw new AppError(404, 'Invitation not found');

    // Kiểm tra nếu là admin thì cho phép duyệt trực tiếp
    let isAdmin = false;
    if (inv.idGroup && inv.idGroup.idGroup) {
      isAdmin = await this.groupRepository.checkAdmin(inv.idGroup.idGroup, userId);
    }

    if (inv.invitee.idUser !== userId && !isAdmin) throw new AppError(403, 'Not allowed');

    if (isAdmin) {
      // Admin duyệt trực tiếp, thêm thành viên vào nhóm và xóa lời mời
      await this.groupRepository.addMember(inv.idGroup.idGroup, inv.invitee.idUser);
      await groupInvitationRepository.deleteInvitationById(invitationId);
      return { message: 'Admin đã duyệt, thành viên đã được thêm vào nhóm' };
    } else if (inv.needAdminApprove) {
      // Nếu cần admin duyệt, chỉ chuyển status sang accepted
      await groupInvitationRepository.updateInvitationStatus(invitationId, GroupInvitationStatus.ACCEPTED);
      return { message: 'Đã xác nhận, chờ admin duyệt' };
    } else {
      await this.groupRepository.addMember(inv.idGroup.idGroup, userId);
      await groupInvitationRepository.deleteInvitationById(invitationId);
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
      idGroup: inv.idGroup && { idGroup: inv.idGroup.idGroup, name: inv.idGroup.name },
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
      idGroup: inv.idGroup && { idGroup: inv.idGroup.idGroup, name: inv.idGroup.name },
      inviter: mapUser(inv.inviter),
      invitee: mapUser(inv.invitee)
    }));
    return { items: mapped, total };
  }
}

export default new GroupInvitationService();
