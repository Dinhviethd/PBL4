import { Repository } from 'typeorm';
import { AppDataSource } from '@/configs/database.config';
import { Group } from '@/models/group.model';
import { GroupUser } from '@/models/group_user';
import { User } from '@/models/users.model';
import { UserRole } from '@/constants/constants';

export class GroupRepository {
  private groupRepo: Repository<Group>;
  private groupUserRepo: Repository<GroupUser>;

  constructor() {
    this.groupRepo = AppDataSource.getRepository(Group);
    this.groupUserRepo = AppDataSource.getRepository(GroupUser);
  }

  async createGroup(name: string, createdBy: User): Promise<Group> {
    const group = this.groupRepo.create({
      name,
      createdBy,
      statusGroup: true
    });
    return await this.groupRepo.save(group);
  }

  async findGroupById(idGroup: number): Promise<Group | null> {
    return await this.groupRepo.findOne({
      where: { idGroup },
      relations: ['createdBy']
    });
  }

  async addUserToGroup(group: Group, user: User, role: UserRole, actionBy?: User): Promise<GroupUser> {
    const groupUser = this.groupUserRepo.create({
      idGroup: group,
      idUser: user,
      role,
      actionBy
    });
    return await this.groupUserRepo.save(groupUser);
  }

  async findGroupMember(idGroup: number, idUser: number): Promise<GroupUser | null> {
    return await this.groupUserRepo.findOne({
      where: {
        idGroup: { idGroup },
        idUser: { idUser }
      },
      relations: ['idGroup', 'idUser', 'actionBy']
    });
  }

  async getGroupMembers(idGroup: number): Promise<GroupUser[]> {
    return await this.groupUserRepo.find({
      where: { idGroup: { idGroup } },
      relations: ['idUser', 'actionBy'],
      order: { role: 'DESC' }
    });
  }

  async updateMemberRole(idGroupUser: number, role: UserRole): Promise<void> {
    await this.groupUserRepo.update(idGroupUser, { role });
  }

  async removeUserFromGroup(idGroup: number, idUser: number): Promise<void> {
    await this.groupUserRepo.delete({
      idGroup: { idGroup },
      idUser: { idUser }
    });
  }

  async deleteGroup(idGroup: number): Promise<void> {
    // Xóa tất cả thành viên trước
    await this.groupUserRepo.delete({ idGroup: { idGroup } });
    // Xóa group
    await this.groupRepo.delete(idGroup);
  }

  async getUserGroups(idUser: number): Promise<GroupUser[]> {
    return await this.groupUserRepo.find({
      where: { idUser: { idUser } },
      relations: ['idGroup', 'idGroup.createdBy'],
      order: { idGroup: { createdAt: 'DESC' } }
    });
  }

  async getPendingMembers(idGroup: number): Promise<GroupUser[]> {
    return await this.groupUserRepo.find({
      where: {
        idGroup: { idGroup },
        role: UserRole.PENDING
      },
      relations: ['idUser', 'actionBy']
    });
  }
}