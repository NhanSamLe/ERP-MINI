import { Router } from 'express';
import { authMiddleware } from '../../core/middleware/auth';
import multer from 'multer';
import * as setupController from './controllers/setup.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get('/status', authMiddleware([]), setupController.getStatus);
router.put('/step/1', authMiddleware([]), setupController.step1);
router.post('/step/logo', authMiddleware([]), upload.single('logo'), setupController.uploadLogo);
router.put('/step/2', authMiddleware([]), setupController.step2);
router.put('/step/3', authMiddleware([]), setupController.step3);
router.put('/step/4', authMiddleware([]), setupController.step4);
router.post('/invite-members', authMiddleware([]), setupController.inviteMembers);
router.post('/complete', authMiddleware([]), setupController.complete);

export default router;
