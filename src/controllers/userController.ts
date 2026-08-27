import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { ApiResponse, UserAttributes } from '../types/models';

/**
 * Get all users (admin accounts)
 * GET /api/v1/users
 * Only superadmins can access this
 */
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is authenticated and is superadmin
    if (!req.user || req.user.role !== 'superadmin') {
      res.status(403).json({
        success: false,
        error: 'Access denied. Only superadmins can manage user accounts.',
      });
      return;
    }

    const users = await User.findAll({
      order: [['createdAt', 'DESC']],
    });

    res.json({
      success: true,
      data: users.map(u => u.toJSON() as UserAttributes),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get a single user by ID
 * GET /api/v1/users/:id
 */
export const getUserById = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    res.json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create a new user (admin account)
 * POST /api/v1/users
 * Only superadmins can access this
 */
export const createUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is authenticated and is superadmin
    if (!req.user || req.user.role !== 'superadmin') {
      res.status(403).json({
        success: false,
        error: 'Access denied. Only superadmins can create user accounts.',
      });
      return;
    }

    const { name, email, password, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      res.status(400).json({
        success: false,
        error: 'Name, email, and password are required',
      });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: 'Password must be at least 6 characters',
      });
      return;
    }

    // Check if role is valid
    const validRoles: Array<'superadmin' | 'admin' | 'viewer'> = ['superadmin', 'admin', 'viewer'];
    if (role && !validRoles.includes(role)) {
      res.status(400).json({
        success: false,
        error: 'Invalid role. Must be superadmin, admin, or viewer',
      });
      return;
    }

    // Check if email already exists
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'Email already exists',
      });
      return;
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Create user
    const user = await User.create({
      name,
      email,
      password_hash,
      role: role || 'viewer',
    });

    res.status(201).json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update a user
 * PATCH /api/v1/users/:id
 * Only superadmins can access this
 */
export const updateUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is authenticated and is superadmin
    if (!req.user || req.user.role !== 'superadmin') {
      res.status(403).json({
        success: false,
        error: 'Access denied. Only superadmins can update user accounts.',
      });
      return;
    }

    const { id } = req.params;
    const { name, email, password, role } = req.body;

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Check if role is valid
    if (role) {
      const validRoles: Array<'superadmin' | 'admin' | 'viewer'> = ['superadmin', 'admin', 'viewer'];
      if (!validRoles.includes(role)) {
        res.status(400).json({
          success: false,
          error: 'Invalid role. Must be superadmin, admin, or viewer',
        });
        return;
      }
    }

    // Check if email is being changed and already exists
    if (email && email !== user.email) {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(409).json({
          success: false,
          error: 'Email already exists',
        });
        return;
      }
    }

    // Update fields
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role;

    // Update password if provided
    if (password) {
      if (password.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters',
        });
        return;
      }
      user.password_hash = await bcrypt.hash(password, 10);
    }

    await user.save();

    res.json({
      success: true,
      user: user.toJSON(),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a user
 * DELETE /api/v1/users/:id
 * Only superadmins can access this
 */
export const deleteUser = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Check if user is authenticated and is superadmin
    if (!req.user || req.user.role !== 'superadmin') {
      res.status(403).json({
        success: false,
        error: 'Access denied. Only superadmins can delete user accounts.',
      });
      return;
    }

    const { id } = req.params;

    const user = await User.findByPk(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Prevent deleting the last superadmin
    if (user.role === 'superadmin') {
      const superadminCount = await User.count({ where: { role: 'superadmin' } });
      if (superadminCount <= 1) {
        res.status(403).json({
          success: false,
          error: 'Cannot delete the last superadmin account',
        });
        return;
      }
    }

    await user.destroy();

    res.json({
      success: true,
      data: { message: 'User deleted successfully' },
    });
  } catch (error) {
    next(error);
  }
};
