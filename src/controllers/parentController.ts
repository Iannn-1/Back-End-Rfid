import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { Parent, Student, AttendanceLog } from '../models/index';
import { ApiResponse, ApiErrorResponse } from '../types/models';
import { generateVerificationCode, sendVerificationEmail, sendPasswordResetEmail } from '../services/emailVerificationService';

// ─── Register ───────────────────────────────────────────────────────────────

export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { name, email, password, phone, rfid_tag_uid } = req.body;

    if (!name || !email || !password || !rfid_tag_uid) {
      res.status(400).json({ success: false, error: 'name, email, password, and rfid_tag_uid are required' });
      return;
    }

    // Validate the RFID tag exists in students table
    const student = await Student.findOne({ where: { rfid_tag_uid } });
    if (!student) {
      res.status(404).json({ success: false, error: 'No student found with that RFID tag. Please check the tag ID and try again.' });
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
    
    const parent = await Parent.create({ 
      name, 
      email, 
      password_hash, 
      phone, 
      rfid_tag_uid,
      email_verified: false,
      verification_code: verificationCode,
      verification_code_expires: verificationExpires
    });

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
        rfid_tag_uid: parent.rfid_tag_uid,
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
    const { rfid_tag_uid } = (req as any).parent;

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
