import groupRepository from '@/repositories/group.repository'
import { AppError } from '@/utils/error.response';
import { CreateGroupDTO, AddMemberDTO, UpdateGroupDTO } from '@/schemas/group.schema';
import { UserRole } from '@/constants/constants';

class GroupService {
  private readonly groupRepository = groupRepository;

  async createGroup(creatorId: number, data: CreateGroupDTO) {
    const { name, memberIds } = data;
    const group = await this.groupRepository.createGroup(name, creatorId);
    
    for (const memberId of memberIds) {
      if (memberId !== creatorId) {
        await this.groupRepository.addMember(group.idGroup, memberId, UserRole.USER, creatorId);
      }
    }

    return group;
  }

  async addMember(userId: number, groupId: number, data: AddMemberDTO, addedById: number) {
    const group = await this.groupRepository.getGroupById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    // Kiểm tra người thêm có phải là member không
    const adderIsMember = await this.groupRepository.checkMembership(groupId, addedById);
    if (!adderIsMember) {
      throw new AppError(403, 'You are not a member of this group');
    }

    // Kiểm tra người được thêm đã là member chưa
    const isExist = await this.groupRepository.checkMembership(groupId, data.userId);
    if (isExist) {
      throw new AppError(400, 'User is already a member');
    }

    // Lấy role của người thêm
    const adderRole = await this.groupRepository.getMemberRole(groupId, addedById);
    
    let newMemberRole: UserRole;
    let message: string;

    if (adderRole === UserRole.ADMIN) {
      // Admin thêm → role USER luôn
      newMemberRole = UserRole.USER;
      message = 'Member added successfully';
    } else if (adderRole === UserRole.USER) {
      // User thường thêm → role PENDING, cần admin duyệt
      newMemberRole = UserRole.PENDING;
      message = 'Member added to pending list, waiting for admin approval';
    } else {
      throw new AppError(403, 'You do not have permission to add members');
    }

    await this.groupRepository.addMember(groupId, data.userId, newMemberRole, addedById);
    return { message, role: newMemberRole };
  }

  async approveMember(userId: number, groupId: number, memberId: number) {
    const group = await this.groupRepository.getGroupById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    // Chỉ admin mới có thể duyệt
    const role = await this.groupRepository.getMemberRole(groupId, userId);
    if (role !== UserRole.ADMIN) {
      throw new AppError(403, 'Only admins can approve members');
    }

    // Kiểm tra member có ở trạng thái pending không
    const memberRole = await this.groupRepository.getMemberRole(groupId, memberId);
    if (memberRole !== UserRole.PENDING) {
      throw new AppError(400, 'Member is not in pending status');
    }

    // Cập nhật role thành USER
    await this.groupRepository.updateMemberRole(groupId, memberId, UserRole.USER);
    return { message: 'Member approved successfully' };
  }

  async rejectMember(userId: number, groupId: number, memberId: number) {
    const group = await this.groupRepository.getGroupById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    // Chỉ admin mới có thể từ chối
    const role = await this.groupRepository.getMemberRole(groupId, userId);
    if (role !== UserRole.ADMIN) {
      throw new AppError(403, 'Only admins can reject members');
    }

    // Kiểm tra member có ở trạng thái pending không
    const memberRole = await this.groupRepository.getMemberRole(groupId, memberId);
    if (memberRole !== UserRole.PENDING) {
      throw new AppError(400, 'Member is not in pending status');
    }

    // Xóa khỏi nhóm
    await this.groupRepository.removeMember(groupId, memberId);
    return { message: 'Member rejected and removed' };
  }

  async getPendingMembers(userId: number, groupId: number) {
    // Chỉ admin mới có thể xem danh sách pending
    const role = await this.groupRepository.getMemberRole(groupId, userId);
    if (role !== UserRole.ADMIN) {
      throw new AppError(403, 'Only admins can view pending members');
    }

    return await this.groupRepository.getPendingMembers(groupId);
  }

  async removeMember(userId: number, groupId: number, memberId: number) {
    const group = await this.groupRepository.getGroupById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    const role = await this.groupRepository.getMemberRole(groupId, userId);
    if (role !== UserRole.ADMIN && userId !== memberId) {
      throw new AppError(403, 'You do not have permission to remove this member');
    }

    await this.groupRepository.removeMember(groupId, memberId);
    return { message: 'Member removed successfully' };
  }

  async getGroupDetails(userId: number, groupId: number) {
    const isMember = await this.groupRepository.checkMembership(groupId, userId);
    if (!isMember) {
      throw new AppError(403, 'You are not a member of this group');
    }

    const group = await this.groupRepository.getGroupById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    const members = await this.groupRepository.getGroupMembers(groupId);
    const userRole = await this.groupRepository.getMemberRole(groupId, userId);

    return {
      ...group,
      members: members.map(m => ({
        ...m.idUser,
        role: m.role
      })),
      userRole
    };
  }

  async getUserGroups(userId: number) {
    return await this.groupRepository.getUserGroups(userId);
  }

  async updateGroup(userId: number, groupId: number, data: UpdateGroupDTO) {
    const role = await this.groupRepository.getMemberRole(groupId, userId);
    if (role !== UserRole.ADMIN) {
      throw new AppError(403, 'Only admins can update group');
    }

    await this.groupRepository.updateGroup(groupId, data.name!);
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

    await this.groupRepository.deleteGroup(groupId);
    return { message: 'Group deleted successfully' };
  }
}

export default new GroupService();