import { AppDataSource } from '@/configs/database.config';
import { Group } from '@/models/group.model';
import { GroupUser } from '@/models/group_user';
import { UserRole } from '@/constants/constants';

class GroupRepository {
  private groupRepo = AppDataSource.getRepository(Group);
  private groupUserRepo = AppDataSource.getRepository(GroupUser);

  async createGroup(name: string, creatorId: number) {
    // Use insert with raw id to avoid TypeORM attempting to update related User entity
    const result = await this.groupRepo.insert({
      name,
      // join column 'createdBy' stores the user id directly
      createdBy: (creatorId as any)
    } as any);
    const id = (result.identifiers && result.identifiers[0] && result.identifiers[0].idGroup) || result.raw?.insertId;
    return await this.getGroupById(id);
  }

  async addMember(groupId: number, userId: number, role: UserRole = UserRole.USER) {
    // Insert raw values to avoid updating related entities
    const result = await this.groupUserRepo.insert({
      idGroup: (groupId as any),
      idUser: (userId as any),
      role
    } as any);
    const insertedId = (result.identifiers && result.identifiers[0] && result.identifiers[0].idGroup_User) || result.raw?.insertId;
    return await this.groupUserRepo.findOne({ where: { idGroup_User: insertedId } as any, relations: ['idUser', 'idGroup'] });
  }

  async removeMember(groupId: number, userId: number) {
    // Use query builder to delete by raw column values to avoid relation alias errors
    return await this.groupUserRepo.createQueryBuilder()
      .delete()
      .from(GroupUser)
      .where('idGroup = :groupId', { groupId })
      .andWhere('idUser = :userId', { userId })
      .execute();
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

  async getUserGroupsPaginated(userId: number, page = 1, limit = 10, q?: string, sort: 'asc'|'desc' = 'asc') {
    const qb = this.groupUserRepo.createQueryBuilder('gu')
      .leftJoinAndSelect('gu.idGroup', 'g')
      .leftJoinAndSelect('g.createdBy', 'creator')
      .where('gu.idUser = :userId', { userId })
      .andWhere('g.statusGroup = :status', { status: true });

    if (q && q.trim()) {
      qb.andWhere('g.name LIKE :q', { q: `%${q.trim()}%` });
    }

    qb.orderBy('g.name', sort.toUpperCase() as any)
      .skip((page - 1) * limit)
      .take(limit);

    const [rows, total] = await qb.getManyAndCount();
    const items = rows.map(r => r.idGroup).filter(Boolean);
    return {
      items,
      total,
      page,
      limit
    };
  }

  async checkMembership(groupId: number, userId: number) {
    const member = await this.groupUserRepo.createQueryBuilder('gu')
      .where('gu.idGroup = :groupId', { groupId })
      .andWhere('gu.idUser = :userId', { userId })
      .getOne();
    return !!member;
  }

  async getMemberRole(groupId: number, userId: number) {
    const member = await this.groupUserRepo.createQueryBuilder('gu')
      .where('gu.idGroup = :groupId', { groupId })
      .andWhere('gu.idUser = :userId', { userId })
      .getOne();
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