import { AppDataSource } from '@/configs/database.config';
import { Message } from '@/models/message.model';
import { User } from '@/models/users.model';
import { Group } from '@/models/group.model';
import { Repository } from 'typeorm';
import { MessageType } from '@/constants/constants';

class MessageRepository {
  private repository: Repository<Message>;

  constructor() {
    this.repository = AppDataSource.getRepository(Message);
  }

     async getRecentConversations(userId: number) {
    try {
      const privateMessages = await this.repository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sentBy', 'sender')
        .leftJoinAndSelect('message.sendToUser', 'receiver')
        .where(
          '((message.sentBy = :userId AND message.sendToUser IS NOT NULL) OR (message.sendToUser = :userId))',
          { userId }
        )
        .andWhere('(message.isDeleted = false OR message.isDeleted IS NULL)')
        .orderBy('message.createdAt', 'DESC')
        .getMany();

      const conversationMap = new Map<number, any>();
      privateMessages.forEach((msg) => {
        const partnerId = msg.sentBy?.idUser === userId ? msg.sendToUser?.idUser : msg.sentBy?.idUser;
        if (partnerId && !conversationMap.has(partnerId)) {
          conversationMap.set(partnerId, msg);
        }
      });

      const groupMessages = await this.repository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sentBy', 'gsender')
        .leftJoinAndSelect('message.sendToGroup', 'g')
        .where('message.sendToGroup IS NOT NULL')
        .andWhere('(message.isDeleted = false OR message.isDeleted IS NULL)')
        .orderBy('message.createdAt', 'DESC')
        .getMany();

      const groupConversationMap = new Map<number, any>();
      groupMessages.forEach((msg) => {
        const gid = msg.sendToGroup?.idGroup;
        if (gid && !groupConversationMap.has(gid)) {
          groupConversationMap.set(gid, msg);
        }
      });

      return {
        privateMessages: Array.from(conversationMap.values()),
        groupMessages: Array.from(groupConversationMap.values()),
      };
    } catch (error) {
      console.error('Repository getRecentConversations error:', error);
      return { privateMessages: [], groupMessages: [] };
    }
  }
  async createPrivateMessage(senderId: number, receiverId: number, content: string, type: string = 'TEXT', fileURL?: string) {
    try {
      // Create new message instance
      const message = new Message();
      message.sentBy = { idUser: senderId } as User;
      message.sendToUser = { idUser: receiverId } as User;
      message.content = content;
      message.type = type as MessageType;
      message.fileURL = fileURL;
      message.isDeleted = false;

      const savedMessage = await this.repository.save(message);
      
      // Fetch the complete message with relations
      return await this.repository.findOne({
        where: { idMessage: savedMessage.idMessage },
        relations: ['sentBy', 'sendToUser']
      });
    } catch (error) {
      console.error('Repository createPrivateMessage error:', error);
      throw error;
    }
  }

  async getPrivateMessages(
    userId: number,
    friendId: number,
    page: number = 1,
    limit: number = 20,
    search?: string
  ) {
    try {
      const qb = this.repository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sentBy', 'sender')
        .leftJoinAndSelect('message.sendToUser', 'receiver')
        .where(
          '((message.sentBy = :userId AND message.sendToUser = :friendId) OR (message.sentBy = :friendId AND message.sendToUser = :userId))',
          { userId, friendId }
        )
        .andWhere('(message.isDeleted = false OR message.isDeleted IS NULL)');

      if (search) {
        qb.andWhere('message.content LIKE :search', { search: `%${search}%` });
      }

      const totalItems = await qb.getCount();
      const totalPages = Math.ceil(totalItems / limit);
      const offset = (page - 1) * limit;

      const messages = await qb
        .orderBy('message.createdAt', 'DESC')
        .skip(offset)
        .take(limit)
        .getMany();

      return {
        data: messages.reverse(),
        pagination: { currentPage: page, totalPages, totalItems, itemsPerPage: limit },
      };
    } catch (error) {
      console.error('Repository getPrivateMessages error:', error);
      throw error;
    }
  }

