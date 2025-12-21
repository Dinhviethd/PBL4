import { Router, Request, Response } from 'express';
import CallController from '@/controllers/call.controller';
import { authMiddleware } from '@/middlewares/auth.middleware';

const router = Router();

// Áp dụng middleware xác thực cho tất cả routes
router.use(authMiddleware);

/**
 * GET /api/calls/debug/connections
 * Lấy danh sách các kết nối WebSocket hiện tại (debug only)
 */
router.get('/debug/connections', (req: Request, res: Response) => 
  CallController.getActiveConnections(req, res)
);

/**
 * GET /api/calls/history/:userId
 * Lấy lịch sử cuộc gọi với một người dùng cụ thể
 */
router.get('/history/:userId', (req: Request, res: Response) => 
  CallController.getCallHistory(req, res)
);

/**
 * GET /api/calls/received
 * Lấy tất cả cuộc gọi đã nhận
 */
router.get('/received', (req: Request, res: Response) => 
  CallController.getReceivedCalls(req, res)
);

/**
 * GET /api/calls/sent
 * Lấy tất cả cuộc gọi đã gửi
 */
router.get('/sent', (req: Request, res: Response) => 
  CallController.getSentCalls(req, res)
);

/**
 * GET /api/calls/:callId
 * Lấy thông tin cuộc gọi
 */
router.get('/:callId', (req: Request, res: Response) => 
  CallController.getCall(req, res)
);

export default router;
