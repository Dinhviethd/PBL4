import { AppDataSource } from '@/configs/database.config';
import { Message } from '@/models/message.model';
import { User } from '@/models/users.model';
import { Group } from '@/models/group.model';
import { GroupUser } from '@/models/group_user';
import { Repository } from 'typeorm';
import { CreateMessageData } from '@/DTOs/websocket.dto';
import { StatusUser, UserRole } from '@/constants/constants';

export class ChatService {
  private messageRepository: Repository<Message>;
  private userRepository: Repository<User>;
  private groupRepository: Repository<Group>;
  private groupUserRepository: Repository<GroupUser>;

  constructor() {
    this.messageRepository = AppDataSource.getRepository(Message);
    this.userRepository = AppDataSource.getRepository(User);
    this.groupRepository = AppDataSource.getRepository(Group);
    this.groupUserRepository = AppDataSource.getRepository(GroupUser);
  }

  // Lấy lịch sử chat 1-1
  async getPrivateChatHistory(userId1: number, userId2: number, limit: number = 50, offset: number = 0): Promise<Message[]> {
    return await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sentBy', 'sentBy')
      .leftJoinAndSelect('message.sendToUser', 'sendToUser')
      .where(
        '((message.sentBy = :userId1 AND message.sendToUser = :userId2) OR (message.sentBy = :userId2 AND message.sendToUser = :userId1))',
        { userId1, userId2 }
      )
      .andWhere('message.sendToGroup IS NULL')
      .andWhere('message.isDeleted = false')
      .orderBy('message.createdAt', 'ASC')
      .limit(limit)
      .offset(offset)
      .getMany();
  }

  // Lấy lịch sử chat nhóm
  async getGroupChatHistory(groupId: number, limit: number = 50, offset: number = 0): Promise<Message[]> {
    return await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sentBy', 'sentBy')
      .leftJoinAndSelect('message.sendToGroup', 'sendToGroup')
      .where('message.sendToGroup = :groupId', { groupId })
      .andWhere('message.isDeleted = false')
      .orderBy('message.createdAt', 'ASC')
      .limit(limit)
      .offset(offset)
      .getMany();
  }

  // Gửi tin nhắn riêng tư
  async sendPrivateMessage(senderId: number, receiverId: number, messageData: CreateMessageData): Promise<Message | null> {
    try {
      // Kiểm tra người gửi và người nhận tồn tại
      const sender = await this.userRepository.findOne({ where: { idUser: senderId } });
      const receiver = await this.userRepository.findOne({ where: { idUser: receiverId } });
      
      if (!sender || !receiver) {
        return null;
      }

      const message = new Message();
      message.sentBy = sender;
      message.sendToUser = receiver;
      message.content = messageData.content;
      message.type = messageData.type;
      if (messageData.fileURL) {
        message.fileURL = messageData.fileURL;
      }

      const savedMessage = await this.messageRepository.save(message);
      
      return await this.messageRepository.findOne({
        where: { idMessage: savedMessage.idMessage },
        relations: ['sentBy', 'sendToUser']
      });
    } catch (error) {
      console.error('Error sending private message:', error);
      return null;
    }
  }

  // Gửi tin nhắn nhóm
  async sendGroupMessage(senderId: number, groupId: number, messageData: CreateMessageData): Promise<Message | null> {
    try {
      // Kiểm tra người gửi và nhóm tồn tại
      const sender = await this.userRepository.findOne({ where: { idUser: senderId } });
      const group = await this.groupRepository.findOne({ where: { idGroup: groupId } });
      
      if (!sender || !group) {
        return null;
      }

      // Kiểm tra người gửi có trong nhóm không
      const groupMember = await this.groupUserRepository.findOne({
        where: { 
          idGroup: { idGroup: groupId },
          idUser: { idUser: senderId }
        }
      });
      if (!groupMember) {
        return null;
      }
      const message = new Message();
      message.sentBy = sender;
      message.sendToGroup = group;
      message.content = messageData.content;
      message.type = messageData.type;
      if (messageData.fileURL) {
        message.fileURL = messageData.fileURL;
      }
      const savedMessage = await this.messageRepository.save(message);
      return await this.messageRepository.findOne({
        where: { idMessage: savedMessage.idMessage },
        relations: ['sentBy', 'sendToGroup']
      });
    } catch (error) {
      console.error('Error sending group message:', error);
      return null;
    }
  }

