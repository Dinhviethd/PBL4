import { Request, Response } from 'express';
import { asyncHandler } from '@/utils/error.response';
import { GroupService } from '@/services/group.service';

export class GroupController {
      getGroupById = asyncHandler(async (req: Request, res: Response) => {
        const { groupId } = req.params;
        if (!groupId) {
          return res.status(400).json({ success: false, message: 'Missing groupId' });
        }
        const group = await this.groupService.getGroupById(parseInt(groupId));
        if (!group) {
          return res.status(404).json({ success: false, message: 'Group not found' });
        }
        res.json({ success: true, data: group });
      });
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
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const search = (req.query.search as string) || '';
    // sort chưa dùng, có thể bổ sung sau


    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    const result = await this.groupService.getUserGroupsWithSearch(userId, search, page, limit);

    res.json({
      success: true,
      data: result.items,
      items: result.items,
      total: result.total
    });
  });

}

