import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { Parent, Student, AttendanceLog, ParentStudent } from '../models/index';
import { ApiResponse, ApiErrorResponse } from '../types/models';
import { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail } from '../services/emailVerificationService';

// ─── Register ───────────────────────────────────────────────────────────────

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, phone, rfid_tag_uid, rfid_tags } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ success: false, error: 'name, email, and password are required' });
      return;
    }

    // Support both single RFID tag (backward compatibility) and multiple tags
    let tags: string[] = [];
    if (rfid_tags && Array.isArray(rfid_tags) && rfid_tags.length > 0) {
      tags = rfid_tags;
    } else if (rfid_tag_uid) {
      tags = [rfid_tag_uid];
    } else {
      res.status(400).json({ success: false, error: 'At least one RFID tag is required' });
      return;
    }

    // Remove duplicates and empty strings
    tags = [...new Set(tags.filter(tag => tag && tag.trim()))];

    if (tags.length === 0) {
      res.status(400).json({ success: false, error: 'At least one valid RFID tag is required' });
      return;
    }

    // Validate all RFID tags exist in students table
    const students = await Student.findAll({ 
      where: { rfid_tag_uid: { [Op.in]: tags } } 
    });

    if (students.length !== tags.length) {
      const foundTags = students.map(s => s.rfid_tag_uid);
      const notFoundTags = tags.filter(tag => !foundTags.includes(tag));
      res.status(404).json({ 
        success: false, 
        error: `No student found with RFID tag(s): ${notFoundTags.join(', ')}. Please check the tag IDs and try again.` 
      });
      return;
    }

    // Check duplicate email
    const existing = await (Parent as any).unscoped().findOne({ where: { email } });
    if (existing) {
      res.status(409).json({ success: false, error: 'Email already registered' });
      return;
    }

    const password_hash = await bcrypt.hash(password, 12);
    
    // Generate verification code (expires in 15 minutes)
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date();
    verificationExpires.setMinutes(verificationExpires.getMinutes() + 15);
    
    // Create parent with first RFID tag for backward compatibility
    const parent = await Parent.create({ 
      name, 
      email, 
      password_hash, 
      phone, 
      rfid_tag_uid: tags[0], // First tag as primary
      email_verified: false,
      verification_code: verificationCode,
      verification_code_expires: verificationExpires
    });

    // Add all RFID tags to ParentStudent junction table
    for (let i = 0; i < tags.length; i++) {
      await ParentStudent.create({
        parent_id: parent.id,
        rfid_tag_uid: tags[i],
        is_primary: i === 0, // First tag is primary
      });
    }

    // Send verification email
    const emailSent = await sendVerificationEmail(email, name, verificationCode);
    
    if (!emailSent) {
      console.warn('[Register] Failed to send verification email, but account was created');
    }

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email for the verification code.',
      data: { 
        id: parent.id, 
        name: parent.name, 
        email: parent.email, 
        rfid_tags: tags,
        email_verified: false
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Login ──────────────────────────────────────────────────────────────────

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, error: 'email and password are required' });
      return;
    }

    const parent = await (Parent as any).unscoped().findOne({ where: { email } });
    if (!parent) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    const valid = await bcrypt.compare(password, parent.password_hash);
    if (!valid) {
      res.status(401).json({ success: false, error: 'Invalid email or password' });
      return;
    }

    // Check if email is verified
    if (!parent.email_verified) {
      res.status(403).json({ 
        success: false, 
        error: 'Email not verified. Please check your email for the verification code.',
        code: 'EMAIL_NOT_VERIFIED'
      });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) throw new Error('JWT_SECRET not configured');

    const token = jwt.sign(
      { id: parent.id, email: parent.email, role: 'parent', rfid_tag_uid: parent.rfid_tag_uid },
      secret,
      { expiresIn: '8h' }
    );

    res.status(200).json({
      success: true,
      data: {
        token,
        parent: { id: parent.id, name: parent.name, email: parent.email, rfid_tag_uid: parent.rfid_tag_uid },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get child info + attendance ────────────────────────────────────────────

export async function getChild(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parentId = (req as any).parent.id;
    const parentRfid = (req as any).parent.rfid_tag_uid;
    const requestedRfid = req.query.rfid_tag_uid as string | undefined;

    // Get all children for this parent
    const parentStudents = await ParentStudent.findAll({
      where: { parent_id: parentId },
      order: [['is_primary', 'DESC'], ['createdAt', 'ASC']],
    });

    // BACKWARD COMPATIBILITY: If no entries in parent_students, use old method
    if (parentStudents.length === 0) {
      console.log(`[getChild] Parent ${parentId} has no entries in parent_students, using fallback`);
      
      // Use the rfid_tag_uid from parent record (old method)
      const student = await Student.findOne({ where: { rfid_tag_uid: parentRfid } });
      if (!student) {
        res.status(404).json({ success: false, error: 'Child not found' });
        return;
      }

      // Last 7 days of attendance
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      sevenDaysAgo.setHours(0, 0, 0, 0);

      const logs = await AttendanceLog.findAll({
        where: {
          student_id: student.id,
          scan_time: { [Op.gte]: sevenDaysAgo },
        },
        order: [['scan_time', 'DESC']],
      });

      // Current status: last log of today
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
      const todayLogs  = logs.filter((l) => {
        const t = new Date(l.scan_time);
        return t >= todayStart && t <= todayEnd;
      });
      const currentStatus = todayLogs.length > 0 ? todayLogs[0].status : null;

      res.status(200).json({
        success: true,
        data: { student, currentStatus, logs },
      });
      return;
    }

    // NEW METHOD: Use parent_students table
    // Determine which child to return
    let rfid_tag_uid: string;
    if (requestedRfid) {
      // Check if requested RFID belongs to this parent
      const hasAccess = parentStudents.some(ps => ps.rfid_tag_uid === requestedRfid);
      if (!hasAccess) {
        res.status(403).json({ success: false, error: 'Access denied to this student' });
        return;
      }
      rfid_tag_uid = requestedRfid;
    } else {
      // Return primary child or first child
      const primary = parentStudents.find(ps => ps.is_primary);
      rfid_tag_uid = primary ? primary.rfid_tag_uid : parentStudents[0].rfid_tag_uid;
    }

    const student = await Student.findOne({ where: { rfid_tag_uid } });
    if (!student) {
      res.status(404).json({ success: false, error: 'Child not found' });
      return;
    }

    // Last 7 days of attendance
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const logs = await AttendanceLog.findAll({
      where: {
        student_id: student.id,
        scan_time: { [Op.gte]: sevenDaysAgo },
      },
      order: [['scan_time', 'DESC']],
    });

    // Current status: last log of today
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const todayLogs  = logs.filter((l) => {
      const t = new Date(l.scan_time);
      return t >= todayStart && t <= todayEnd;
    });
    const currentStatus = todayLogs.length > 0 ? todayLogs[0].status : null;

    res.status(200).json({
      success: true,
      data: { student, currentStatus, logs },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Verify Email ───────────────────────────────────────────────────────────

export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ success: false, error: 'email and code are required' });
      return;
    }

    const parent = await (Parent as any).unscoped().findOne({ where: { email } });
    if (!parent) {
      res.status(404).json({ success: false, error: 'Parent account not found' });
      return;
    }

    // Check if already verified
    if (parent.email_verified) {
      res.status(400).json({ success: false, error: 'Email already verified' });
      return;
    }

    // Check if code matches
    if (parent.verification_code !== code) {
      res.status(400).json({ success: false, error: 'Invalid verification code' });
      return;
    }

    // Check if code expired
    if (!parent.verification_code_expires || new Date() > parent.verification_code_expires) {
      res.status(400).json({ 
        success: false, 
        error: 'Verification code has expired. Please request a new one.',
        code: 'CODE_EXPIRED'
      });
      return;
    }

    // Verify the email
    parent.email_verified = true;
    parent.verification_code = null;
    parent.verification_code_expires = null;
    await parent.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully! You can now log in.',
    });
  } catch (err) {
    next(err);
  }
}

