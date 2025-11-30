import { Request, Response } from 'express';
import groupInvitationService from '@/services/groupInvitation.service';
import { asyncHandler } from '@/utils/error.response';

class GroupInvitationController {
    getInvitesNeedAdminApprove = asyncHandler(async (req: Request, res: Response) => {
      const userId = (req as any).user.userId;
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');
      const result = await groupInvitationService.getInvitesNeedAdminApprove(userId, page, limit);
      res.status(200).json({ success: true, data: result });
    });

    getInvitesWaitingForAdmin = asyncHandler(async (req: Request, res: Response) => {
      const userId = (req as any).user.userId;
      const page = parseInt((req.query.page as string) || '1');
      const limit = parseInt((req.query.limit as string) || '10');
      const result = await groupInvitationService.getInvitesWaitingForAdmin(userId, page, limit);
      res.status(200).json({ success: true, data: result });
    });

  sendInvitation = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { groupId, inviteeId, message } = req.body;
    const inv = await groupInvitationService.sendInvitation(userId, groupId, inviteeId, message);
    res.status(201).json({ success: true, data: inv });
  });

  deleteInvitation = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const invitationId = parseInt(req.params.invitationId);

    const result = await groupInvitationService.deleteInvitation(userId, invitationId);
    res.status(200).json({ success: true, data: result });
  });

  acceptInvitation = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const invitationId = parseInt(req.params.invitationId);

    const result = await groupInvitationService.acceptInvitation(userId, invitationId);
    res.status(200).json({ success: true, data: result });
  });

  getReceivedInvites = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '10');

    const result = await groupInvitationService.getReceivedInvites(userId, page, limit);
    res.status(200).json({ success: true, data: result });
  });

  getSentInvites = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const page = parseInt((req.query.page as string) || '1');
    const limit = parseInt((req.query.limit as string) || '10');

    const result = await groupInvitationService.getSentInvites(userId, page, limit);
    res.status(200).json({ success: true, data: result });
  });
}

export default new GroupInvitationController();
