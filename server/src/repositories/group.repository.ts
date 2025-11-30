import { Repository } from 'typeorm';
import { AppDataSource } from '@/configs/database.config';
import { GroupInvitation } from '@/models/group_invitation.model';
import { Group } from '@/models/group.model';
import { GroupUser } from '@/models/group_user';
import { UserRole } from '@/constants/constants';
import { User } from '@/models/users.model';

export class GroupRepository {
  private groupRepo: Repository<Group>;
  private groupUserRepo: Repository<GroupUser>;

  constructor() {
    this.groupRepo = AppDataSource.getRepository(Group);
    this.groupUserRepo = AppDataSource.getRepository(GroupUser);
  }
  async updateGroup(groupId: number, update: { name?: string; statusGroup?: boolean }): Promise<Group | null> {
    const group = await this.groupRepo.findOne({ where: { idGroup: groupId } });
    if (!group) return null;
    if (typeof update.name !== 'undefined') group.name = update.name;
    if (typeof update.statusGroup !== 'undefined') group.statusGroup = update.statusGroup;
    await this.groupRepo.save(group);
    return group;
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

  async addMember(groupId: number, userId: number, role: UserRole = UserRole.USER) {
    // Insert raw values to avoid updating related entities
    const result = await this.groupUserRepo.insert({
      group: (groupId as any),
      user: (userId as any),
      role
    } as any);
    const insertedId = (result.identifiers && result.identifiers[0] && result.identifiers[0].id) || result.raw?.insertId;
    return await this.groupUserRepo.findOne({ where: { id: insertedId } as any, relations: ['user', 'group'] });
  }

  async addUserToGroup(group: Group, user: User, role: UserRole, actionBy?: User): Promise<GroupUser> {
    const groupUser = this.groupUserRepo.create({
      group: group,
      user: user,
      role,
      actionBy
    });
    return await this.groupUserRepo.save(groupUser);
  }

  async findGroupMember(idGroup: number, idUser: number): Promise<GroupUser | null> {
    return await this.groupUserRepo
      .createQueryBuilder('gu')
      .leftJoinAndSelect('gu.group', 'g')
      .leftJoinAndSelect('gu.user', 'u')
      .leftJoinAndSelect('gu.actionBy', 'actionBy')
      .where('g.idGroup = :idGroup', { idGroup })
      .andWhere('u.idUser = :idUser', { idUser })
      .getOne();
  }

  async getGroupMembers(idGroup: number): Promise<GroupUser[]> {
    return await this.groupUserRepo
      .createQueryBuilder('gu')
      .leftJoinAndSelect('gu.user', 'u')
      .leftJoinAndSelect('gu.actionBy', 'actionBy')
      .leftJoinAndSelect('gu.group', 'g')
      .where('g.idGroup = :idGroup', { idGroup })
      .orderBy('gu.role', 'DESC')
      .getMany();
  }

  async updateMemberRole(id: number, role: UserRole): Promise<void> {
    await this.groupUserRepo.update(id, { role });
  }

  async removeUserFromGroup(idGroup: number, idUser: number): Promise<void> {
    await this.groupUserRepo
      .createQueryBuilder()
      .delete()
      .from(GroupUser)
      .where('group.idGroup = :idGroup', { idGroup })
      .andWhere('user.idUser = :idUser', { idUser })
      .execute();
  }

  async getGroupById(groupId: number) {
    return await this.groupRepo.findOne({
      where: { idGroup: groupId, statusGroup: true },
      relations: ['createdBy']
    });
  }

  async checkMembership(groupId: number, userId: number) {
    const member = await this.groupUserRepo.createQueryBuilder('gu')
      .leftJoin('gu.group', 'g')
      .leftJoin('gu.user', 'u')
      .where('g.idGroup = :groupId', { groupId })
      .andWhere('u.idUser = :userId', { userId })
      .getOne();
    return !!member;
  }
  async checkAdmin(groupId: number, userId: number): Promise<boolean> {
    const member = await this.groupUserRepo.createQueryBuilder('gu')
      .leftJoin('gu.group', 'g')
      .leftJoin('gu.user', 'u')
      .where('g.idGroup = :groupId', { groupId })
      .andWhere('u.idUser = :userId', { userId })
      .andWhere('gu.role = :role', { role: UserRole.ADMIN })
      .getOne();
    return !!member;
  }

  async deleteGroup(idGroup: number): Promise<void> {
    // Xóa tất cả lời mời vào nhóm
    const groupInvitationRepo = AppDataSource.getRepository(GroupInvitation);
    await groupInvitationRepo.delete({ idGroup: { idGroup } });
    // Xóa tất cả tin nhắn gửi đến nhóm
    const messageRepo = AppDataSource.getRepository(require('@/models/message.model').Message);
    const messageReadRepo = AppDataSource.getRepository(require('@/models/message_read.model').MessageRead);
    // Lấy tất cả idMessage gửi đến nhóm
    const groupMessages = await messageRepo.find({ where: { sendToGroup: { idGroup } } });
    const messageIds = groupMessages.map(m => m.idMessage);
    if (messageIds.length > 0) {
      await messageReadRepo
        .createQueryBuilder()
        .delete()
        .where('messageId IN (:...ids)', { ids: messageIds })
        .execute();
    }
    await messageRepo.delete({ sendToGroup: { idGroup } });
    // Xóa tất cả thành viên 
    await this.groupUserRepo.delete({ group: { idGroup } });
    // Xóa group
    await this.groupRepo.delete(idGroup);
  }

  async getUserGroups(idUser: number): Promise<GroupUser[]> {
    // SỬA LẠI: Sử dụng 'id' thay vì 'idGroupUser'
    return await this.groupUserRepo
      .createQueryBuilder('gu')
      .leftJoinAndSelect('gu.group', 'g')
      .leftJoinAndSelect('g.createdBy', 'creator')
      .leftJoinAndSelect('gu.user', 'u')
      .where('u.idUser = :idUser', { idUser })
      .andWhere('gu.role IN (:...roles)', { roles: [UserRole.ADMIN, UserRole.USER] })
      .orderBy('g.createdAt', 'DESC')
      .getMany();
  }

  
  async getUserGroupsWithSearch(idUser: number, searchTerm: string = '', page: number = 1, limit: number = 10): Promise<{ items: GroupUser[], total: number }> {
    const query = this.groupUserRepo
      .createQueryBuilder('gu')
      .leftJoinAndSelect('gu.group', 'g')
      .leftJoinAndSelect('g.createdBy', 'creator')
      .leftJoinAndSelect('gu.user', 'u')
      .where('u.idUser = :idUser', { idUser })
      .andWhere('gu.role IN (:...roles)', { roles: [UserRole.ADMIN, UserRole.USER] });

    if (searchTerm && searchTerm.trim() !== '') {
      query.andWhere('LOWER(g.name) LIKE :search', { search: `%${searchTerm.toLowerCase()}%` });
    }

    query.orderBy('g.createdAt', 'DESC');
    query.skip((page - 1) * limit).take(limit);

    const [items, total] = await query.getManyAndCount();
    return { items, total };
  }
}