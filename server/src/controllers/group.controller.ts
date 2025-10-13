import { Request, Response } from 'express';
import groupService from '@/services/group.service';
import { CreateGroupSchema, AddMemberSchema, UpdateGroupSchema } from '@/schemas/group.schema';
import { asyncHandler } from '@/utils/error.response';

class GroupController {
  createGroup = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const data = CreateGroupSchema.parse(req.body);

    const group = await groupService.createGroup(userId, data);

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: group
    });
  });

  addMember = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);
    const data = AddMemberSchema.parse(req.body);

    const result = await groupService.addMember(userId, groupId, data);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  removeMember = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);
    const memberId = parseInt(req.params.memberId);

    const result = await groupService.removeMember(userId, groupId, memberId);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  getGroupDetails = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);

    const group = await groupService.getGroupDetails(userId, groupId);

    res.status(200).json({
      success: true,
      data: group
    });
  });

  getUserGroups = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;

    const groups = await groupService.getUserGroups(userId);

    res.status(200).json({
      success: true,
      data: groups
    });
  });

  updateGroup = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);
    const data = UpdateGroupSchema.parse(req.body);

    const result = await groupService.updateGroup(userId, groupId, data);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  deleteGroup = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);

    const result = await groupService.deleteGroup(userId, groupId);

    res.status(200).json({
      success: true,
      data: result
    });
  });

  leaveGroup = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
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