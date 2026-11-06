import { Router } from 'express';
import { register, login, getChild, verifyEmail, resendVerificationCode } from '../controllers/parentController';
import { parentAuthMiddleware } from '../middleware/parentAuthMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login',    login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);
router.get('/child',     parentAuthMiddleware, getChild);

export default router;
