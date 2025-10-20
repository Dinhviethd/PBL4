import { Request, Response } from 'express';
import { GroupService } from '@/services/group.service';
import { asyncHandler } from '@/utils/error.response';
import { AppError } from '@/utils/error.response';

export class GroupController {
  private groupService: GroupService;

  constructor() {
    this.groupService = new GroupService();
  }

  createGroup = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    if (!name || name.trim() === '') {
      throw new AppError(400, 'Group name is required');
    }

    const result = await this.groupService.createGroup(name.trim(), userId);

    res.status(201).json({
      success: true,
      message: 'Group created successfully',
      data: result
    });
  });

  addMember = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { userId: targetUserId } = req.body;
    const requesterId = req.user?.userId;

    if (!requesterId) {
      throw new AppError(401, 'Unauthorized');
    }

    if (!targetUserId) {
      throw new AppError(400, 'Target user ID is required');
    }

    const result = await this.groupService.addMemberToGroup(
      parseInt(groupId),
      targetUserId,
      requesterId
    );

    res.status(200).json({
      success: true,
      ...result
    });
  });

  approveMember = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { userId: targetUserId } = req.body;
    const adminId = req.user?.userId;

    if (!adminId) {
      throw new AppError(401, 'Unauthorized');
    }

    if (!targetUserId) {
      throw new AppError(400, 'Target user ID is required');
    }

    const result = await this.groupService.approvePendingMember(
      parseInt(groupId),
      targetUserId,
      adminId
    );

    res.status(200).json({
      success: true,
      ...result
    });
  });

  leaveGroup = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const result = await this.groupService.leaveGroup(parseInt(groupId), userId);

    res.status(200).json({
      success: true,
      ...result
    });
  });

  kickMember = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { userId: targetUserId } = req.body;
    const adminId = req.user?.userId;

    if (!adminId) {
      throw new AppError(401, 'Unauthorized');
    }

    if (!targetUserId) {
      throw new AppError(400, 'Target user ID is required');
    }

    const result = await this.groupService.kickMember(
      parseInt(groupId),
      targetUserId,
      adminId
    );

    res.status(200).json({
      success: true,
      ...result
    });
  });

  deleteGroup = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const adminId = req.user?.userId;

    if (!adminId) {
      throw new AppError(401, 'Unauthorized');
    }

    const result = await this.groupService.deleteGroup(parseInt(groupId), adminId);

    res.status(200).json({
      success: true,
      ...result
    });
  });

  getGroupMembers = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const members = await this.groupService.getGroupMembers(parseInt(groupId), userId);

    res.status(200).json({
      success: true,
      data: members
    });
  });

  getUserGroups = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const groups = await this.groupService.getUserGroups(userId);

    res.status(200).json({
      success: true,
      data: groups
    });
  });

  getPendingMembers = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const adminId = req.user?.userId;

    if (!adminId) {
      throw new AppError(401, 'Unauthorized');
    }

    const pendingMembers = await this.groupService.getPendingMembers(parseInt(groupId), adminId);

    res.status(200).json({
      success: true,
      data: pendingMembers
    });
  });
}