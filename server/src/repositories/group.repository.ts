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
    const result = await this.groupUserRepo.insert({
      group: { idGroup: groupId } as any,
      user: { idUser: userId } as any,
      role
    });
    // Sửa lại cách lấy ID cho tương thích
    const insertedId = result.identifiers?.[0]?.id || result.raw?.insertId; 
    return await this.groupUserRepo.findOne({ where: { id: insertedId }, relations: ['user', 'group'] });
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
      .leftJoinAndSelect('gu.actionBy', 'actionBy') // 🔥 ĐÃ SỬA: actionBy (viết hoa chữ B)
      .where('g.idGroup = :idGroup', { idGroup })
      .andWhere('u.idUser = :idUser', { idUser })
      .getOne();
  }

  async getGroupMembers(idGroup: number): Promise<GroupUser[]> {
    return await this.groupUserRepo
      .createQueryBuilder('gu')
      .leftJoinAndSelect('gu.user', 'u')
      .leftJoinAndSelect('gu.actionBy', 'actionBy') // 🔥 ĐÃ SỬA: actionBy (viết hoa chữ B)
      .leftJoinAndSelect('gu.group', 'g')
      .where('g.idGroup = :idGroup', { idGroup })
      .orderBy('gu.role', 'DESC')
      .getMany();
  }

  async updateMemberRole(id: number, role: UserRole): Promise<void> {
    await this.groupUserRepo.update(id, { role });
  }

  async removeUserFromGroup(idGroup: number, idUser: number): Promise<void> {
    // Sử dụng delete object chuẩn TypeORM thay vì QueryBuilder để tránh lỗi cú pháp
    await this.groupUserRepo.delete({ 
        group: { idGroup: idGroup }, 
        user: { idUser: idUser } 
    });
  }

  async getGroupById(groupId: number) {
    return await this.groupRepo.findOne({
      where: { idGroup: groupId, statusGroup: true },
      relations: ['createdBy']
    });
  }

  async checkMembership(groupId: number, userId: number) {
    const member = await this.groupUserRepo.findOne({
        where: { group: { idGroup: groupId }, user: { idUser: userId } }
    });
    return !!member;
  }

  async checkAdmin(groupId: number, userId: number): Promise<boolean> {
    const member = await this.groupUserRepo.findOne({
        where: { group: { idGroup: groupId }, user: { idUser: userId }, role: UserRole.ADMIN }
    });
    return !!member;
  }

  async deleteGroup(idGroup: number): Promise<void> {
    const groupInvitationRepo = AppDataSource.getRepository(GroupInvitation);
    // Dynamic import để tránh vòng lặp dependencies nếu có
    const MessageModel = require('@/models/message.model').Message;
    const MessageReadModel = require('@/models/message_read.model').MessageRead;
    
    const messageRepo = AppDataSource.getRepository(MessageModel);
    const messageReadRepo = AppDataSource.getRepository(MessageReadModel);

    // 1. Xóa lời mời
    await groupInvitationRepo.delete({ idGroup: { idGroup } });

    // 2. Xóa tin nhắn và message read
    const groupMessages = await messageRepo.find({ where: { sendToGroup: { idGroup } } });
    const messageIds = groupMessages.map((m: any) => m.idMessage);
    
    if (messageIds.length > 0) {
      // Postgres: dùng tên cột 'messageid' (chữ thường)
      await messageReadRepo
        .createQueryBuilder()
        .delete()
        .where('messageid IN (:...ids)', { ids: messageIds })
        .execute();
    }
    
    await messageRepo.delete({ sendToGroup: { idGroup } });
    
    // 3. Xóa thành viên
    await this.groupUserRepo.delete({ group: { idGroup } });
    
    // 4. Xóa group
    await this.groupRepo.delete(idGroup);
  }

  async getUserGroups(idUser: number): Promise<GroupUser[]> {
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