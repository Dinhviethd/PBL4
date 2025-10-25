import groupInvitationRepository from '@/repositories/groupInvitation.repository';
import { GroupRepository } from '@/repositories/group.repository';
import { AppError } from '@/utils/error.response';
import { UserResponse } from '@/DTOs/user.dto';
import { th } from 'zod/v4/locales/index.cjs';

export class GroupInvitationService {
  private groupRepository: GroupRepository;

  constructor() {
    this.groupRepository = new GroupRepository();
  }

  async sendInvitation(userId: number, groupId: number, inviteeId: number, message?: string) {
    const group = await this.groupRepository.getGroupById(groupId);
    if (!group) throw new AppError(404, 'Group not found');
    // inviter must be a member of the group
    const inviterIsMember = await this.groupRepository.checkMembership(groupId, userId);
    console.log('Inviter is member:', inviterIsMember);
    if (!inviterIsMember) throw new AppError(403, 'Only group members can send invitations');

    // cannot invite yourself
    if (userId === inviteeId) throw new AppError(400, 'Cannot invite yourself');

    // invitee must not already be a member
    const isMember = await this.groupRepository.checkMembership(groupId, inviteeId);
    if (isMember) throw new AppError(400, 'User is already a member');

    // prevent duplicate invitation
    const existing = await groupInvitationRepository.findByGroupAndInvitee(groupId, inviteeId);
    if (existing) throw new AppError(400, 'Invitation already exists');

    // Create invitation
    const inv = await groupInvitationRepository.createInvitation(groupId, userId, inviteeId, message);
    if (!inv) return null;

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
      idInvitation: inv.idInvitation,
      message: inv.message,
      createdAt: inv.createdAt,
      idGroup: inv.idGroup && { idGroup: inv.idGroup.idGroup, name: inv.idGroup.name },
      inviter: mapUser(inv.inviter),
      invitee: mapUser(inv.invitee)
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

    // Add member
    await this.groupRepository.addMember(inv.idGroup.idGroup, userId);
    // Delete invitation
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
