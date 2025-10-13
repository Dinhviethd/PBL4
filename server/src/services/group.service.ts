import groupRepository from '@/repositories/group.repository';
import { AppError } from '@/utils/error.response';
import { CreateGroupDTO, AddMemberDTO, UpdateGroupDTO } from '@/schemas/group.schema';
import { UserRole } from '@/constants/constants';

class GroupService {
  async createGroup(creatorId: number, data: CreateGroupDTO) {
    const { name, memberIds = [] } = data as any;
    const group = await groupRepository.createGroup(name, creatorId);
    if (!group) {
      throw new AppError(500, 'Failed to create group');
    }

    await groupRepository.addMember(group.idGroup, creatorId, UserRole.ADMIN);

    // sanitize memberIds and add members defensively
    const ids = Array.isArray(memberIds)
      ? memberIds.map((m: any) => (m === null || m === undefined ? null : Number(m))).filter((n: any) => Number.isFinite(n))
      : [];

    for (const m of ids) {
      const memberId = Number(m);
      if (memberId !== creatorId) {
        try {
          await groupRepository.addMember(group.idGroup, memberId, UserRole.USER);
        } catch (err: any) {
          // skip failing member adds (log if needed)
          console.warn(`Failed to add member ${memberId} to group ${group.idGroup}:`, err?.message || err);
        }
      }
    }
    return group;
  }

  async addMember(userId: number, groupId: number, data: AddMemberDTO) {
    const group = await groupRepository.getGroupById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }
    const role = await groupRepository.getMemberRole(groupId, userId);
    if (role !== UserRole.ADMIN) {
      throw new AppError(403, 'Only admins can add members');
    }
    const isExist = await groupRepository.checkMembership(groupId, data.userId);
    if (isExist) {
      throw new AppError(400, 'User is already a member');
    }

    await groupRepository.addMember(groupId, data.userId);
    return { message: 'Member added successfully' };
  }

  async removeMember(userId: number, groupId: number, memberId: number) {
    const group = await groupRepository.getGroupById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }
    const role = await groupRepository.getMemberRole(groupId, userId);
    if (role !== UserRole.ADMIN && userId !== memberId) {
      throw new AppError(403, 'You do not have permission to remove this member');
    }

    await groupRepository.removeMember(groupId, memberId);
    return { message: 'Member removed successfully' };
  }

  async getGroupDetails(userId: number, groupId: number) {
    const isMember = await groupRepository.checkMembership(groupId, userId);
    if (!isMember) {
      throw new AppError(403, 'You are not a member of this group');
    }

    const group = await groupRepository.getGroupById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }
    const members = await groupRepository.getGroupMembers(groupId);
    return {
      ...group,
      members: members.map(m => ({
        ...m.idUser,
        role: m.role
      }))
    };
  }

  async getUserGroups(userId: number) {
    return await groupRepository.getUserGroups(userId);
  }
  
  async getUserGroupsPaginated(userId: number, page = 1, limit = 10, q?: string, sort: 'asc'|'desc' = 'asc') {
    return await groupRepository.getUserGroupsPaginated(userId, page, limit, q, sort);
  }
  async updateGroup(userId: number, groupId: number, data: UpdateGroupDTO) {
    const role = await groupRepository.getMemberRole(groupId, userId);
    if (role !== UserRole.ADMIN) {
      throw new AppError(403, 'Only admins can update group');
    }

    await groupRepository.updateGroup(groupId, data.name!);
    return { message: 'Group updated successfully' };
  }

  async deleteGroup(userId: number, groupId: number) {
    const group = await groupRepository.getGroupById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }
    if (group.createdBy?.idUser !== userId) {
      throw new AppError(403, 'Only group creator can delete the group');
    }

    await groupRepository.deleteGroup(groupId);
    return { message: 'Group deleted successfully' };
  }
}

export default new GroupService();