// ─── Resend Verification Code ───────────────────────────────────────────────

export async function resendVerificationCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'email is required' });
      return;
    }

    const parent = await (Parent as any).unscoped().findOne({ where: { email } });
    if (!parent) {
      res.status(404).json({ success: false, error: 'Parent account not found' });
      return;
    }

    // Check if already verified
    if (parent.email_verified) {
      res.status(400).json({ success: false, error: 'Email already verified' });
      return;
    }

    // Generate new verification code
    const verificationCode = generateVerificationCode();
    const verificationExpires = new Date();
    verificationExpires.setMinutes(verificationExpires.getMinutes() + 15);

    parent.verification_code = verificationCode;
    parent.verification_code_expires = verificationExpires;
    await parent.save();

    // Send verification email
    const emailSent = await sendVerificationEmail(parent.email, parent.name, verificationCode);

    if (!emailSent) {
      res.status(500).json({ 
        success: false, 
        error: 'Failed to send verification email. Please try again later.' 
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Verification code sent! Please check your email.',
    });
  } catch (err) {
    next(err);
  }
}


// ─── Forgot Password: Request Reset Code ────────────────────────────────────

export async function requestPasswordReset(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, error: 'Email is required' });
      return;
    }

    const parent = await (Parent as any).unscoped().findOne({ where: { email } });
    if (!parent) {
      // Don't reveal whether email exists for security
      res.status(200).json({
        success: true,
        message: 'If an account exists with this email, a password reset code has been sent.',
      });
      return;
    }

    // Generate reset code
    const resetCode = generateVerificationCode();
    const resetExpires = new Date();
    resetExpires.setMinutes(resetExpires.getMinutes() + 15);

    parent.reset_password_code = resetCode;
    parent.reset_password_code_expires = resetExpires;
    await parent.save();

    // Send reset email
    const emailSent = await sendPasswordResetEmail(parent.email, parent.name, resetCode);

    if (!emailSent) {
      console.warn('[RequestPasswordReset] Failed to send email, but code was generated');
    }

    res.status(200).json({
      success: true,
      message: 'If an account exists with this email, a password reset code has been sent.',
    });
  } catch (err) {
    next(err);
  }
}

