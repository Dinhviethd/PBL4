import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/error.response';
import { GroupService } from '@/services/group.service';

export class GroupController {
    updateGroup = asyncHandler(async (req: Request, res: Response) => {
      const { groupId } = req.params;
      const { name, statusGroup } = req.body;
      const userId = req.user?.userId;

      if (!userId) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
      }

      if (!name && typeof statusGroup === 'undefined') {
        return res.status(400).json({ success: false, message: 'No update data provided' });
      }

      const result = await this.groupService.updateGroup(parseInt(groupId), userId, { name, statusGroup });
      res.json({ success: true, message: 'Group updated', data: result });
    });
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
    const { page = 1, limit = 10, search = '', sort = 'asc' } = req.query;

    console.log('📋 [getUserGroups] userId:', userId);
    console.log('📋 [getUserGroups] params:', { page, limit, search, sort });

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const groups = await this.groupService.getUserGroups(userId);
    console.log('📋 [getUserGroups] groups fetched:', groups?.length || 0, 'groups');

    res.json({
      success: true,
      data: groups,
      items: groups,
      total: groups?.length || 0
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

