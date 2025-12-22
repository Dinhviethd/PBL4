import { Request, Response } from 'express';
import { MessageService } from '@/services/message.service';
import { asyncHandler } from '@/utils/error.response';
import { AppError } from '@/utils/error.response';
import { MessageType } from '@/constants/constants';
import { uploadFileToCloudinary, deleteFromCloudinary } from '@/utils/upload';

export class MessageController {
  private messageService: MessageService;

  constructor() {
    this.messageService = new MessageService();
  }

  sendPrivateMessage = asyncHandler(async (req: Request, res: Response) => {
    const { receiverId, content, type = MessageType.TEXT, fileURL } = req.body;
    const senderId = req.user?.userId;

    if (!senderId) {
      throw new AppError(401, 'Unauthorized');
    }

    if (!receiverId || !content) {
      throw new AppError(400, 'Receiver ID and content are required');
    }

    // Convert receiverId to number to ensure type consistency
    const receiverIdNum = typeof receiverId === 'string' ? parseInt(receiverId, 10) : receiverId;

    const result = await this.messageService.sendPrivateMessage(
      senderId,
      receiverIdNum,
      content,
      type,
      fileURL
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: result
    });
  });

  sendGroupMessage = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { content, type = MessageType.TEXT, fileURL } = req.body;
    const senderId = req.user?.userId;

    if (!senderId) {
      throw new AppError(401, 'Unauthorized');
    }

    if (!content) {
      throw new AppError(400, 'Content is required');
    }

    const result = await this.messageService.sendGroupMessage(
      senderId,
      parseInt(groupId),
      content,
      type,
      fileURL
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: result
    });
  });

  getPrivateMessages = asyncHandler(async (req: Request, res: Response) => {
    const { partnerId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const result = await this.messageService.getPrivateMessages(
      userId,
      parseInt(partnerId),
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  getGroupMessages = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const result = await this.messageService.getGroupMessages(
      userId,
      parseInt(groupId),
      parseInt(page as string),
      parseInt(limit as string)
    );

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination
    });
  });

  editMessage = asyncHandler(async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    if (!content) {
      throw new AppError(400, 'Content is required');
    }

    const result = await this.messageService.editMessage(
      parseInt(messageId),
      userId,
      content
    );

    res.status(200).json({
      success: true,
      ...result
    });
  });

  deleteMessage = asyncHandler(async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const result = await this.messageService.deleteMessage(
      parseInt(messageId),
      userId
    );

    res.status(200).json({
      success: true,
      ...result
    });
  });

  markAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const result = await this.messageService.markMessageAsRead(
      parseInt(messageId),
      userId
    );

    res.status(200).json({
      success: true,
      ...result
    });
  });

  markPrivateConversationAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { partnerId } = req.params;
    const userId = req.user?.userId;


    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const result = await this.messageService.markPrivateConversationAsRead(
      userId,
      parseInt(partnerId)
    );
    

    res.status(200).json({
      success: true,
      ...result
    });
  });

  markGroupConversationAsRead = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const userId = req.user?.userId;


    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const result = await this.messageService.markGroupConversationAsRead(
      userId,
      parseInt(groupId)
    );
    

    res.status(200).json({
      success: true,
      ...result
    });
  });

  getRecentConversations = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const conversations = await this.messageService.getRecentConversations(userId);

    res.status(200).json({
      success: true,
      data: conversations
    });
  });

  uploadFile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;
    
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    if (!req.file) {
      throw new AppError(400, 'Không có file nào được tải lên');
    }

    try {
      // Upload file to Cloudinary with fileName for type detection
      const result = await uploadFileToCloudinary(req.file.path, 'messages', req.file.originalname);
      
      res.status(201).json({
        success: true,
        data: {
          url: result.secure_url,
          fileType: req.file.mimetype,
          fileName: req.file.originalname,
          fileSize: req.file.size
        },
        message: 'Upload file thành công'
      });
    } catch (error: any) {
      throw new AppError(500, `Upload file thất bại: ${error.message}`);
    }
  });
}