import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Op } from 'sequelize';
import { Parent, Student, AttendanceLog } from '../models/index';
import { ApiResponse, ApiErrorResponse } from '../types/models';

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
    const parent = await Parent.create({ name, email, password_hash, phone, rfid_tag_uid });

    res.status(201).json({
      success: true,
      data: { id: parent.id, name: parent.name, email: parent.email, rfid_tag_uid: parent.rfid_tag_uid },
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
