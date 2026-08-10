import { Router } from 'express'
import rfidRouter from './rfid'
import dashboardRouter from './dashboard'
import authRouter from './auth'
import studentsRouter from './students'
import parentsRouter from './parents'
import reportsRouter from './reports'

/**
 * Root API router
 */
const router = Router()

router.use('/api/v1/auth', authRouter)
router.use('/api/v1/rfid', rfidRouter)
router.use('/api/v1/dashboard', dashboardRouter)
router.use('/api/v1/students', studentsRouter)
router.use('/api/v1/parents', parentsRouter)
router.use('/api/v1/reports', reportsRouter)

export default router
