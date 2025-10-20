import { GroupRepository } from '@/repositories/group.repository';
import { AppDataSource } from '@/configs/database.config';
import { User } from '@/models/users.model';
import { AppError } from '@/utils/error.response';
import { UserRole } from '@/constants/constants';
import { wsService } from './websocket.service';

export class GroupService {
  private groupRepository: GroupRepository;
  private userRepository;

  constructor() {
    this.groupRepository = new GroupRepository();
    this.userRepository = AppDataSource.getRepository(User);
  }

  async createGroup(name: string, creatorId: number) {
    const creator = await this.userRepository.findOne({
      where: { idUser: creatorId }
    });

    if (!creator) {
      throw new AppError(404, 'User not found');
    }

    // Tạo group
    const group = await this.groupRepository.createGroup(name, creator);

    // Thêm người tạo làm admin
    await this.groupRepository.addUserToGroup(group, creator, UserRole.ADMIN);

    return {
      idGroup: group.idGroup,
      name: group.name,
      createdAt: group.createdAt,
      createdBy: {
        idUser: creator.idUser,
        name: creator.name,
        email: creator.email
      }
    };
  }

  async addMemberToGroup(groupId: number, targetUserId: number, requesterId: number) {
    // Kiểm tra group tồn tại
    const group = await this.groupRepository.findGroupById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }

    // Kiểm tra quyền của người thêm
    const requesterMember = await this.groupRepository.findGroupMember(groupId, requesterId);
    if (!requesterMember) {
      throw new AppError(403, 'You are not a member of this group');
    }

    // Kiểm tra user được thêm có tồn tại
    const targetUser = await this.userRepository.findOne({
      where: { idUser: targetUserId }
    });
    if (!targetUser) {
      throw new AppError(404, 'User not found');
    }

    // Kiểm tra user đã trong group chưa
    const existingMember = await this.groupRepository.findGroupMember(groupId, targetUserId);
    if (existingMember) {
      throw new AppError(400, 'User is already in the group');
    }

    // Xác định role dựa trên người thêm
    let role: UserRole;
    if (requesterMember.role === UserRole.ADMIN) {
      role = UserRole.USER;
    } else if (requesterMember.role === UserRole.USER) {
      role = UserRole.PENDING;
    } else {
      throw new AppError(403, 'You do not have permission to add members');
    }

    await this.groupRepository.addUserToGroup(group, targetUser, role, requesterMember.idUser);

    // Gửi thông báo qua WebSocket
    if (role === UserRole.USER) {
      // Thông báo cho user được thêm
      wsService.sendToUser(targetUserId, {
        type: 'GROUP_ADDED',
        data: {
          groupId: group.idGroup,
          groupName: group.name,
          addedBy: requesterMember.idUser
        }
      });
    }

