import { MessageRepository } from '@/repositories/message.repository';
import { GroupRepository } from '@/repositories/group.repository';
import { AppDataSource } from '@/configs/database.config';
import { User } from '@/models/users.model';
import { AppError } from '@/utils/error.response';
import { MessageType, UserRole } from '@/constants/constants';
import { wsService } from './websocket.service';
import { PaginationResult } from '@/utils/pagination';

export class MessageService {
  private messageRepository: MessageRepository;
  private groupRepository: GroupRepository;
  private userRepository;

  constructor() {
    this.messageRepository = new MessageRepository();
    this.groupRepository = new GroupRepository();
    this.userRepository = AppDataSource.getRepository(User);
  }

  async sendPrivateMessage(
    senderId: number,
    receiverId: number,
    content: string,
    type: MessageType = MessageType.TEXT,
    fileURL?: string
  ) {
    const sender = await this.userRepository.findOne({
      where: { idUser: senderId }
    });

    const receiver = await this.userRepository.findOne({
      where: { idUser: receiverId }
    });

    if (!sender || !receiver) {
      throw new AppError(404, 'User not found');
    }

    const message = await this.messageRepository.createMessage({
      content,
      type,
      sentBy: sender,
      sendToUser: receiver,
      fileURL
    });

    // Gửi qua WebSocket
    wsService.sendPrivateMessage(senderId, receiverId, {
      messageId: message.idMessage,
      content: message.content,
      type: message.type,
      fileURL: message.fileURL,
      createdAt: message.createdAt,
      sender: {
        idUser: sender.idUser,
        name: sender.name,
        avatarUrl: sender.avatarUrl
      }
    });

    return {
      idMessage: message.idMessage,
      content: message.content,
      type: message.type,
      fileURL: message.fileURL,
      createdAt: message.createdAt,
      sender: {
        idUser: sender.idUser,
        name: sender.name,
        avatarUrl: sender.avatarUrl
      },
      receiver: {
        idUser: receiver.idUser,
        name: receiver.name,
        avatarUrl: receiver.avatarUrl
      }
    };
  }

  async sendGroupMessage(
    senderId: number,
    groupId: number,
    content: string,
    type: MessageType = MessageType.TEXT,
    fileURL?: string
  ) {
    // Kiểm tra người gửi có trong nhóm không
    const senderMember = await this.groupRepository.findGroupMember(groupId, senderId);
    if (!senderMember || senderMember.role === UserRole.PENDING) {
      throw new AppError(403, 'You are not a member of this group or pending approval');
    }

    const sender = await this.userRepository.findOne({
      where: { idUser: senderId }
    });

    const group = await this.groupRepository.findGroupById(groupId);

    if (!sender || !group) {
      throw new AppError(404, 'Sender or group not found');
    }

    const message = await this.messageRepository.createMessage({
      content,
      type,
      sentBy: sender,
      sendToGroup: group,
      fileURL
    });

    // Lấy danh sách thành viên để gửi WebSocket
    const members = await this.groupRepository.getGroupMembers(groupId);
    const memberIds = members
      .filter(m => m.role !== UserRole.PENDING)
      .map(m => m.user.idUser);

    wsService.sendGroupMessage(senderId, memberIds, {
      messageId: message.idMessage,
      content: message.content,
      type: message.type,
      fileURL: message.fileURL,
      createdAt: message.createdAt,
      groupId: group.idGroup,
      groupName: group.name,
      sender: {
        idUser: sender.idUser,
        name: sender.name,
        avatarUrl: sender.avatarUrl
      }
    });

    return {
      idMessage: message.idMessage,
      content: message.content,
      type: message.type,
      fileURL: message.fileURL,
      createdAt: message.createdAt,
      group: {
        idGroup: group.idGroup,
        name: group.name
      },
      sender: {
        idUser: sender.idUser,
        name: sender.name,
        avatarUrl: sender.avatarUrl
      }
    };
  }

