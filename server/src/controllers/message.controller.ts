import { Request, Response } from 'express';
import messageService from '@/services/message.service';
import { SendPrivateMessageSchema, SendGroupMessageSchema } from '@/schemas/message.schema';
import { asyncHandler } from '@/utils/error.response';

class MessageController {
  // Get recent conversations for sidebar
  getRecentConversations = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    
    const result = await messageService.getRecentConversations(userId);
    
    res.json({
      success: true,
      data: result
    });
  });

  // Send private message
  sendPrivateMessage = asyncHandler(async (req: Request, res: Response) => {
    const senderId = (req as any).user.idUser;
    const data = SendPrivateMessageSchema.parse(req.body);
    
    const result = await messageService.sendPrivateMessage(senderId, data);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Message sent successfully'
    });
  });

  // Get private messages between two users
  getPrivateMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const friendId = parseInt(req.params.friendId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const result = await messageService.getPrivateMessages(userId, friendId, {
      page,
      limit,
      search
    });
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  // Get older private messages (for infinite scroll)
  getOlderPrivateMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const friendId = parseInt(req.params.friendId);
    const lastMessageId = parseInt(req.query.lastMessageId as string);
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await messageService.getOlderPrivateMessages(userId, friendId, lastMessageId, limit);
    
    res.json({
      success: true,
      data: result
    });
  });

  // Send group message
  sendGroupMessage = asyncHandler(async (req: Request, res: Response) => {
    const senderId = (req as any).user.idUser;
    const data = SendGroupMessageSchema.parse(req.body);
    
    const result = await messageService.sendGroupMessage(senderId, data);
    
    res.status(201).json({
      success: true,
      data: result,
      message: 'Group message sent successfully'
    });
  });

  // Get group messages
  getGroupMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const search = req.query.search as string;

    const result = await messageService.getGroupMessages(userId, groupId, {
      page,
      limit,
      search
    });
    
    res.json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  // Get older group messages
  getOlderGroupMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);
    const lastMessageId = parseInt(req.query.lastMessageId as string);
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await messageService.getOlderGroupMessages(userId, groupId, lastMessageId, limit);
    
    res.json({
      success: true,
      data: result
    });
  });

  // Delete message
  deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const messageId = parseInt(req.params.messageId);
    
    const result = await messageService.deleteMessage(userId, messageId);
    
    res.json({
      success: true,
      message: 'Message deleted successfully',
      data: result
    });
  });
}

export default new MessageController();