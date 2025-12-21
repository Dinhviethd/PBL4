import { Repository } from 'typeorm';
import { AppDataSource } from '@/configs/database.config';
import { Message } from '@/models/message.model';
import { MessageRead } from '@/models/message_read.model';
import { User } from '@/models/users.model';
import { Group } from '@/models/group.model';
import { MessageType } from '@/constants/constants';
import { createPaginationQuery, PaginationResult, PaginationUtil } from '@/utils/pagination';

export class MessageRepository {
  private messageRepo: Repository<Message>;
  private messageReadRepo: Repository<MessageRead>;

  constructor() {
    this.messageRepo = AppDataSource.getRepository(Message);
    this.messageReadRepo = AppDataSource.getRepository(MessageRead);
  }

  async createMessage(data: {
    content: string;
    type: MessageType;
    sentBy: User;
    sendToUser?: User;
    sendToGroup?: Group;
    fileURL?: string;
  }): Promise<Message> {
    const message = this.messageRepo.create(data);
    return await this.messageRepo.save(message);
  }

  async getPrivateMessages(
    userId1: number,
    userId2: number,
    page: number,
    limit: number
  ): Promise<PaginationResult<Message>> {
    const { skip, take } = createPaginationQuery(page, limit);

    const [messages, total] = await this.messageRepo.findAndCount({
      where: [
        {
          sentBy: { idUser: userId1 },
          sendToUser: { idUser: userId2 },
          isDeleted: false
        },
        {
          sentBy: { idUser: userId2 },
          sendToUser: { idUser: userId1 },
          isDeleted: false
        }
      ],
      relations: ['sentBy', 'sendToUser', 'call'],
      order: { createdAt: 'DESC' },
      skip,
      take
    });

    return PaginationUtil.createPagination(messages.reverse(), total, page, limit);
  }

  async getGroupMessages(
    groupId: number,
    page: number,
    limit: number
  ): Promise<PaginationResult<Message>> {
    const { skip, take } = createPaginationQuery(page, limit);

    const [messages, total] = await this.messageRepo.findAndCount({
      where: {
        sendToGroup: { idGroup: groupId },
        isDeleted: false
      },
      relations: ['sentBy', 'sendToGroup', 'call'],
      order: { createdAt: 'DESC' },
      skip,
      take
    });

    return PaginationUtil.createPagination(messages.reverse(), total, page, limit);
  }

  async findMessageById(messageId: number): Promise<Message | null> {
    return await this.messageRepo.findOne({
      where: { idMessage: messageId },
      relations: ['sentBy', 'sendToUser', 'sendToGroup']
    });
  }

  async updateMessage(messageId: number, content: string): Promise<void> {
    await this.messageRepo.update(messageId, { 
      content,
      isEdited: true,
      editedAt: new Date()
    });
  }

  async deleteMessage(messageId: number): Promise<void> {
    await this.messageRepo.update(messageId, {
      isDeleted: true,
      deletedAt: new Date()
    });
  }

  async markMessageAsRead(messageId: number, userId: number): Promise<MessageRead> {
    const existingRead = await this.messageReadRepo.findOne({
      where: {
        message: { idMessage: messageId },
        user: { idUser: userId }
      }
    });

    if (existingRead) {
      return existingRead;
    }

    const messageRead = this.messageReadRepo.create({
      message: { idMessage: messageId } as any,
      user: { idUser: userId } as any,
      readAt: new Date()
    });

    return await this.messageReadRepo.save(messageRead);
  }

  // 🔥 ĐÃ BỔ SUNG LẠI HÀM NÀY (Hàm bị thiếu gây lỗi build)
  async getMessageReaders(messageId: number): Promise<MessageRead[]> {
    return await this.messageReadRepo.find({
      where: { message: { idMessage: messageId } },
      relations: ['user'],
      order: { readAt: 'ASC' }
    });
  }

