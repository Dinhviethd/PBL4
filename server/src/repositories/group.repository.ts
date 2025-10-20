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
    return await this.groupUserRepo
      .createQueryBuilder('gu')
      .leftJoinAndSelect('gu.idGroup', 'g')
      .leftJoinAndSelect('gu.idUser', 'u')
      .leftJoinAndSelect('gu.actionBy', 'actionBy')
      .where('g.idGroup = :idGroup', { idGroup })
      .andWhere('u.idUser = :idUser', { idUser })
      .getOne();
  }

  async getGroupMembers(idGroup: number): Promise<GroupUser[]> {
    return await this.groupUserRepo
      .createQueryBuilder('gu')
      .leftJoinAndSelect('gu.idUser', 'u')
      .leftJoinAndSelect('gu.actionBy', 'actionBy')
      .leftJoinAndSelect('gu.idGroup', 'g')
      .where('g.idGroup = :idGroup', { idGroup })
      .orderBy('gu.role', 'DESC')
      .getMany();
  }

  async updateMemberRole(idGroupUser: number, role: UserRole): Promise<void> {
    await this.groupUserRepo.update(idGroupUser, { role });
  }

  async removeUserFromGroup(idGroup: number, idUser: number): Promise<void> {
    await this.groupUserRepo
      .createQueryBuilder()
      .delete()
      .from(GroupUser)
      .where('idGroup = :idGroup', { idGroup })
      .andWhere('idUser = :idUser', { idUser })
      .execute();
  }

  async deleteGroup(idGroup: number): Promise<void> {
    // Xóa tất cả thành viên trước
    await this.groupUserRepo.delete({ idGroup: { idGroup } });
    // Xóa group
    await this.groupRepo.delete(idGroup);
  }

  async getUserGroups(idUser: number): Promise<GroupUser[]> {
    // Sử dụng QueryBuilder thay vì nested where
    return await this.groupUserRepo
      .createQueryBuilder('gu')
      .leftJoinAndSelect('gu.idGroup', 'g')
      .leftJoinAndSelect('g.createdBy', 'creator')
      .leftJoinAndSelect('gu.idUser', 'u')
      .where('u.idUser = :idUser', { idUser })
      .andWhere('gu.role IN (:...roles)', { roles: [UserRole.ADMIN, UserRole.USER] }) // Chỉ lấy member đã được approve
      .orderBy('g.createdAt', 'DESC')
      .getMany();
  }

  async getPendingMembers(idGroup: number): Promise<GroupUser[]> {
    return await this.groupUserRepo
      .createQueryBuilder('gu')
      .leftJoinAndSelect('gu.idUser', 'u')
      .leftJoinAndSelect('gu.actionBy', 'actionBy')
      .leftJoinAndSelect('gu.idGroup', 'g')
      .where('g.idGroup = :idGroup', { idGroup })
      .andWhere('gu.role = :role', { role: UserRole.PENDING })
      .getMany();
  }
}