  async getPrivateMessages(
    userId: number,
    partnerId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginationResult<any>> {
    const result = await this.messageRepository.getPrivateMessages(userId, partnerId, page, limit);

    const messagesWithReads = await Promise.all(
      result.data.map(async (message) => {
        const readers = await this.messageRepository.getMessageReaders(message.idMessage);
        
        return {
          idMessage: message.idMessage,
          content: message.content,
          type: message.type,
          fileURL: message.fileURL,
          createdAt: message.createdAt,
          isEdited: message.isEdited,
          editedAt: message.editedAt,
          sender: {
            idUser: message.sentBy.idUser,
            name: message.sentBy.name,
            avatarUrl: message.sentBy.avatarUrl
          },
          readers: readers.map(r => ({
            idUser: r.user.idUser,
            name: r.user.name,
            avatarUrl: r.user.avatarUrl,
            readAt: r.readAt
          }))
        };
      })
    );

    return {
      ...result,
      data: messagesWithReads
    };
  }

  async getGroupMessages(
    userId: number,
    groupId: number,
    page: number = 1,
    limit: number = 20
  ): Promise<PaginationResult<any>> {
    // Kiểm tra user có trong nhóm không
    const member = await this.groupRepository.findGroupMember(groupId, userId);
    if (!member || member.role === UserRole.PENDING) {
      throw new AppError(403, 'You are not a member of this group');
    }

    const result = await this.messageRepository.getGroupMessages(groupId, page, limit);

    const messagesWithReads = await Promise.all(
      result.data.map(async (message) => {
        const readers = await this.messageRepository.getMessageReaders(message.idMessage);
        
        return {
          idMessage: message.idMessage,
          content: message.content,
          type: message.type,
          fileURL: message.fileURL,
          createdAt: message.createdAt,
          isEdited: message.isEdited,
          editedAt: message.editedAt,
          sender: {
            idUser: message.sentBy.idUser,
            name: message.sentBy.name,
            avatarUrl: message.sentBy.avatarUrl
          },
          readers: readers.map(r => ({
            idUser: r.user.idUser,
            name: r.user.name,
            avatarUrl: r.user.avatarUrl,
            readAt: r.readAt
          }))
        };
      })
    );

    return {
      ...result,
      data: messagesWithReads
    };
  }

  async editMessage(messageId: number, userId: number, newContent: string) {
    const message = await this.messageRepository.findMessageById(messageId);
    
    if (!message) {
      throw new AppError(404, 'Message not found');
    }

    if (message.sentBy.idUser !== userId) {
      throw new AppError(403, 'You can only edit your own messages');
    }

    if (message.isDeleted) {
      throw new AppError(400, 'Cannot edit deleted message');
    }

    // Kiểm tra thời gian edit (ví dụ: chỉ cho phép edit trong 24h)
    const editTimeLimit = 24 * 60 * 60 * 1000; // 24 hours
    if (Date.now() - message.createdAt.getTime() > editTimeLimit) {
      throw new AppError(400, 'Message edit time limit exceeded');
    }

    await this.messageRepository.updateMessage(messageId, newContent);

    // Gửi thông báo qua WebSocket
    if (message.sendToUser) {
      // Tin nhắn riêng tư
      wsService.sendToUser(message.sendToUser.idUser, {
        type: 'MESSAGE_EDITED',
        data: {
          messageId,
          newContent,
          editedAt: new Date()
        }
      });
    } else if (message.sendToGroup) {
      // Tin nhắn nhóm
      const members = await this.groupRepository.getGroupMembers(message.sendToGroup.idGroup);
      members.forEach(member => {
        if (member.user.idUser !== userId) {
          wsService.sendToUser(member.user.idUser, {
            type: 'MESSAGE_EDITED',
            data: {
              messageId,
              newContent,
              editedAt: new Date(),
              groupId: message.sendToGroup?.idGroup
            }
          });
        }
      });
    }

    return { message: 'Message edited successfully' };
  }

  async deleteMessage(messageId: number, userId: number) {
    const message = await this.messageRepository.findMessageById(messageId);
    
    if (!message) {
      throw new AppError(404, 'Message not found');
    }

    if (message.sentBy.idUser !== userId) {
      throw new AppError(403, 'You can only delete your own messages');
    }

    if (message.isDeleted) {
      throw new AppError(400, 'Message already deleted');
    }

    await this.messageRepository.deleteMessage(messageId);

    // Gửi thông báo qua WebSocket
    if (message.sendToUser) {
      // Tin nhắn riêng tư
      wsService.sendToUser(message.sendToUser.idUser, {
        type: 'MESSAGE_DELETED',
        data: {
          messageId,
          deletedAt: new Date()
        }
      });
    } else if (message.sendToGroup) {
      // Tin nhắn nhóm
      const members = await this.groupRepository.getGroupMembers(message.sendToGroup.idGroup);
      members.forEach(member => {
        if (member.user.idUser !== userId) {
          wsService.sendToUser(member.user.idUser, {
            type: 'MESSAGE_DELETED',
            data: {
              messageId,
              deletedAt: new Date(),
              groupId: message.sendToGroup?.idGroup
            }
          });
        }
      });
    }

    return { message: 'Message deleted successfully' };
  }

  async markMessageAsRead(messageId: number, userId: number) {
    const message = await this.messageRepository.findMessageById(messageId);
    
    if (!message) {
      throw new AppError(404, 'Message not found');
    }

    // Không cho phép đánh dấu tin nhắn của chính mình
    if (message.sentBy.idUser === userId) {
      throw new AppError(400, 'Cannot mark your own message as read');
    }

    await this.messageRepository.markMessageAsRead(messageId, userId);

    // Gửi thông báo cho người gửi
    wsService.sendToUser(message.sentBy.idUser, {
      type: 'MESSAGE_READ',
      data: {
        messageId,
        readBy: userId,
        readAt: new Date()
      }
    });

    return { message: 'Message marked as read' };
  }

  async getRecentConversations(userId: number) {
    const conversations = await this.messageRepository.getRecentConversations(userId);
    
    // Lấy thông tin chi tiết và số tin nhắn chưa đọc
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        if (conv.partnerId) {
          // Cuộc hội thoại riêng tư
          const partner = await this.userRepository.findOne({
            where: { idUser: conv.partnerId }
          });
          
          const unreadCount = await this.messageRepository.getUnreadMessages(userId, conv.partnerId);
          
          return {
            type: 'private',
            partnerId: conv.partnerId,
            partner: {
              idUser: partner?.idUser,
              name: partner?.name,
              avatarUrl: partner?.avatarUrl
            },
            lastMessage: conv.lastMessage,
            lastMessageType: conv.lastMessageType,
            lastMessageTime: conv.lastMessageTime,
            unreadCount: unreadCount.length
          };
        } else {
          // Cuộc hội thoại nhóm
          const group = await this.groupRepository.findGroupById(conv.groupId);
          const unreadCount = await this.messageRepository.getUnreadGroupMessages(userId, conv.groupId);
          
          return {
            type: 'group',
            groupId: conv.groupId,
            group: {
              idGroup: group?.idGroup,
              name: group?.name
            },
            lastMessage: conv.lastMessage,
            lastMessageType: conv.lastMessageType,
            lastMessageTime: conv.lastMessageTime,
            unreadCount: unreadCount.length
          };
        }
      })
    );

    return conversationsWithDetails;
  }
}