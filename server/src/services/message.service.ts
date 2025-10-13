import messageRepository from '@/repositories/message.repository';
import groupRepository from '@/repositories/group.repository';
import { AppError } from '@/utils/error.response';
import { SendPrivateMessageDTO, SendGroupMessageDTO, GetMessagesDTO, GetOlderMessagesDTO } from '@/schemas/message.schema';
import { wsService } from './websocket.service';
import { WSMessageType } from '@/constants/constants';
import { PaginationResult } from '@/utils/pagination';
import { Message } from '@/models/message.model';
import notificationService from './notification.service';

class MessageService {
  async sendPrivateMessage(senderId: number, data: SendPrivateMessageDTO) {
    const { receiverId, content, type, fileURL } = data;
    
    // TODO: Kiểm tra người nhận có tồn tại không
    // TODO: Kiểm tra quan hệ bạn bè (tùy chọn)
    
    const message = await messageRepository.createPrivateMessage(
      senderId,
      receiverId,
      content,
      type,
      fileURL
    );

    // Gửi realtime qua WebSocket
    wsService.sendPrivateMessage(senderId, receiverId, {
      type: WSMessageType.PRIVATE_MESSAGE,
      message
    });

    // Tạo thông báo cho người nhận (chỉ khi không phải tin nhắn từ chính mình)
    if (senderId !== receiverId) {
      try {
        await notificationService.createMessageNotification(
          senderId,
          receiverId,
          content,
          message.idMessage
        );
      } catch (error) {
        console.error('Failed to create message notification:', error);
        // Không throw error để không ảnh hưởng đến việc gửi tin nhắn
      }
    }

    return message;
  }

  async sendGroupMessage(senderId: number, data: SendGroupMessageDTO) {
    const { groupId, content, type, fileURL } = data;
    
    // Kiểm tra group có tồn tại
    const group = await groupRepository.getGroupById(groupId);
    if (!group) {
      throw new AppError(404, 'Group not found');
    }
    
    // Kiểm tra user có phải member của group
    const isMember = await groupRepository.checkMembership(groupId, senderId);
    if (!isMember) {
      throw new AppError(403, 'You are not a member of this group');
    }

    const message = await messageRepository.createGroupMessage(
      senderId,
      groupId,
      content,
      type,
      fileURL
    );
    
    // Gửi realtime cho tất cả members trong group
    const members = await groupRepository.getGroupMembers(groupId);
    const memberIds = members.map(member => member.idUser.idUser);
    
    wsService.sendGroupMessage(senderId, memberIds, {
      type: WSMessageType.GROUP_MESSAGE,
      message,
      groupId
    });

    // Tạo thông báo cho tất cả thành viên khác trong nhóm
    try {
      const otherMemberIds = memberIds.filter(memberId => memberId !== senderId);
      const groupName = group.name || 'Nhóm';
      
      // Tạo thông báo cho từng thành viên
      const notificationPromises = otherMemberIds.map(memberId => 
        notificationService.createMessageNotification(
          senderId,
          memberId,
          `[${groupName}] ${content}`, // Thêm tên nhóm vào nội dung
          message.idMessage
        )
      );
      
      await Promise.allSettled(notificationPromises);
    } catch (error) {
      console.error('Failed to create group message notifications:', error);
      // Không throw error để không ảnh hưởng đến việc gửi tin nhắn
    }

    return message;
  }

  async getPrivateMessages(
    userId: number, 
    friendId: number, 
    options: GetMessagesDTO
  ): Promise<PaginationResult<Message>> {
    const { page, limit, search } = options;
    
    // TODO: Kiểm tra quan hệ bạn bè hoặc quyền xem tin nhắn
    
    return await messageRepository.getPrivateMessages(userId, friendId, page, limit, search);
  }

  async getGroupMessages(
    userId: number, 
    groupId: number, 
    options: GetMessagesDTO
  ): Promise<PaginationResult<Message>> {
    const { page, limit, search } = options;
    
    // Kiểm tra user có phải member của group
    const isMember = await groupRepository.checkMembership(groupId, userId);
    if (!isMember) {
      throw new AppError(403, 'You are not a member of this group');
    }

    return await messageRepository.getGroupMessages(groupId, page, limit, search);
  }

  // Load more messages (hiệu quả hơn cho real-time chat)
  async getOlderPrivateMessages(
    userId: number,
    friendId: number,
    options: GetOlderMessagesDTO
  ): Promise<Message[]> {
    const { lastMessageId, limit } = options;
    
    return await messageRepository.getOlderPrivateMessages(userId, friendId, lastMessageId, limit);
  }

  async getOlderGroupMessages(
    userId: number,
    groupId: number,
    options: GetOlderMessagesDTO
  ): Promise<Message[]> {
    const { lastMessageId, limit } = options;
    
    // Kiểm tra user có phải member của group
    const isMember = await groupRepository.checkMembership(groupId, userId);
    if (!isMember) {
      throw new AppError(403, 'You are not a member of this group');
    }

    return await messageRepository.getOlderGroupMessages(groupId, lastMessageId, limit);
  }

  async deleteMessage(userId: number, messageId: number) {
    const message = await messageRepository.getMessageById(messageId);
    if (!message) {
      throw new AppError(404, 'Message not found');
    }

    if (message.sentBy.idUser !== userId) {
      throw new AppError(403, 'You can only delete your own messages');
    }

    await messageRepository.deleteMessage(messageId);
    return { message: 'Message deleted successfully' };
  }

  async getRecentConversations(userId: number) {
    return await messageRepository.getRecentConversations(userId);
  }
}

export default new MessageService();