import { Router } from 'express';
import authMiddleware from '../middleware/authMiddleware';
import {
  getReportStats,
  generateReport,
  getReportHistory,
} from '../controllers/reportsController';

const router = Router();

// All report endpoints require a valid JWT
router.get('/stats',        authMiddleware, getReportStats);
router.post('/generate',    authMiddleware, generateReport);
router.get('/history',      authMiddleware, getReportHistory);

export default router;
