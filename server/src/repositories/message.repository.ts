import { AppDataSource } from '@/configs/database.config';
import { Message } from '@/models/message.model';
import { User } from '@/models/users.model';
import { Group } from '@/models/group.model';
import { PaginationUtil, PaginationResult, createPaginationQuery } from '@/utils/pagination';

class MessageRepository {
  private repository = AppDataSource.getRepository(Message);

  async createPrivateMessage(senderId: number, receiverId: number, content: string, type: string, fileURL?: string) {
    const message = this.repository.create({
      sentBy: { idUser: senderId } as User,
      sendToUser: { idUser: receiverId } as User,
      content,
      type: type as any,
      fileURL
    });
    return await this.repository.save(message);
  }

  async createGroupMessage(senderId: number, groupId: number, content: string, type: string, fileURL?: string) {
    const message = this.repository.create({
      sentBy: { idUser: senderId } as User,
      sendToGroup: { idGroup: groupId } as Group,
      content,
      type: type as any,
      fileURL
    });
    return await this.repository.save(message);
  }

  async getPrivateMessages(
    userId: number, 
    friendId: number, 
    page: number, 
    limit: number,
    search?: string
  ): Promise<PaginationResult<Message>> {
    const { skip, take } = createPaginationQuery(page, limit);
    
    let queryBuilder = this.repository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sentBy', 'sender')
      .leftJoinAndSelect('message.sendToUser', 'receiver')
      .where(
        '((message.sentBy = :userId AND message.sendToUser = :friendId) OR (message.sentBy = :friendId AND message.sendToUser = :userId))',
        { userId, friendId }
      )
      .andWhere('message.isDeleted = false');
    if (search) {
      queryBuilder = queryBuilder.andWhere('message.content ILIKE :search', { search: `%${search}%` });
    }
    const total = await queryBuilder.getCount();
    const messages = await queryBuilder
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    // Đảo ngược để hiển thị tin nhắn cũ ở trên, mới ở dưới
    const reversedMessages = messages.reverse();
    return PaginationUtil.createPagination(reversedMessages, total, page, limit);
  }

  async getGroupMessages(
    groupId: number, 
    page: number, 
    limit: number,
    search?: string
  ): Promise<PaginationResult<Message>> {
    const { skip, take } = createPaginationQuery(page, limit);
    
    let queryBuilder = this.repository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sentBy', 'sender')
      .leftJoinAndSelect('message.sendToGroup', 'group')
      .where('message.sendToGroup = :groupId', { groupId })
      .andWhere('message.isDeleted = false');
    if (search) {
      queryBuilder = queryBuilder.andWhere('message.content ILIKE :search', { search: `%${search}%` });
    }

    const total = await queryBuilder.getCount();
    const messages = await queryBuilder
      .orderBy('message.createdAt', 'DESC')
      .skip(skip)
      .take(take)
      .getMany();

    // Đảo ngược để hiển thị tin nhắn cũ ở trên, mới ở dưới
    const reversedMessages = messages.reverse();

    return PaginationUtil.createPagination(reversedMessages, total, page, limit);
  }

 // Hàm load tin nhắn cũ 
  async getOlderPrivateMessages(
    userId: number,
    friendId: number,
    lastMessageId: number,
    limit: number
  ): Promise<Message[]> {
    return await this.repository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sentBy', 'sender')
      .leftJoinAndSelect('message.sendToUser', 'receiver')
      .where(
        '((message.sentBy = :userId AND message.sendToUser = :friendId) OR (message.sentBy = :friendId AND message.sendToUser = :userId))',
        { userId, friendId }
      )
      .andWhere('message.isDeleted = false')
      .andWhere('message.idMessage < :lastMessageId', { lastMessageId })
      .orderBy('message.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getOlderGroupMessages(
    groupId: number,
    lastMessageId: number,
    limit: number
  ): Promise<Message[]> {
    return await this.repository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sentBy', 'sender')
      .leftJoinAndSelect('message.sendToGroup', 'group')
      .where('message.sendToGroup = :groupId', { groupId })
      .andWhere('message.isDeleted = false')
      .andWhere('message.idMessage < :lastMessageId', { lastMessageId })
      .orderBy('message.createdAt', 'DESC')
      .limit(limit)
      .getMany();
  }

  async getMessageById(messageId: number) {
    return await this.repository.findOne({
      where: { idMessage: messageId },
      relations: ['sentBy', 'sendToUser', 'sendToGroup']
    });
  }

  async deleteMessage(messageId: number) {
    return await this.repository.update(messageId, {
      isDeleted: true,
      deletedAt: new Date()
    });
  }

  async getRecentConversations(userId: number, limit: number = 20) {
    // Lấy cuộc trò chuyện 1 - 1gần đây
    const recentPrivate = await this.repository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sentBy', 'sender')
      .leftJoinAndSelect('message.sendToUser', 'receiver')
      .where('(message.sentBy = :userId OR message.sendToUser = :userId)', { userId })
      .andWhere('message.sendToUser IS NOT NULL')
      .andWhere('message.isDeleted = false')
      .orderBy('message.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    // Lấy cuộc trò chuyện nhóm gần đây
    const recentGroup = await this.repository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.sentBy', 'sender')
      .leftJoinAndSelect('message.sendToGroup', 'group')
      .innerJoin('Group_User', 'gu', 'gu.idGroup = group.idGroup AND gu.idUser = :userId', { userId })
      .where('message.sendToGroup IS NOT NULL')
      .andWhere('message.isDeleted = false')
      .orderBy('message.createdAt', 'DESC')
      .limit(limit)
      .getMany();

    return { privateMessages: recentPrivate, groupMessages: recentGroup };
  }

  // Hàm đếm tin nhắn chưa đọc
  async getUnreadPrivateMessageCount(userId: number, friendId: number): Promise<number> {
    // Cần thêm trường isRead vào Message model hoặc tạo bảng MessageRead riêng
    // Chưa làm, code sau
    return 0;
  }

  async getUnreadGroupMessageCount(userId: number, groupId: number): Promise<number> {
    // Cần thêm trường isRead vào Message model hoặc tạo bảng MessageRead riêng
    // Chưa làm, code sau
    return 0;
  }
}

export default new MessageRepository();