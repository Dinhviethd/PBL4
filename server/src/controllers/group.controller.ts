import { Request, Response } from 'express';
import groupService from '@/services/group.service';
import { CreateGroupSchema, AddMemberSchema, UpdateGroupSchema } from '@/schemas/group.schema';
import { asyncHandler } from '@/utils/error.response';

class GroupController {
  createGroup = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const data = CreateGroupSchema.parse(req.body);

    const group = await groupService.createGroup(userId, data);

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group
    });
  });

  addMember = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const groupId = parseInt(req.params.groupId);
    const data = AddMemberSchema.parse(req.body);

    const result = await groupService.addMember(userId, groupId, data);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  removeMember = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const groupId = parseInt(req.params.groupId);
    const memberId = parseInt(req.params.memberId);

    const result = await groupService.removeMember(userId, groupId, memberId);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  getGroupDetails = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const groupId = parseInt(req.params.groupId);

    const group = await groupService.getGroupDetails(userId, groupId);

    res.status(200).json({
      success: true,
      data: group
    });
  });

  getUserGroups = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;

    const groups = await groupService.getUserGroups(userId);

    res.status(200).json({
      success: true,
      data: groups
    });
  });

  // paginated listing with search & sort
  getUserGroupsPaginated = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser?? (req as any).user.userId;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const q = (req.query.q as string) || undefined;
    const sort = (req.query.sort as string) === 'desc' ? 'desc' : 'asc';

    const result = await groupService.getUserGroupsPaginated(userId, page, limit, q, sort as any);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  updateGroup = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const groupId = parseInt(req.params.groupId);
    const data = UpdateGroupSchema.parse(req.body);

    const result = await groupService.updateGroup(userId, groupId, data);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  deleteGroup = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const groupId = parseInt(req.params.groupId);

    const result = await groupService.deleteGroup(userId, groupId);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  leaveGroup = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId || (req as any).user.userId;
    const groupId = parseInt(req.params.groupId);

    const result = await groupService.removeMember(userId, groupId, userId);

    res.status(200).json({
      success: true,
      message: 'Left group successfully',
      data: result
    });
  });
}

export default new GroupController();