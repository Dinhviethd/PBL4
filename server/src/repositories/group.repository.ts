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
      name: name,
      createdBy: { idUser: creatorId }  as User,
    });
    const adminGroup= this.groupUserRepo.create({
      idGroup: {idGroup: group.idGroup} as Group,
      idUser: {idUser: creatorId} as User,
      role: UserRole.ADMIN,
    })
    await this.groupUserRepo.save(adminGroup);
    return await this.groupRepo.save(group);
  }

  async addMember(groupId: number, userId: number, role: UserRole = UserRole.PENDING, actionById: number) {
    const groupUser = this.groupUserRepo.create({
      idGroup: { idGroup: groupId } as Group,
      idUser: { idUser: userId } as User,
      role: role,
      actionBy: { idUser: actionById } as User,
    });
    return await this.groupUserRepo.save(groupUser);
  }

  async removeMember(groupId: number, userId: number) {
    return await this.groupUserRepo.delete({
      idGroup: { idGroup: groupId } as Group,
      idUser: { idUser: userId } as User,
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
      where: { idGroup: { idGroup: groupId } as Group },
      relations: ['idUser']
    });
  }

  async getUserGroups(userId: number) {
    const groupUsers = await this.groupUserRepo.find({
      where: { idUser: { idUser: userId } as User },
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
    return !!member; //trả về true, false
  }

  async getMemberRole(groupId: number, userId: number) {
    const member = await this.groupUserRepo.findOne({
      where: {
        idGroup: { idGroup: groupId } as Group,
        idUser: { idUser: userId } as User
      }
    });
    return member?.role;
  }
  async getPendingMembers(groupId: number) {
    return await this.groupUserRepo.find({
      where: {
        idGroup: { idGroup: groupId } as Group,
        role: UserRole.PENDING
      },
      relations: ['idUser'],
      select: {
        idUser: {
          idUser: true,
          name: true,
          email: true,
          avatarUrl: true
        }
      }
    });
  }
  async updateGroup(groupId: number, name: string) {
    return await this.groupRepo.update(groupId, { name });
  }

  async deleteGroup(groupId: number) {
    return await this.groupRepo.update(groupId, { statusGroup: false });
  }

  async updateMemberRole(groupId: number, userId: number, role: UserRole){
    return await this.groupUserRepo.update({
      idGroup: {idGroup: groupId} as Group,
      idUser: {idUser: userId} as User,
    },{
      role: role
    })
  }
}

export default new GroupRepository();