import { Router } from 'express';
import { register, login, getChild } from '../controllers/parentController';
import { parentAuthMiddleware } from '../middleware/parentAuthMiddleware';

const router = Router();

router.post('/register', register);
router.post('/login',    login);
router.get('/child',     parentAuthMiddleware, getChild);

export default router;
