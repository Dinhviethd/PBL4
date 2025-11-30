import groupInvitationRepository from '@/repositories/groupInvitation.repository';
import { GroupRepository } from '@/repositories/group.repository';
import { AppError } from '@/utils/error.response';
import { UserResponse } from '@/DTOs/user.dto';
import { th } from 'zod/v4/locales/index.cjs';

export class GroupInvitationService {
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

    // Only inviter or invitee can delete (withdraw or reject)
    if (inv.inviter.idUser !== userId && inv.invitee.idUser !== userId) {
      throw new AppError(403, 'Not allowed');
    }

    await groupInvitationRepository.deleteInvitationById(invitationId);
    return { message: 'Invitation removed' };
  }

  async acceptInvitation(userId: number, invitationId: number) {
    const inv = await groupInvitationRepository.findById(invitationId);
    if (!inv) throw new AppError(404, 'Invitation not found');

    if (inv.invitee.idUser !== userId) throw new AppError(403, 'Not allowed');

    // Chỉ khi accept mới thêm vào nhóm
    await this.groupRepository.addMember(inv.idGroup.idGroup, userId);
    // Xóa invitation
    await groupInvitationRepository.deleteInvitationById(invitationId);
    return { message: 'Joined group successfully' };
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
      idGroup: inv.idGroup && { idGroup: inv.idGroup.idGroup, name: inv.idGroup.name },
      inviter: mapUser(inv.inviter),
      invitee: mapUser(inv.invitee)
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
