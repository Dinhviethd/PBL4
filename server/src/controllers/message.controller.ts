import { Request, Response } from 'express';
import messageService from '@/services/message.service';
import { SendPrivateMessageSchema, SendGroupMessageSchema, GetMessagesSchema, GetOlderMessagesSchema } from '@/schemas/message.schema';
import { asyncHandler } from '@/utils/error.response';

class MessageController {
  sendPrivateMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const data = SendPrivateMessageSchema.parse(req.body);

    const message = await messageService.sendPrivateMessage(userId, data);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  });

  sendGroupMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const data = SendGroupMessageSchema.parse(req.body);

    const message = await messageService.sendGroupMessage(userId, data);

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: message
    });
  });

  getPrivateMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const friendId = parseInt(req.params.friendId);
    const options = GetMessagesSchema.parse(req.query);

    const result = await messageService.getPrivateMessages(userId, friendId, options);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  getGroupMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);
    const options = GetMessagesSchema.parse(req.query);

    const result = await messageService.getGroupMessages(userId, groupId, options);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  // Load more messages
  getOlderPrivateMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const friendId = parseInt(req.params.friendId);
    const options = GetOlderMessagesSchema.parse(req.query);

    const messages = await messageService.getOlderPrivateMessages(userId, friendId, options);

    res.status(200).json({
      success: true,
      data: messages
    });
  });

  getOlderGroupMessages = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);
    const options = GetOlderMessagesSchema.parse(req.query);

    const messages = await messageService.getOlderGroupMessages(userId, groupId, options);

    res.status(200).json({
      success: true,
      data: messages
    });
  });

  deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const messageId = parseInt(req.params.messageId);

    const result = await messageService.deleteMessage(userId, messageId);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  getRecentConversations = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;

    const conversations = await messageService.getRecentConversations(userId);

    res.status(200).json({
      success: true,
      data: conversations
    });
  });
}

export default new MessageController();