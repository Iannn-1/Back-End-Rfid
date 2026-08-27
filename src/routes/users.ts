import { Router } from 'express';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/userController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// All user management routes require authentication
router.use(authMiddleware);

/**
 * @route   GET /api/v1/users
 * @desc    Get all users (admin accounts)
 * @access  Private (authenticated users)
 */
router.get('/', getAllUsers);

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get a single user by ID
 * @access  Private (authenticated users)
 */
router.get('/:id', getUserById);

/**
 * @route   POST /api/v1/users
 * @desc    Create a new user (admin account)
 * @access  Private (authenticated users - typically superadmin only)
 */
router.post('/', createUser);

/**
 * @route   PATCH /api/v1/users/:id
 * @desc    Update a user
 * @access  Private (authenticated users)
 */
router.patch('/:id', updateUser);

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete a user
 * @access  Private (authenticated users - typically superadmin only)
 */
router.delete('/:id', deleteUser);

export default router;
