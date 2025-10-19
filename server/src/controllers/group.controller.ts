import { Request, Response } from 'express';
import groupService from '@/services/group.service';
import { CreateGroupSchema, AddMemberSchema, UpdateGroupSchema } from '@/schemas/group.schema';
import { asyncHandler } from '@/utils/error.response';

class GroupController {
  private readonly groupService = groupService;

  createGroup = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const data = CreateGroupSchema.parse(req.body);

    const group = await this.groupService.createGroup(userId, data);

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

    const result = await this.groupService.addMember(userId, groupId, data, userId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: {
        userId: data.userId,
        role: result.role,
        status: result.role,
      }
    });
  });

  approveMember = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);
    const memberId = parseInt(req.params.memberId);

    const result = await this.groupService.approveMember(userId, groupId, memberId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { memberId, newRole: 'USER' }
    });
  });

  rejectMember = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);
    const memberId = parseInt(req.params.memberId);

    const result = await this.groupService.rejectMember(userId, groupId, memberId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { memberId, action: 'rejected' }
    });
  });

  getPendingMembers = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);

    const members = await this.groupService.getPendingMembers(userId, groupId);

    res.status(200).json({
      success: true,
      data: members
    });
  });

  removeMember = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);
    const memberId = parseInt(req.params.memberId);

    const result = await this.groupService.removeMember(userId, groupId, memberId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: { memberId, action: 'removed' }
    });
  });

  getGroupDetails = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);

    const group = await this.groupService.getGroupDetails(userId, groupId);

    res.status(200).json({
      success: true,
      data: group
    });
  });

  getUserGroups = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;

    const groups = await this.groupService.getUserGroups(userId);

    res.status(200).json({
      success: true,
      data: groups
    });
  });

  updateGroup = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);
    const data = UpdateGroupSchema.parse(req.body);

    const result = await this.groupService.updateGroup(userId, groupId, data);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  });

  deleteGroup = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);

    const result = await this.groupService.deleteGroup(userId, groupId);

    res.status(200).json({
      success: true,
      message: result.message,
      data: result
    });
  });

  leaveGroup = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.idUser;
    const groupId = parseInt(req.params.groupId);

    const result = await this.groupService.removeMember(userId, groupId, userId);

    res.status(200).json({
      success: true,
      message: 'Left group successfully',
      data: result
    });
  });
}

export default new GroupController();