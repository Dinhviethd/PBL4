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

  async deleteGroup(idGroup: number): Promise<void> {
    // Xóa tất cả thành viên trước
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

  async getPendingMembers(idGroup: number) {
    // Lấy toàn bộ lời mời vào nhóm (group_invitation) với idGroup
    const groupInvitationRepo = AppDataSource.getRepository(GroupInvitation);
    return await groupInvitationRepo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.invitee', 'invitee')
      .leftJoinAndSelect('inv.inviter', 'inviter')
      .where('inv.idGroup = :idGroup', { idGroup })
      .orderBy('inv.createdAt', 'DESC')
      .getMany();
  }

  // Get all users that can be invited (tất cả users không phải thành viên của group)
  async getInvitableUsers(idGroup: number): Promise<User[]> {
    const userRepository = AppDataSource.getRepository(User);
    
    // Lấy tất cả users trừ những users đã là thành viên của group
    return await userRepository
      .createQueryBuilder('u')
      .leftJoin(
        GroupUser,
        'gu',
        'gu.user.idUser = u.idUser AND gu.group.idGroup = :groupId',
        { groupId: idGroup }
      )
      .where('gu.id IS NULL') // Không có record GroupUser = không phải thành viên
      .andWhere('u.statusAccount = true') // Chỉ những user active
      .getMany();
  }
}