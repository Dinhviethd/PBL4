import { AppDataSource } from '@/configs/database.config';
import { GroupInvitation } from '@/models/group_invitation.model';
import { User } from '@/models/users.model';
import { Group } from '@/models/group.model';
import { GroupInvitationStatus } from '@/constants/constants';

class GroupInvitationRepository {
  private repo = AppDataSource.getRepository(GroupInvitation);

  async getPendingMembers(groupId: number) {
    // Sửa 'inv.idGroup' -> 'inv.group'
    return await this.repo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.group', 'group') 
      .leftJoinAndSelect('inv.inviter', 'inviter')
      .leftJoinAndSelect('inv.invitee', 'invitee')
      .where('group.idGroup = :groupId', { groupId })
      .orderBy('inv.createdAt', 'DESC')
      .getMany();
  }

  async getInvitesNeedAdminApprove(adminId: number, skip = 0, take = 10) {
    // Sửa 'inv.idGroup' -> 'inv.group'
    const qb = this.repo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.group', 'g') 
      .leftJoinAndSelect('inv.inviter', 'inviter')
      .leftJoinAndSelect('inv.invitee', 'invitee')
      .where('inv.needAdminApprove = :needApprove', { needApprove: true })
      .andWhere('g.createdBy = :adminId', { adminId })
      .orderBy('inv.createdAt', 'DESC')
      .skip(skip)
      .take(take);
    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

  async getInvitesWaitingForAdmin(userId: number, skip = 0, take = 10) {
    // Sửa 'inv.idGroup' -> 'inv.group'
    const qb = this.repo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.group', 'g')
      .leftJoinAndSelect('inv.inviter', 'inviter')
      .leftJoinAndSelect('inv.invitee', 'invitee')
      .where('inv.needAdminApprove = :needApprove', { needApprove: true })
      .andWhere('inv.inviter = :userId', { userId })
      .orderBy('inv.createdAt', 'DESC')
      .skip(skip)
      .take(take);
    const [items, total] = await qb.getManyAndCount();
    return { items, total };
  }

 async createInvitation(groupId: number, inviterId: number, inviteeId: number, message?: string) {
    groupId = Number(groupId);
    inviterId = Number(inviterId);
    inviteeId = Number(inviteeId);
    
    if (isNaN(groupId) || isNaN(inviterId) || isNaN(inviteeId)) {
      throw new Error('groupId, inviterId hoặc inviteeId không hợp lệ!');
    }
    
    let needAdminApprove = true;
    try {
      // Logic check admin giữ nguyên
      const group = await AppDataSource.getRepository(Group).findOne({
        where: { idGroup: groupId },
        relations: ['createdBy']
      });
      if (group && group.createdBy && group.createdBy.idUser == inviterId) {
        needAdminApprove = false;
      }
    } catch (e) { console.error('[BACKEND] Lỗi lấy group:', e); }

    // Dùng RAW Query để insert trực tiếp -> Bỏ qua mọi lỗi mapping của TypeORM
    // Lưu ý: Tên cột trong DB của bạn có dấu ngoặc kép "idGroup", "needAdminApprove"
    const query = `
      INSERT INTO group_invitation ("idGroup", inviter, invitee, message, "needAdminApprove", status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING "idInvitation"
    `;

    const params = [
      groupId,               // $1 -> idGroup (integer)
      inviterId,             // $2 -> inviter (integer)
      inviteeId,             // $3 -> invitee (integer)
      message || null,       // $4 -> message (text)
      needAdminApprove,      // $5 -> needAdminApprove (boolean) -> Postgres tự hiểu
      GroupInvitationStatus.PENDING // $6 -> status (varchar)
    ];

    try {
      const result = await this.repo.query(query, params);
      
      // result trả về mảng các dòng insert, lấy id dòng đầu tiên
      const insertedId = result[0]?.idInvitation;
      
      if (!insertedId) return null;
      
      // Trả về object đầy đủ sau khi insert thành công
      
      return await this.findById(insertedId);
      
    } catch (error) {
      console.error('[BACKEND] Create Invitation Error:', error);
      throw error;
    }
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
      // Sửa 'idGroup' -> 'group' trong relations
      relations: ['group', 'group.createdBy', 'inviter', 'invitee'], 
    });
  }

  async findByGroupAndInvitee(groupId: number, inviteeId: number) {
    const qb = this.repo.createQueryBuilder('inv')
      .leftJoinAndSelect('inv.group', 'g') // Sửa inv.idGroup -> inv.group
      .leftJoinAndSelect('inv.inviter', 'inviter')
      .leftJoinAndSelect('inv.invitee', 'invitee')
      .where('g.idGroup = :groupId', { groupId })
      .andWhere('inv.invitee = :inviteeId', { inviteeId });
      
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
      where: { invitee: { idUser: userId } } as any,
      // Sửa relations: 'idGroup' -> 'group'
      relations: ['group', 'inviter', 'invitee'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return { items, total };
  }

  async getSentInvitesPaginated(userId: number, skip = 0, take = 10) {
    const [items, total] = await this.repo.findAndCount({
      where: { inviter: { idUser: userId } } as any,
      // Sửa relations: 'idGroup' -> 'group'
      relations: ['group', 'inviter', 'invitee'],
      order: { createdAt: 'DESC' },
      skip,
      take,
    });
    return { items, total };
  }
}

export default new GroupInvitationRepository();