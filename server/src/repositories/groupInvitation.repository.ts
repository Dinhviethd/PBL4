import { AppDataSource } from '@/configs/database.config';
import { GroupInvitation } from '@/models/group_invitation.model';
import { User } from '@/models/users.model';

class GroupInvitationRepository {
  private repo = AppDataSource.getRepository(GroupInvitation);

  async createInvitation(groupId: number, inviterId: number, inviteeId: number, message?: string) {
    const result = await this.repo.insert({
      idGroup: (groupId as any),
      inviter: (inviterId as any),
      invitee: (inviteeId as any),
      message,
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
    return await qb.getOne();
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