// ─── Verify Reset Code ──────────────────────────────────────────────────────

export async function verifyResetCode(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, code } = req.body;

    if (!email || !code) {
      res.status(400).json({ success: false, error: 'Email and code are required' });
      return;
    }

    const parent = await (Parent as any).unscoped().findOne({ where: { email } });
    if (!parent) {
      res.status(404).json({ success: false, error: 'Invalid email or code' });
      return;
    }

    // Check if code matches
    if (parent.reset_password_code !== code) {
      res.status(400).json({ success: false, error: 'Invalid reset code' });
      return;
    }

    // Check if code expired
    if (!parent.reset_password_code_expires || new Date() > parent.reset_password_code_expires) {
      res.status(400).json({
        success: false,
        error: 'Reset code has expired. Please request a new one.',
        code: 'CODE_EXPIRED',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Reset code verified. You can now reset your password.',
    });
  } catch (err) {
    next(err);
  }
}

// ─── Reset Password ─────────────────────────────────────────────────────────

export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, code, newPassword } = req.body;

    if (!email || !code || !newPassword) {
      res.status(400).json({ success: false, error: 'Email, code, and new password are required' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ success: false, error: 'Password must be at least 6 characters' });
      return;
    }

    const parent = await (Parent as any).unscoped().findOne({ where: { email } });
    if (!parent) {
      res.status(404).json({ success: false, error: 'Invalid email or code' });
      return;
    }

    // Check if code matches
    if (parent.reset_password_code !== code) {
      res.status(400).json({ success: false, error: 'Invalid reset code' });
      return;
    }

    // Check if code expired
    if (!parent.reset_password_code_expires || new Date() > parent.reset_password_code_expires) {
      res.status(400).json({
        success: false,
        error: 'Reset code has expired. Please request a new one.',
        code: 'CODE_EXPIRED',
      });
      return;
    }

    // Hash new password
    const password_hash = await bcrypt.hash(newPassword, 12);

    // Update password and clear reset code
    parent.password_hash = password_hash;
    parent.reset_password_code = null;
    parent.reset_password_code_expires = null;
    await parent.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully! You can now login with your new password.',
    });
  } catch (err) {
    next(err);
  }
}

