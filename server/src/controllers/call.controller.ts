import { Request, Response } from 'express';
import CallService from '@/services/call.service';
import callSignalingManager from '@/services/callSignaling.service';

class CallController {
  /**
   * GET /api/calls/debug/connections
   * Lấy danh sách các kết nối WebSocket hiện tại (debug only)
   */
  async getActiveConnections(req: Request, res: Response) {
    try {
      const connections = callSignalingManager.getActiveConnections();

      res.json({
        success: true,
        timestamp: new Date().toISOString(),
        totalConnections: connections.length,
        data: connections
      });
    } catch (error) {
      console.error('Error fetching active connections:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch active connections'
      });
    }
  }
  /**
   * GET /api/calls/history/:userId
   * Lấy lịch sử cuộc gọi với một người dùng cụ thể
   */
  async getCallHistory(req: Request, res: Response) {
    try {
      const { userId } = req.params;
      const currentUserId = (req as any).userId;

      const callHistory = await CallService.getCallHistory(
        parseInt(currentUserId),
        parseInt(userId)
      );

      res.json({
        success: true,
        data: callHistory
      });
    } catch (error) {
      console.error('Error fetching call history:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch call history'
      });
    }
  }

  /**
   * GET /api/calls/received
   * Lấy tất cả cuộc gọi đã nhận
   */
  async getReceivedCalls(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const calls = await CallService.getReceivedCalls(parseInt(userId));

      res.json({
        success: true,
        data: calls
      });
    } catch (error) {
      console.error('Error fetching received calls:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch received calls'
      });
    }
  }

  /**
   * GET /api/calls/sent
   * Lấy tất cả cuộc gọi đã gửi
   */
  async getSentCalls(req: Request, res: Response) {
    try {
      const userId = (req as any).userId;

      const calls = await CallService.getSentCalls(parseInt(userId));

      res.json({
        success: true,
        data: calls
      });
    } catch (error) {
      console.error('Error fetching sent calls:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch sent calls'
      });
    }
  }

  /**
   * GET /api/calls/:callId
   * Lấy thông tin cuộc gọi
   */
  async getCall(req: Request, res: Response) {
    try {
      const { callId } = req.params;

      const call = await CallService.getCallById(parseInt(callId));

      if (!call) {
        return res.status(404).json({
          success: false,
          message: 'Call not found'
        });
      }

      res.json({
        success: true,
        data: call
      });
    } catch (error) {
      console.error('Error fetching call:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch call'
      });
    }
  }
}

export default new CallController();
