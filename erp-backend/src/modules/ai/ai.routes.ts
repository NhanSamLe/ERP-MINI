import { Router } from 'express';
import { aiController } from './ai.controller';
import { authMiddleware } from '../../core/middleware/auth';

const router = Router();

router.get(  '/health', aiController.health.bind(aiController));
router.post( '/chat',   authMiddleware([]), aiController.chat.bind(aiController));
router.post( '/chat/stream', authMiddleware([]), aiController.chatStream.bind(aiController));
router.post( '/sync',   authMiddleware([]), aiController.sync.bind(aiController));

export default router;