// ─── Get All Children ───────────────────────────────────────────────────────

export async function getAllChildren(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parentId = (req as any).parent.id;

    // Get all children for this parent
    const parentStudents = await ParentStudent.findAll({
      where: { parent_id: parentId },
      order: [['is_primary', 'DESC'], ['createdAt', 'ASC']],
    });

    if (parentStudents.length === 0) {
      res.status(200).json({
        success: true,
        data: { children: [] },
      });
      return;
    }

    const rfidTags = parentStudents.map(ps => ps.rfid_tag_uid);

    // Fetch all student details
    const students = await Student.findAll({
      where: { rfid_tag_uid: { [Op.in]: rfidTags } },
    });

    // Map students with is_primary flag
    const children = students.map(student => {
      const ps = parentStudents.find(p => p.rfid_tag_uid === student.rfid_tag_uid);
      return {
        ...student.toJSON(),
        is_primary: ps?.is_primary || false,
      };
    });

    res.status(200).json({
      success: true,
      data: { children },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Add Child ──────────────────────────────────────────────────────────────

export async function addChild(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parentId = (req as any).parent.id;
    const { rfid_tag_uid } = req.body;

    if (!rfid_tag_uid) {
      res.status(400).json({ success: false, error: 'rfid_tag_uid is required' });
      return;
    }

    // Validate the RFID tag exists in students table
    const student = await Student.findOne({ where: { rfid_tag_uid } });
    if (!student) {
      res.status(404).json({ 
        success: false, 
        error: 'No student found with that RFID tag. Please check the tag ID and try again.' 
      });
      return;
    }

    // Check if already added
    const existing = await ParentStudent.findOne({
      where: { parent_id: parentId, rfid_tag_uid },
    });

    if (existing) {
      res.status(409).json({ success: false, error: 'This child is already added to your account' });
      return;
    }

    // Add the child
    await ParentStudent.create({
      parent_id: parentId,
      rfid_tag_uid,
      is_primary: false,
    });

    res.status(201).json({
      success: true,
      message: 'Child added successfully!',
      data: { student },
    });
  } catch (err) {
    next(err);
  }
}

// ─── Set Primary Child ──────────────────────────────────────────────────────

export async function setPrimaryChild(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const parentId = (req as any).parent.id;
    const { rfid_tag_uid } = req.body;

    if (!rfid_tag_uid) {
      res.status(400).json({ success: false, error: 'rfid_tag_uid is required' });
      return;
    }

    // Check if this child belongs to the parent
    const parentStudent = await ParentStudent.findOne({
      where: { parent_id: parentId, rfid_tag_uid },
    });

    if (!parentStudent) {
      res.status(404).json({ success: false, error: 'Child not found in your account' });
      return;
    }

    // Unset all primary flags for this parent
    await ParentStudent.update(
      { is_primary: false },
      { where: { parent_id: parentId } }
    );

    // Set the new primary child
    parentStudent.is_primary = true;
    await parentStudent.save();

    // Update parent's primary rfid_tag_uid for backward compatibility
    const parent = await Parent.findByPk(parentId);
    if (parent) {
      parent.rfid_tag_uid = rfid_tag_uid;
      await parent.save();
    }

    res.status(200).json({
      success: true,
      message: 'Primary child updated successfully!',
    });
  } catch (err) {
    next(err);
  }
}
