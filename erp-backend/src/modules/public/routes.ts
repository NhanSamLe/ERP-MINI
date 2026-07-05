import { Router } from 'express';
import { register } from './controllers/register.controller';
import { signatureController } from '../purchase/controllers/signature.controller';

const router = Router();

router.post('/register', register);
router.get('/verify-signature/:hash', signatureController.verifyPublicSignature);
router.post('/verify-signature/:hash/confirm-po', signatureController.confirmPurchaseOrderPublicly);

export default router;
