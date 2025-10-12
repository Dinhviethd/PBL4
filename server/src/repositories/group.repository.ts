import { AppDataSource } from '@/configs/database.config';
import { Group } from '@/models/group.model';
import { GroupUser } from '@/models/group_user';
import { User } from '@/models/users.model';
import { UserRole } from '@/constants/constants';

class GroupRepository {
  private groupRepo = AppDataSource.getRepository(Group);
  private groupUserRepo = AppDataSource.getRepository(GroupUser);

  async createGroup(name: string, creatorId: number) {
    const group = this.groupRepo.create({
      name,
      createdBy: { idUser: creatorId } as User
    });
    return await this.groupRepo.save(group);
  }

  async addMember(groupId: number, userId: number, role: UserRole = UserRole.USER) {
    const groupUser = this.groupUserRepo.create({
      idGroup: { idGroup: groupId } as Group,
      idUser: { idUser: userId } as User,
      role
    });
    return await this.groupUserRepo.save(groupUser);
  }

  async removeMember(groupId: number, userId: number) {
    return await this.groupUserRepo.delete({
      idGroup: { idGroup: groupId } as any,
      idUser: { idUser: userId } as any
    });
  }

  async getGroupById(groupId: number) {
    return await this.groupRepo.findOne({
      where: { idGroup: groupId, statusGroup: true },
      relations: ['createdBy']
    });
  }

  async getGroupMembers(groupId: number) {
    return await this.groupUserRepo.find({
      where: { idGroup: { idGroup: groupId } as any },
      relations: ['idUser']
    });
  }

  async getUserGroups(userId: number) {
    const groupUsers = await this.groupUserRepo.find({
      where: { idUser: { idUser: userId } as any },
      relations: ['idGroup', 'idGroup.createdBy']
    });
    return groupUsers.map(gu => gu.idGroup).filter(g => g?.statusGroup);
  }

  async checkMembership(groupId: number, userId: number) {
    const member = await this.groupUserRepo.findOne({
      where: {
        idGroup: { idGroup: groupId } as any,
        idUser: { idUser: userId } as any
      }
    });
    return !!member;
  }

  async getMemberRole(groupId: number, userId: number) {
    const member = await this.groupUserRepo.findOne({
      where: {
        idGroup: { idGroup: groupId } as any,
        idUser: { idUser: userId } as any
      }
    });
    return member?.role;
  }

  async updateGroup(groupId: number, name: string) {
    return await this.groupRepo.update(groupId, { name });
  }

  async deleteGroup(groupId: number) {
    return await this.groupRepo.update(groupId, { statusGroup: false });
  }
}

export default new GroupRepository();