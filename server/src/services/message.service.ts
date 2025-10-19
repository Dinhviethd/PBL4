import messageRepository from '@/repositories/message.repository';
import groupRepository from '@/repositories/group.repository';
import { SendPrivateMessageDTO, SendGroupMessageDTO } from '@/schemas/message.schema'
import { UserRole } from '@/constants/constants';

class MessageService {
  async getRecentConversations(userId: number) {
    try {
      const result = await messageRepository.getRecentConversations(userId);
      return result;
    } catch (error) {
      console.error('MessageService getRecentConversations error:', error);
      throw error;
    }
  }

  async sendPrivateMessage(senderId: number, data: SendPrivateMessageDTO) {
    try {
      // Basic validation
      if (senderId === data.receiverId) {
        throw new Error('Cannot send message to yourself');
      }

      const message = await messageRepository.createPrivateMessage(
        senderId,
        data.receiverId,
        data.content,
        data.type || 'TEXT',
        data.fileURL
      );

      return message;
    } catch (error) {
      console.error('MessageService sendPrivateMessage error:', error);
      throw error;
    }
  }

  async getPrivateMessages(userId: number, friendId: number, options: any) {
    try {
      const result = await messageRepository.getPrivateMessages(
        userId, 
        friendId, 
        options.page, 
        options.limit, 
        options.search
      );
      return result;
    } catch (error) {
      console.error('MessageService getPrivateMessages error:', error);
      throw error;
    }
  }

  async getOlderPrivateMessages(userId: number, friendId: number, lastMessageId: number, limit: number) {
    try {
      const result = await messageRepository.getOlderPrivateMessages(
        userId, 
        friendId, 
        lastMessageId, 
        limit
      );
      return result;
    } catch (error) {
      console.error('MessageService getOlderPrivateMessages error:', error);
      throw error;
    }
  }

  async sendGroupMessage(senderId: number, data: SendGroupMessageDTO) {
    try {
      // Check if user is member of the group
      const isMember = await groupRepository.checkMembership(data.groupId, senderId);
      if (!isMember) {
        throw new Error('You are not a member of this group');
      }

      // Check if user has permission to send messages
      const memberRole = await groupRepository.getMemberRole(data.groupId, senderId);
      if (memberRole === UserRole.PENDING) {
        throw new Error('Your membership is pending approval');
      }

      const message = await messageRepository.createGroupMessage(
        senderId,
        data.groupId,
        data.content,
        data.type || 'TEXT',
        data.fileURL
      );

      return message;
    } catch (error) {
      console.error('MessageService sendGroupMessage error:', error);
      throw error;
    }
  }

  async getGroupMessages(userId: number, groupId: number, options: any) {
    try {
      // Check if user is member of the group
      const isMember = await groupRepository.checkMembership(groupId, userId);
      if (!isMember) {
        throw new Error('You are not a member of this group');
      }

      const result = await messageRepository.getGroupMessages(
        groupId, 
        options.page, 
        options.limit, 
        options.search
      );
      return result;
    } catch (error) {
      console.error('MessageService getGroupMessages error:', error);
      throw error;
    }
  }

  async getOlderGroupMessages(userId: number, groupId: number, lastMessageId: number, limit: number) {
    try {
      // Check if user is member of the group
      const isMember = await groupRepository.checkMembership(groupId, userId);
      if (!isMember) {
        throw new Error('You are not a member of this group');
      }

      const result = await messageRepository.getOlderGroupMessages(
        groupId, 
        lastMessageId, 
        limit
      );
      return result;
    } catch (error) {
      console.error('MessageService getOlderGroupMessages error:', error);
      throw error;
    }
  }

  async deleteMessage(userId: number, messageId: number) {
    try {
      const result = await messageRepository.deleteMessage(userId, messageId);
      return result;
    } catch (error) {
      console.error('MessageService deleteMessage error:', error);
      throw error;
    }
  }
}

export default new MessageService();