   async getOlderPrivateMessages(userId: number, friendId: number, lastMessageId: number, limit: number = 20) {
    try {
      const messages = await this.repository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sentBy', 'sender')
        .leftJoinAndSelect('message.sendToUser', 'receiver')
        .where(
          '((message.sentBy = :userId AND message.sendToUser = :friendId) OR (message.sentBy = :friendId AND message.sendToUser = :userId))',
          { userId, friendId }
        )
        .andWhere('(message.isDeleted = false OR message.isDeleted IS NULL)')
        .andWhere('message.idMessage < :lastMessageId', { lastMessageId })
        .orderBy('message.createdAt', 'DESC')
        .take(limit)
        .getMany();

      return messages.reverse();
    } catch (error) {
      console.error('Repository getOlderPrivateMessages error:', error);
      throw error;
    }
  }

  async createGroupMessage(senderId: number, groupId: number, content: string, type: string = 'TEXT', fileURL?: string) {
    try {
      // Create new message instance
      const message = new Message();
      message.sentBy = { idUser: senderId } as User;
      message.sendToGroup = { idGroup: groupId } as Group;
      message.content = content;
      message.type = type as MessageType;
      message.fileURL = fileURL;
      message.isDeleted = false;

      const savedMessage = await this.repository.save(message);
      
      // Fetch the complete message with relations
      return await this.repository.findOne({
        where: { idMessage: savedMessage.idMessage },
        relations: ['sentBy', 'sendToGroup']
      });
    } catch (error) {
      console.error('Repository createGroupMessage error:', error);
      throw error;
    }
  }

   async getGroupMessages(groupId: number, page: number = 1, limit: number = 20, search?: string) {
    try {
      const qb = this.repository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sentBy', 'sender')
        .leftJoinAndSelect('message.sendToGroup', 'group')
        .where('group.idGroup = :groupId', { groupId })
        .andWhere('(message.isDeleted = false OR message.isDeleted IS NULL)');

      if (search) {
        qb.andWhere('message.content LIKE :search', { search: `%${search}%` });
      }

      const totalItems = await qb.getCount();
      const totalPages = Math.ceil(totalItems / limit);
      const offset = (page - 1) * limit;

      const messages = await qb
        .orderBy('message.createdAt', 'DESC')
        .skip(offset)
        .take(limit)
        .getMany();

      return {
        data: messages.reverse(),
        pagination: { currentPage: page, totalPages, totalItems, itemsPerPage: limit },
      };
    } catch (error) {
      console.error('Repository getGroupMessages error:', error);
      throw error;
    }
  }

  async getOlderGroupMessages(groupId: number, lastMessageId: number, limit: number = 20) {
    try {
      const messages = await this.repository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sentBy', 'sender')
        .leftJoinAndSelect('message.sendToGroup', 'group')
        .where('message.sendToGroup = :groupId', { groupId })
        .andWhere('message.isDeleted = false')
        .andWhere('message.idMessage < :lastMessageId', { lastMessageId })
        .orderBy('message.createdAt', 'DESC')
        .take(limit)
        .getMany();

      return messages.reverse(); // Reverse to show oldest first
    } catch (error) {
      console.error('Repository getOlderGroupMessages error:', error);
      throw error;
    }
  }

  async deleteMessage(userId: number, messageId: number) {
    try {
      const message = await this.repository.findOne({
        where: { idMessage: messageId },
        relations: ['sentBy']
      });

      if (!message) {
        throw new Error('Message not found');
      }

      if (message.sentBy.idUser !== userId) {
        throw new Error('You can only delete your own messages');
      }

      // Soft delete
      message.isDeleted = true;
      message.deletedAt = new Date();
      await this.repository.save(message);

      return { messageId, deleted: true };
    } catch (error) {
      console.error('Repository deleteMessage error:', error);
      throw error;
    }
  }
}

export default new MessageRepository();