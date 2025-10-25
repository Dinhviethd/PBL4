import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/error.response';
import { GroupService } from '@/services/group.service';

export class GroupController {
  private groupService: GroupService;

  constructor() {
    this.groupService = new GroupService();
  }

  createGroup = asyncHandler(async (req: Request, res: Response) => {
    const { name } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!name || name.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Group name is required'
      });
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
    const { userId } = req.body;
    const requesterId = req.user?.userId;

    if (!requesterId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await this.groupService.addMemberToGroup(
      parseInt(groupId), 
      userId, 
      requesterId
    );

    res.json({
      success: true,
      message: result.message,
      data: result
    });
  });

  approveMember = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { userId } = req.body;
    const adminId = req.user?.userId;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await this.groupService.approvePendingMember(
      parseInt(groupId),
      userId,
      adminId
    );

    res.json({
      success: true,
      message: result.message
    });
  });

  leaveGroup = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await this.groupService.leaveGroup(parseInt(groupId), userId);

    res.json({
      success: true,
      message: result.message
    });
  });

  kickMember = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const { userId } = req.body;
    const adminId = req.user?.userId;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await this.groupService.kickMember(
      parseInt(groupId),
      userId,
      adminId
    );

    res.json({
      success: true,
      message: result.message
    });
  });

  deleteGroup = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const adminId = req.user?.userId;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await this.groupService.deleteGroup(parseInt(groupId), adminId);

    res.json({
      success: true,
      message: result.message
    });
  });

  getGroupMembers = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const members = await this.groupService.getGroupMembers(parseInt(groupId), userId);

    res.json({
      success: true,
      data: members
    });
  });

  getUserGroups = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const groups = await this.groupService.getUserGroups(userId);

    res.json({
      success: true,
      data: groups
    });
  });

  getPendingMembers = asyncHandler(async (req: Request, res: Response) => {
    const { groupId } = req.params;
    const adminId = req.user?.userId;

    if (!adminId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const pendingMembers = await this.groupService.getPendingMembers(parseInt(groupId), adminId);

    res.json({
      success: true,
      data: pendingMembers
    });
  });
}
