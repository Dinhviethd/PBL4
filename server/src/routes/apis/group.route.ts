import { Router } from 'express';
import { authMiddleware } from '@/middlewares/auth.middleware';
import groupController from '@/controllers/group.controller';

const router = Router();

router.use(authMiddleware);
router.get('/', groupController.getUserGroups);

export default router;