    return {
      message: role === UserRole.USER ? 'User added to group successfully' : 'User invitation sent, waiting for admin approval',
      role
    };
  }

  async approvePendingMember(groupId: number, targetUserId: number, adminId: number) {
    // Kiểm tra admin có quyền không
    const adminMember = await this.groupRepository.findGroupMember(groupId, adminId);
    if (!adminMember || adminMember.role !== UserRole.ADMIN) {
      throw new AppError(403, 'Only admin can approve members');
    }

    // Kiểm tra pending member
    const pendingMember = await this.groupRepository.findGroupMember(groupId, targetUserId);
    if (!pendingMember) {
      throw new AppError(404, 'Pending member not found');
    }

    if (pendingMember.role !== UserRole.PENDING) {
      throw new AppError(400, 'User is not pending approval');
    }

    // Cập nhật role
    await this.groupRepository.updateMemberRole(pendingMember.idGroup_User, UserRole.USER);

    // Thông báo cho user được duyệt
    wsService.sendToUser(targetUserId, {
      type: 'GROUP_APPROVED',
      data: {
        groupId: groupId,
        approvedBy: adminId
      }
    });

    return { message: 'Member approved successfully' };
  }

  async leaveGroup(groupId: number, userId: number) {
    const member = await this.groupRepository.findGroupMember(groupId, userId);
    if (!member) {
      throw new AppError(404, 'You are not a member of this group');
    }

    // Admin không thể rời nhóm nếu còn thành viên khác
    if (member.role === UserRole.ADMIN) {
      const allMembers = await this.groupRepository.getGroupMembers(groupId);
      const otherMembers = allMembers.filter(m => m.idUser.idUser !== userId);
      
      if (otherMembers.length > 0) {
        throw new AppError(400, 'Admin cannot leave group while there are other members. Please delete the group or transfer admin role first.');
      }
    }

    await this.groupRepository.removeUserFromGroup(groupId, userId);

    // Thông báo cho các thành viên khác
    const members = await this.groupRepository.getGroupMembers(groupId);
    members.forEach(member => {
      wsService.sendToUser(member.idUser.idUser, {
        type: 'USER_LEFT_GROUP',
        data: {
          groupId: groupId,
          leftUserId: userId
        }
      });
    });

    return { message: 'Left group successfully' };
  }

  async kickMember(groupId: number, targetUserId: number, adminId: number) {
    // Kiểm tra quyền admin
    const adminMember = await this.groupRepository.findGroupMember(groupId, adminId);
    if (!adminMember || adminMember.role !== UserRole.ADMIN) {
      throw new AppError(403, 'Only admin can kick members');
    }

    // Kiểm tra member được kick
    const targetMember = await this.groupRepository.findGroupMember(groupId, targetUserId);
    if (!targetMember) {
      throw new AppError(404, 'Member not found in group');
    }

    if (targetMember.role === UserRole.ADMIN) {
      throw new AppError(400, 'Cannot kick another admin');
    }

    await this.groupRepository.removeUserFromGroup(groupId, targetUserId);

    // Thông báo cho user bị kick
    wsService.sendToUser(targetUserId, {
      type: 'KICKED_FROM_GROUP',
      data: {
        groupId: groupId,
        kickedBy: adminId
      }
    });

    return { message: 'Member kicked successfully' };
  }

  async deleteGroup(groupId: number, adminId: number) {
    // Kiểm tra quyền admin
    const adminMember = await this.groupRepository.findGroupMember(groupId, adminId);
    if (!adminMember || adminMember.role !== UserRole.ADMIN) {
      throw new AppError(403, 'Only admin can delete group');
    }

    // Lấy danh sách thành viên để thông báo
    const members = await this.groupRepository.getGroupMembers(groupId);

    // Xóa group
    await this.groupRepository.deleteGroup(groupId);

    // Thông báo cho tất cả thành viên
    members.forEach(member => {
      if (member.idUser.idUser !== adminId) {
        wsService.sendToUser(member.idUser.idUser, {
          type: 'GROUP_DELETED',
          data: {
            groupId: groupId,
            deletedBy: adminId
          }
        });
      }
    });

    return { message: 'Group deleted successfully' };
  }

  async getGroupMembers(groupId: number, userId: number) {
    // Kiểm tra user có trong group không
    const member = await this.groupRepository.findGroupMember(groupId, userId);
    if (!member) {
      throw new AppError(403, 'You are not a member of this group');
    }

    const members = await this.groupRepository.getGroupMembers(groupId);
    
    return members.map(member => ({
      idUser: member.idUser.idUser,
      name: member.idUser.name,
      email: member.idUser.email,
      avatarUrl: member.idUser.avatarUrl,
      role: member.role,
      addedBy: member.actionBy ? {
        idUser: member.actionBy.idUser,
        name: member.actionBy.name
      } : null
    }));
  }

  async getUserGroups(userId: number) {
    const userGroups = await this.groupRepository.getUserGroups(userId);
    
    return userGroups.map(ug => ({
      idGroup: ug.idGroup.idGroup,
      name: ug.idGroup.name,
      createdAt: ug.idGroup.createdAt,
      role: ug.role,
      createdBy: {
        idUser: ug.idGroup.createdBy?.idUser,
        name: ug.idGroup.createdBy?.name
      }
    }));
  }

  async getPendingMembers(groupId: number, adminId: number) {
    // Kiểm tra quyền admin
    const adminMember = await this.groupRepository.findGroupMember(groupId, adminId);
    if (!adminMember || adminMember.role !== UserRole.ADMIN) {
      throw new AppError(403, 'Only admin can view pending members');
    }

    const pendingMembers = await this.groupRepository.getPendingMembers(groupId);
    
    return pendingMembers.map(member => ({
      idUser: member.idUser.idUser,
      name: member.idUser.name,
      email: member.idUser.email,
      avatarUrl: member.idUser.avatarUrl,
      addedBy: member.actionBy ? {
        idUser: member.actionBy.idUser,
        name: member.actionBy.name
      } : null
    }));
  }
}