  // Lấy danh sách chat của user (cả private và group)
  async getUserChats(userId: number): Promise<{
    privateChats: Array<{ user: User; lastMessage?: Message }>;
    groupChats: Array<{ group: Group; lastMessage?: Message }>;
  }> {
    const privateMessages = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sentBy', 'sentBy')
      .leftJoinAndSelect('message.sendToUser', 'sendToUser')
      .where('(message.sentBy = :userId OR message.sendToUser = :userId)', { userId })
      .andWhere('message.sendToGroup IS NULL')
      .andWhere('message.isDeleted = false')
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    const privateChatMap = new Map<number, { user: User; lastMessage: Message }>();
    for (const message of privateMessages) {
      const otherUserId = message.sentBy.idUser === userId ? message.sendToUser?.idUser : message.sentBy.idUser;
      const otherUser = message.sentBy.idUser === userId ? message.sendToUser : message.sentBy;
      
      if (otherUserId && otherUser && !privateChatMap.has(otherUserId)) {
        privateChatMap.set(otherUserId, { user: otherUser, lastMessage: message });
      }
    }
    const userGroups = await this.groupUserRepository
      .createQueryBuilder('groupUser')
      .leftJoinAndSelect('groupUser.idGroup', 'group')
      .where('groupUser.idUser = :userId', { userId })
      .getMany();
    const groupChats: Array<{ group: Group; lastMessage?: Message }> = [];
    for (const userGroup of userGroups) {
      if (userGroup.idGroup) {
        const lastMessage = await this.messageRepository
          .createQueryBuilder('message')
          .leftJoinAndSelect('message.sentBy', 'sentBy')
          .leftJoinAndSelect('message.sendToGroup', 'sendToGroup')
          .where('message.sendToGroup = :groupId', { groupId: userGroup.idGroup.idGroup })
          .andWhere('message.isDeleted = false')
          .orderBy('message.createdAt', 'DESC')
          .limit(1)
          .getOne();
        groupChats.push({
          group: userGroup.idGroup,
          lastMessage: lastMessage || undefined
        });
      }
    }

    return {
      privateChats: Array.from(privateChatMap.values()),
      groupChats
    };
  }
  // Xóa tin nhắn 
  async deleteMessage(messageId: number, userId: number): Promise<boolean> {
    try {
      const message = await this.messageRepository.findOne({
        where: { idMessage: messageId },
        relations: ['sentBy']
      });

      if (!message || message.sentBy.idUser !== userId) {
        return false;
      }
      message.isDeleted = true;
      message.deletedAt = new Date();
      await this.messageRepository.save(message);
      return true;
    } catch (error) {
      console.error('Error deleting message:', error);
      return false;
    }
  }

  // Tìm kiếm tin nhắn
  async searchMessages(userId: number, searchTerm: string, limit: number = 20): Promise<Message[]> {
    // Lấy danh sách các nhóm mà user tham gia
    const userGroups = await this.groupUserRepository
      .createQueryBuilder('groupUser')
      .select('groupUser.idGroup')
      .where('groupUser.idUser = :userId', { userId })
      .getRawMany();
    const groupIds = userGroups.map(g => g.groupUser_idGroup);
    const query = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sentBy', 'sentBy')
      .leftJoinAndSelect('message.sendToUser', 'sendToUser')
      .leftJoinAndSelect('message.sendToGroup', 'sendToGroup')
      .where('message.content ILIKE :searchTerm', { searchTerm: `%${searchTerm}%` })
      .andWhere('message.isDeleted = false');
    if (groupIds.length > 0) {
      query.andWhere(
        '(message.sentBy = :userId OR message.sendToUser = :userId OR message.sendToGroup IN (:...groupIds))',
        { userId, groupIds }
      );
    } else {
      query.andWhere(
        '(message.sentBy = :userId OR message.sendToUser = :userId)',
        { userId }
      );
    }
    return await query
      .orderBy('message.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  // Cập nhật trạng thái online của user
  async updateUserStatus(userId: number, status: StatusUser): Promise<boolean> {
    try {
      await this.userRepository.update({ idUser: userId }, { status });
      return true;
    } catch (error) {
      console.error('Error updating user status:', error);
      return false;
    }
  }
  // Lấy thành viên nhóm
  async getGroupMembers(groupId: number): Promise<User[]> {
    const groupUsers = await this.groupUserRepository
      .createQueryBuilder('groupUser')
      .leftJoinAndSelect('groupUser.idUser', 'user')
      .where('groupUser.idGroup = :groupId', { groupId })
      .getMany();

    return groupUsers.map(gu => gu.idUser).filter(user => user !== undefined) as User[];
  }
  // Thêm user vào nhóm
  async addUserToGroup(groupId: number, userId: number, role: UserRole = UserRole.USER): Promise<boolean> {
    try {
      const group = await this.groupRepository.findOne({ where: { idGroup: groupId } });
      const user = await this.userRepository.findOne({ where: { idUser: userId } });

      if (!group || !user) {
        return false;
      }
      const existingMember = await this.groupUserRepository.findOne({
        where: {
          idGroup: { idGroup: groupId },
          idUser: { idUser: userId }
        }
      });

      if (existingMember) {
        return false; 
      }
      const groupUser = new GroupUser();
      groupUser.idGroup = group;
      groupUser.idUser = user;
      groupUser.role = role;
      await this.groupUserRepository.save(groupUser);
      return true;
    } catch (error) {
      console.error('Error adding user to group:', error);
      return false;
    }
  }

  // Xóa user khỏi nhóm
  async removeUserFromGroup(groupId: number, userId: number): Promise<boolean> {
    try {
      const result = await this.groupUserRepository.delete({
        idGroup: { idGroup: groupId },
        idUser: { idUser: userId }
      });

    return !!result.affected && result.affected > 0;
    } catch (error) {
      console.error('Error removing user from group:', error);
      return false;
    }
  }

  // Kiểm tra user có trong nhóm không
  async isUserInGroup(userId: number, groupId: number): Promise<boolean> {
    const member = await this.groupUserRepository.findOne({
      where: {
        idUser: { idUser: userId },
        idGroup: { idGroup: groupId }
      }
    });
    return !!member;
  }
}