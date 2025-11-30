
import { AppDataSource } from '@/configs/database.config';
import { GroupInvitation } from '@/models/group_invitation.model';
import { User } from '@/models/users.model';
import { Group } from '@/models/group.model';
import { GroupInvitationStatus } from '@/constants/constants';

class GroupInvitationRepository {
      // Lấy tất cả lời mời vào nhóm theo groupId, không xét status
      async getPendingMembers(groupId: number) {
        return await this.repo.find({
          where: { idGroup: groupId } as any,
          relations: ['idGroup', 'inviter', 'invitee'],
          order: { createdAt: 'DESC' }
        });
      }
    // Lời mời cần duyệt bởi admin (admin là người tạo group)
    async getInvitesNeedAdminApprove(adminId: number, skip = 0, take = 10) {
      const qb = this.repo.createQueryBuilder('inv')
        .leftJoinAndSelect('inv.idGroup', 'g')
        .leftJoinAndSelect('inv.inviter', 'inviter')
        .leftJoinAndSelect('inv.invitee', 'invitee')
        .where('inv.needAdminApprove = true')
        .andWhere('g.createdBy = :adminId', { adminId })
        .orderBy('inv.createdAt', 'DESC')
        .skip(skip)
        .take(take);
      const [items, total] = await qb.getManyAndCount();
      return { items, total };
    }

    // Lời mời của user cần admin duyệt
    async getInvitesWaitingForAdmin(userId: number, skip = 0, take = 10) {
      const qb = this.repo.createQueryBuilder('inv')
        .leftJoinAndSelect('inv.idGroup', 'g')
        .leftJoinAndSelect('inv.inviter', 'inviter')
        .leftJoinAndSelect('inv.invitee', 'invitee')
        .where('inv.needAdminApprove = true')
        .andWhere('inv.inviter = :userId', { userId })
        .orderBy('inv.createdAt', 'DESC')
        .skip(skip)
        .take(take);
      const [items, total] = await qb.getManyAndCount();
      return { items, total };
    }
  private repo = AppDataSource.getRepository(GroupInvitation);

  async createInvitation(groupId: number, inviterId: number, inviteeId: number, message?: string) {
    groupId = Number(groupId);
    inviterId = Number(inviterId);
    inviteeId = Number(inviteeId);
    if (isNaN(groupId) || isNaN(inviterId) || isNaN(inviteeId)) {
      throw new Error('groupId, inviterId hoặc inviteeId không hợp lệ!');
    }
    // Kiểm tra inviter có phải admin không
    let needAdminApprove = true;
    try {
      const group = await AppDataSource.getRepository(Group).findOne({
        where: { idGroup: groupId },
        relations: ['createdBy']
      });
      if (group && group.createdBy && group.createdBy.idUser == inviterId) {
        needAdminApprove = false;
      }
    } catch (e) { console.error('[BACKEND] Lỗi lấy group:', e); }
    const result = await this.repo.insert({
      idGroup: (groupId as any),
      inviter: (inviterId as any),
      invitee: (inviteeId as any),
      message,
      needAdminApprove,
    } as any);
    const insertedId = result.identifiers && result.identifiers[0] && result.identifiers[0].idInvitation
      ? result.identifiers[0].idInvitation
      : result.raw?.insertId;
    if (!insertedId) return null;
    return await this.findById(insertedId as number);
  }

  async deleteInvitationById(invitationId: number) {
    return await this.repo.delete({ idInvitation: invitationId } as any);
  }
  async updateInvitationStatus(invitationId: number, status: GroupInvitationStatus) {
    return await this.repo.update({ idInvitation: invitationId }, { status });
  }

  async findById(invitationId: number) {
    return await this.repo.findOne({
      where: { idInvitation: invitationId } as any,
      relations: ['idGroup', 'inviter', 'invitee'],
    });
  }

  async findByGroupAndInvitee(groupId: number, inviteeId: number) {
    const qb = this.repo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.idGroup', 'g')
      .leftJoinAndSelect('inv.inviter', 'inviter')
      .leftJoinAndSelect('inv.invitee', 'invitee')
      .where('inv.idGroup = :groupId', { groupId })
      .andWhere('inv.invitee = :inviteeId', { inviteeId })
      .limit(1);
    const result = await qb.getOne();
    if (!result) return null;
    const mapUser = (u: any) => u ? {
      idUser: u.idUser,
      name: u.name || u.fullName,
      email: u.email,
      avatarUrl: u.avatarUrl,
      phone: u.phone,
      gender: u.gender,
      birthday: u.birthday,
      createdAt: u.createdAt
    } : undefined;
    return {
      ...result,
      inviter: mapUser(result.inviter),
      invitee: mapUser(result.invitee)
    };
  }

  async getReceivedInvitesPaginated(userId: number, skip = 0, take = 10) {
    const [items, total] = await this.repo.findAndCount({
      where: { invitee: { idUser: userId } as any },
      relations: ['idGroup', 'inviter', 'invitee'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return { items, total };
  }

  async getSentInvitesPaginated(userId: number, skip = 0, take = 10) {
    const [items, total] = await this.repo.findAndCount({
      where: { inviter: { idUser: userId } as any },
      relations: ['idGroup', 'inviter', 'invitee'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return { items, total };
  }
}

export default new GroupInvitationRepository();
