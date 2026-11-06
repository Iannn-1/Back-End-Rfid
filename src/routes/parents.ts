import { Router } from 'express';
import { register, login, getChild, verifyEmail, resendVerificationCode, requestPasswordReset, verifyResetCode, resetPassword } from '../controllers/parentController';
import { parentAuthMiddleware } from '../middleware/parentAuthMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login',    login);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationCode);
router.post('/forgot-password', requestPasswordReset);
router.post('/verify-reset-code', verifyResetCode);
router.post('/reset-password', resetPassword);
router.get('/child',     parentAuthMiddleware, getChild);

export default router;
