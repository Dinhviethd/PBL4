

import { GroupRepository } from '@/repositories/group.repository';
import { AppDataSource } from '@/configs/database.config';
import { User } from '@/models/users.model';
import { AppError } from '@/utils/error.response';
import { UserRole } from '@/constants/constants';
import { wsService } from './websocket.service';

export class GroupService {
    async getGroupById(groupId: number) {
      const group = await this.groupRepository.findGroupById(groupId);
      if (!group) return null;
      return {
        idGroup: group.idGroup,
        name: group.name,
        createdAt: group.createdAt,
        statusGroup: group.statusGroup,
        createdBy: group.createdBy ? {
          idUser: group.createdBy.idUser,
          name: group.createdBy.name,
          email: group.createdBy.email
        } : null
      };
    }
  private groupRepository: GroupRepository;
  private userRepository;

  constructor() {
    this.groupRepository = new GroupRepository();
    this.userRepository = AppDataSource.getRepository(User);
  }
    async updateGroup(groupId: number, userId: number, update: { name?: string; statusGroup?: boolean }) {
    // Kiểm tra quyền admin
    const member = await this.groupRepository.findGroupMember(groupId, userId);
    if (!member || member.role !== UserRole.ADMIN) {
      throw new AppError(403, 'Only admin can update group');
    }
    const group = await this.groupRepository.updateGroup(groupId, update);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }
    // Lấy danh sách thành viên để thông báo
    const members = await this.groupRepository.getGroupMembers(groupId);
    members.forEach(member => {
      wsService.sendToUser(member.user.idUser, {
        type: 'GROUP_UPDATED',
        data: {
          groupId: groupId,
          name: group.name,
          statusGroup: group.statusGroup,
          updatedBy: userId
        }
      });
    });
    return {
      idGroup: group.idGroup,
      name: group.name,
      statusGroup: group.statusGroup
    };
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

    // Luôn set role là 'user' khi thêm thành viên mới
    let role: UserRole = UserRole.USER;
    console.log('[AddMember] groupId:', groupId, 'targetUserId:', targetUserId, 'requesterId:', requesterId, 'role:', role);

    await this.groupRepository.addUserToGroup(group, targetUser, role, requesterMember.user);

    // Gửi thông báo qua WebSocket
    if (role === UserRole.USER) {
      // Thông báo cho user được thêm
      wsService.sendToUser(targetUserId, {
        type: 'GROUP_ADDED',
        data: {
          groupId: group.idGroup,
          groupName: group.name,
          addedBy: requesterMember.user
        }
      });
    }

    return {
      message: role === UserRole.USER ? 'User added to group successfully' : 'User invitation sent, waiting for admin approval',
      role
    };
  }

  async leaveGroup(groupId: number, userId: number) {
    const member = await this.groupRepository.findGroupMember(groupId, userId);
    if (!member) {
      throw new AppError(404, 'You are not a member of this group');
    }

    // Admin không thể rời nhóm, chỉ được phép xóa nhóm
    if (member.role === UserRole.ADMIN) {
      throw new AppError(400, 'Admin cannot leave the group. Please delete the group instead.');
    }

    await this.groupRepository.removeUserFromGroup(groupId, userId);

    // Thông báo cho các thành viên khác
    const members = await this.groupRepository.getGroupMembers(groupId);
    members.forEach(member => {
      wsService.sendToUser(member.user.idUser, {
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

    // Thông báo cho các thành viên còn lại (trừ admin và user bị kick)
    const members = await this.groupRepository.getGroupMembers(groupId);
    members.forEach(member => {
      if (member.user.idUser !== targetUserId && member.user.idUser !== adminId) {
        wsService.sendToUser(member.user.idUser, {
          type: 'GROUP_MEMBER_KICKED',
          data: {
            groupId: groupId,
            kickedUserId: targetUserId,
            kickedBy: adminId
          }
        });
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
      if (member.user.idUser !== adminId) {
        wsService.sendToUser(member.user.idUser, {
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
      idUser: member.user.idUser,
      name: member.user.name,
      email: member.user.email,
      avatarUrl: member.user.avatarUrl,
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
      idGroup: ug.group.idGroup,
      name: ug.group.name,
      createdAt: ug.group.createdAt,
      role: ug.role,
      createdBy: {
        idUser: ug.group.createdBy?.idUser,
        name: ug.group.createdBy?.name
      }
    }));
  }
  
  async getUserGroupsWithSearch(userId: number, searchTerm: string = '', page: number = 1, limit: number = 10) {
    const { items, total } = await this.groupRepository.getUserGroupsWithSearch(userId, searchTerm, page, limit);
    return {
      items: items.map(ug => ({
        idGroup: ug.group.idGroup,
        name: ug.group.name,
        createdAt: ug.group.createdAt,
        role: ug.role,
        createdBy: {
          idUser: ug.group.createdBy?.idUser,
          name: ug.group.createdBy?.name
        }
      })),
      total
    };
  }
}