  async getUnreadMessages(userId: number, partnerId: number): Promise<Message[]> {
    const unreadMessages = await this.messageRepo
      .createQueryBuilder('message')
      .leftJoin('message.sentBy', 'sender')
      .leftJoin('message.sendToUser', 'receiver')
      .leftJoin(MessageRead, 'read', 'read.message = message.idMessage AND read.user = :userId', { userId })
      .where('sender.idUser = :partnerId', { partnerId })
      .andWhere('receiver.idUser = :userId', { userId })
      .andWhere('message.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('read.id IS NULL') 
      .getMany();

    return unreadMessages;
  }

  async getUnreadGroupMessages(userId: number, groupId: number): Promise<Message[]> {
    const unreadMessages = await this.messageRepo
      .createQueryBuilder('message')
      .leftJoin('message.sentBy', 'sender')
      .leftJoin('message.sendToGroup', 'group')
      .leftJoin(MessageRead, 'read', 'read.message = message.idMessage AND read.user = :userId', { userId })
      .where('group.idGroup = :groupId', { groupId })
      .andWhere('sender.idUser != :userId', { userId })
      .andWhere('message.isDeleted = :isDeleted', { isDeleted: false })
      .andWhere('read.id IS NULL')
      .getMany();

    return unreadMessages;
  }

  async getRecentConversations(userId: number): Promise<any[]> {
    // Vẫn giữ các fix Postgres ($1, $2, snake_case) ở đây
    const privateConversationsQuery = `
      SELECT 
        CASE 
          WHEN m.sentby = $1 THEN m.sendtouser 
          ELSE m.sentby 
        END as "partnerId",
        MAX(m.createdat) as "lastMessageTime",
        'private' as type
      FROM message m
      WHERE (m.sentby = $2 OR m.sendtouser = $3)
        AND m.sendtogroup IS NULL
        AND m.isdeleted = false
      GROUP BY "partnerId"
      ORDER BY "lastMessageTime" DESC
    `;

    const privateConversations = await this.messageRepo.query(privateConversationsQuery, [userId, userId, userId]);

    const groupConversationsQuery = `
      SELECT 
        m.sendtogroup as "groupId",
        MAX(m.createdat) as "lastMessageTime",
        'group' as type
      FROM message m
      INNER JOIN group_user gu ON gu.idgroup = m.sendtogroup
      WHERE gu.iduser = $1
        AND m.sendtogroup IS NOT NULL
        AND m.isdeleted = false
      GROUP BY m.sendtogroup
      ORDER BY "lastMessageTime" DESC
    `;

    const groupConversations = await this.messageRepo.query(groupConversationsQuery, [userId]);

    const allConversations = [...privateConversations, ...groupConversations];
    allConversations.sort((a, b) => new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime());

    const detailedConversations = [];

    for (const conv of allConversations) {
      if (conv.type === 'private') {
        const lastMessage = await this.messageRepo.findOne({
          where: [
            { sentBy: { idUser: userId }, sendToUser: { idUser: conv.partnerId }, isDeleted: false },
            { sentBy: { idUser: conv.partnerId }, sendToUser: { idUser: userId }, isDeleted: false }
          ],
          relations: ['sentBy', 'sendToUser'],
          order: { createdAt: 'DESC' }
        });

        const partner = await AppDataSource.getRepository(User).findOne({
          where: { idUser: conv.partnerId }
        });

        if (lastMessage && partner) {
          detailedConversations.push({
            type: 'private',
            partnerId: conv.partnerId,
            partner: {
              idUser: partner.idUser,
              name: partner.name,
              avatarUrl: partner.avatarUrl,
              email: partner.email
            },
            lastMessage: lastMessage.content,
            lastMessageTime: lastMessage.createdAt,
            lastMessageType: lastMessage.type
          });
        }
      } else if (conv.type === 'group') {
        const lastMessage = await this.messageRepo.findOne({
          where: { 
            sendToGroup: { idGroup: conv.groupId },
            isDeleted: false 
          },
          relations: ['sentBy', 'sendToGroup'],
          order: { createdAt: 'DESC' }
        });

        const group = await AppDataSource.getRepository(Group).findOne({
          where: { idGroup: conv.groupId },
          relations: ['createdBy']
        });

        if (lastMessage && group) {
          detailedConversations.push({
            type: 'group',
            groupId: conv.groupId,
            group: {
              idGroup: group.idGroup,
              name: group.name,
              createdAt: group.createdAt,
              createdBy: group.createdBy
            },
            lastMessage: lastMessage.content,
            lastMessageTime: lastMessage.createdAt,
            lastMessageType: lastMessage.type
          });
        }
      }
    }

    return detailedConversations;
  }

  async markPrivateConversationAsRead(userId: number, partnerId: number): Promise<number> {
    const unreadMessages = await this.getUnreadMessages(userId, partnerId);
    let markedCount = 0;
    for (const message of unreadMessages) {
      await this.markMessageAsRead(message.idMessage, userId);
      markedCount++;
    }
    return markedCount;
  }

  async markGroupConversationAsRead(userId: number, groupId: number): Promise<number> {
    const unreadMessages = await this.getUnreadGroupMessages(userId, groupId);
    let markedCount = 0;
    for (const message of unreadMessages) {
      await this.markMessageAsRead(message.idMessage, userId);
      markedCount++;
    }
    return markedCount;
  }
}