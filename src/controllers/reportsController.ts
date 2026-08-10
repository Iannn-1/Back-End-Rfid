import { Request, Response, NextFunction } from 'express';
import { Op } from 'sequelize';
import { AttendanceLog, Student } from '../models/index';
import { AttendanceLogAttributes, StudentAttributes } from '../types/models';
import { getTodayStats } from '../services/attendanceService';

// ---------------------------------------------------------------------------
// In-memory history store (persists per process restart)
// ---------------------------------------------------------------------------
interface HistoryRecord {
  id: string;
  type: string;
  generatedAt: string;
  rows: number;
  generatedBy: string;
}
const reportHistory: HistoryRecord[] = [];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Maps frontend level filter values → DB student_level enum values */
const LEVEL_MAP: Record<string, string> = {
  elementary: 'Elementary',
  highschool: 'Junior High School',
  seniorhigh: 'Senior High School',
  college: 'College',
};

function toDateRange(dateFrom: string, dateTo: string): { start: Date; end: Date } {
  const start = new Date(dateFrom);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dateTo);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

// ---------------------------------------------------------------------------
// GET /api/v1/reports/stats
// ---------------------------------------------------------------------------
export async function getReportStats(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const todayStats = await getTodayStats();

    const totalStudents = await Student.count();
    const activeStudents = await Student.count({ where: { status: 'Active' } });

    // Total scans today
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const todayEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    const totalScans = await AttendanceLog.count({
      where: { scan_time: { [Op.between]: [todayStart, todayEnd] } },
    });

    // Tags — unique assigned rfid_tag_uids (all students that have a tag)
    const totalTags    = await Student.count();   // every student has a tag
    const assignedTags = await Student.count({ where: { status: 'Active' } });

    const attendanceRate =
      totalStudents > 0
        ? Math.round((todayStats.presentCount / totalStudents) * 1000) / 10
        : 0;

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalStudents,
          activeStudents,
          presentToday:   todayStats.presentCount,
          lateToday:      todayStats.lateCount,
          absentToday:    todayStats.absentCount,
          attendanceRate,
          totalScans,
          totalTags,
          assignedTags,
          totalHolidays: 0,
          adminUsers:    0,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/reports/generate
// ---------------------------------------------------------------------------
export async function generateReport(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const {
      type = 'attendance',
      dateFrom,
      dateTo,
      filterLevel  = '',
      filterStatus = '',
    } = req.body as {
      type?: string;
      dateFrom?: string;
      dateTo?: string;
      filterLevel?: string;
      filterStatus?: string;
    };

    const today = new Date().toISOString().split('T')[0];
    const from  = dateFrom || today;
    const to    = dateTo   || today;
    const { start, end } = toDateRange(from, to);

    // Build student-level where clause
    const studentWhere: Record<string, unknown> = {};
    if (filterLevel && LEVEL_MAP[filterLevel]) {
      studentWhere.student_level = LEVEL_MAP[filterLevel];
    }

    let rows: Record<string, unknown>[] = [];

    // -----------------------------------------------------------------------
    // Attendance report
    // -----------------------------------------------------------------------
    if (type === 'attendance') {
      const lateThreshold = new Date(start);
      lateThreshold.setHours(8, 0, 0, 0);

      // All students (with optional level filter)
      const allStudents = await Student.findAll({ where: studentWhere });

      // All IN logs in range for those students
      const studentIds = allStudents.map((s) => (s.get() as StudentAttributes).id);

      const inLogs = await AttendanceLog.findAll({
        where: {
          status: 'IN',
          scan_time: { [Op.between]: [start, end] },
          ...(studentIds.length ? { student_id: { [Op.in]: studentIds } } : {}),
        },
        include: [{ model: Student, as: 'Student' }],
        order: [['scan_time', 'ASC']],
      });

      // Map: student_id → earliest IN log
      const earliestIn = new Map<number, { scanTime: Date; logId: number }>();
      for (const log of inLogs) {
        const attrs = log.get({ plain: true }) as AttendanceLogAttributes;
        const existing = earliestIn.get(attrs.student_id);
        if (!existing || attrs.scan_time < existing.scanTime) {
          earliestIn.set(attrs.student_id, { scanTime: attrs.scan_time, logId: attrs.id });
        }
      }

      // Build row per student
      for (const student of allStudents) {
        const s = student.get({ plain: true }) as StudentAttributes;
        const entry = earliestIn.get(s.id);

        let status: string;
        if (!entry) {
          status = 'Absent';
        } else if (entry.scanTime > lateThreshold) {
          status = 'Late';
        } else {
          status = 'Present';
        }

        // Apply status filter
        if (filterStatus) {
          const fs = filterStatus.toLowerCase();
          if (fs === 'present' && status !== 'Present') continue;
          if (fs === 'late'    && status !== 'Late')    continue;
          if (fs === 'absent'  && status !== 'Absent')  continue;
        }

        rows.push({
          'Student ID':  s.id,
          'Name':        s.name,
          'Level':       s.student_level,
          'Grade':       s.grade_level,
          'Section':     s.section,
          'Status':      status,
          'Check-In':    entry ? entry.scanTime.toLocaleTimeString() : '—',
          'Date':        from,
        });
      }
    }

    // -----------------------------------------------------------------------
    // Student directory
    // -----------------------------------------------------------------------
    else if (type === 'students') {
      if (filterStatus) {
        studentWhere.status = filterStatus === 'active' ? 'Active' : 'Inactive';
      }

      const students = await Student.findAll({ where: studentWhere, order: [['name', 'ASC']] });

      rows = students.map((s) => {
        const attrs = s.get({ plain: true }) as StudentAttributes;
        return {
          'ID':      attrs.id,
          'Name':    attrs.name,
          'Email':   attrs.email ?? '—',
          'Level':   attrs.student_level,
          'Grade':   attrs.grade_level,
          'Section': attrs.section,
          'Course':  attrs.course ?? '—',
          'Status':  attrs.status,
          'Tag UID': attrs.rfid_tag_uid,
        };
      });
    }

    // -----------------------------------------------------------------------
    // RFID tag inventory  (tags = one-per-student in this system)
    // -----------------------------------------------------------------------
    else if (type === 'tags') {
      const students = await Student.findAll({ where: studentWhere, order: [['name', 'ASC']] });

      // Last seen: latest scan per student
      const studentIds = students.map((s) => (s.get() as StudentAttributes).id);
      const lastScans = await AttendanceLog.findAll({
        attributes: ['student_id', [require('sequelize').fn('MAX', require('sequelize').col('scan_time')), 'lastScan']],
        where: studentIds.length ? { student_id: { [Op.in]: studentIds } } : {},
        group: ['student_id'],
        raw: true,
      }) as unknown as Array<{ student_id: number; lastScan: string }>;

      const lastScanMap = new Map<number, string>();
      for (const row of lastScans) {
        lastScanMap.set(row.student_id, row.lastScan);
      }

      rows = students.map((s) => {
        const attrs = s.get({ plain: true }) as StudentAttributes;
        return {
          'Tag UID':   attrs.rfid_tag_uid,
          'Owner':     attrs.name,
          'Level':     attrs.student_level,
          'Status':    attrs.status === 'Active' ? 'Assigned' : 'Disabled',
          'Issued At': attrs.createdAt ? new Date(attrs.createdAt).toLocaleDateString() : '—',
          'Last Seen': lastScanMap.get(attrs.id)
            ? new Date(lastScanMap.get(attrs.id)!).toLocaleString()
            : 'Never',
        };
      });
    }

    // Save to in-memory history
    const generatedBy = (req.user?.email) ?? 'Admin';
    reportHistory.unshift({
      id:          `${Date.now()}`,
      type,
      generatedAt: new Date().toISOString(),
      rows:        rows.length,
      generatedBy,
    });
    // Keep only last 50
    if (reportHistory.length > 50) reportHistory.splice(50);

    res.status(200).json({ success: true, data: { rows, total: rows.length } });
  } catch (err) {
    next(err);
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/reports/history
// ---------------------------------------------------------------------------
export async function getReportHistory(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.status(200).json({ success: true, data: { history: reportHistory } });
  } catch (err) {
    next(err);
  }
}
