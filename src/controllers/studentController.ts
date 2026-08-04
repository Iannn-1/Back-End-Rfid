import { Request, Response, NextFunction } from 'express';
import Student, { GRADE_LEVELS, ALL_COURSES, COLLEGE_COURSES } from '../models/Student';
import { ApiResponse, ApiErrorResponse, StudentAttributes } from '../types/models';
import { uploadPhoto } from '../utils/uploadPhoto';

interface StudentBody {
  rfid_tag_uid: string;
  name: string;
  email?: string;
  student_level: 'Elementary' | 'Junior High School' | 'Senior High School' | 'College';
  grade_level: string;
  section: string;
  course?: string;
  status?: 'Active' | 'Inactive';
  profile_photo?: string;
  signature?: string;
  parent_name: string;
  parent_email: string;
  parent_phone: string;
}

const VALID_LEVELS = ['Elementary', 'Junior High School', 'Senior High School', 'College'];

/**
 * Validates student_level, grade_level, and course consistency.
 * Returns an error string or null if valid.
 */
function validateLevelAndGrade(body: Partial<StudentBody>): string | null {
  const { student_level, grade_level, course } = body;

  if (!student_level || !VALID_LEVELS.includes(student_level)) {
    return `student_level must be one of: ${VALID_LEVELS.join(', ')}`;
  }

  const validGrades = GRADE_LEVELS[student_level as keyof typeof GRADE_LEVELS];
  if (!grade_level || !validGrades.includes(grade_level as never)) {
    return `grade_level for ${student_level} must be one of: ${validGrades.join(', ')}`;
  }

  if (student_level === 'College') {
    if (!course || !course.trim()) {
      return 'course is required for College students';
    }
    if (!ALL_COURSES.includes(course)) {
      return `Invalid course. Valid courses are: ${ALL_COURSES.join(', ')}`;
    }
  }

  return null;
}

/**
 * POST /api/v1/students
 * Creates a new student record.
 */
export async function createStudent(
  req: Request<Record<string, never>, ApiResponse<StudentAttributes> | ApiErrorResponse, StudentBody>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const {
      rfid_tag_uid,
      name,
      email,
      student_level,
      grade_level,
      section,
      course,
      status = 'Active',
      profile_photo,
      signature,
      parent_name,
      parent_email,
      parent_phone,
    } = req.body;

    // Required field validation
    const requiredFields: (keyof StudentBody)[] = [
      'rfid_tag_uid', 'name', 'student_level', 'grade_level',
      'section', 'parent_name', 'parent_email', 'parent_phone',
    ];
    const missing = requiredFields.filter(
      (f) => !req.body[f]?.toString().trim()
    );
    if (missing.length > 0) {
      res.status(400).json({ success: false, error: `Missing required fields: ${missing.join(', ')}` });
      return;
    }

    // Level/grade/course validation
    const levelError = validateLevelAndGrade(req.body);
    if (levelError) {
      res.status(400).json({ success: false, error: levelError });
      return;
    }

    // Duplicate RFID check
    const existing = await Student.findOne({ where: { rfid_tag_uid } });
    if (existing) {
      res.status(409).json({ success: false, error: 'RFID tag UID already in use' });
      return;
    }

    // Upload profile photo to Cloudinary if it's a base64 string
    console.log('[createStudent] profile_photo received:', profile_photo ? `${profile_photo.substring(0, 50)}... (${profile_photo.length} chars)` : 'none');
    const photoUrl = profile_photo ? await uploadPhoto(profile_photo) : undefined;
    console.log('[createStudent] Cloudinary URL:', photoUrl ?? 'null — upload failed or no photo');

    const student = await Student.create({
      rfid_tag_uid,
      name,
      email,
      student_level,
      grade_level,
      section,
      course,
      status,
      profile_photo: photoUrl ?? undefined,
      signature,
      parent_name,
      parent_email,
      parent_phone,
    });

    res.status(201).json({ success: true, data: student.toJSON() as StudentAttributes });
  } catch (err: any) {
    if (err.name === 'SequelizeValidationError') {
      const message = err.errors?.[0]?.message ?? 'Validation error';
      res.status(400).json({
        success: false,
        error: message.toLowerCase().includes('email') ? 'Invalid email format' : message,
      });
      return;
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ success: false, error: 'RFID tag UID already in use' });
      return;
    }
    next(err);
  }
}

/**
 * GET /api/v1/students
 * Returns all students, optionally filtered by student_level or status.
 */
export async function listStudents(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const where: Record<string, string> = {};
    if (req.query.student_level) where.student_level = req.query.student_level as string;
    if (req.query.status) where.status = req.query.status as string;

    const students = await Student.findAll({ where, order: [['name', 'ASC']] });
    res.status(200).json({ success: true, data: students });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/students/:id
 * Returns a single student by id.
 */
export async function getStudent(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      res.status(404).json({ success: false, error: 'Student not found' });
      return;
    }
    res.status(200).json({ success: true, data: student });
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/v1/students/:id
 * Updates an existing student record.
 */
export async function updateStudent(
  req: Request<{ id: string }, any, Partial<StudentBody>>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      res.status(404).json({ success: false, error: 'Student not found' });
      return;
    }

    // If level or grade is being changed, validate consistency
    if (req.body.student_level || req.body.grade_level || req.body.course) {
      const merged = {
        student_level: req.body.student_level ?? student.student_level,
        grade_level: req.body.grade_level ?? student.grade_level,
        course: req.body.course ?? student.course,
      };
      const levelError = validateLevelAndGrade(merged);
      if (levelError) {
        res.status(400).json({ success: false, error: levelError });
        return;
      }
    }

    // If profile_photo is a new base64 upload, convert it to a Cloudinary URL
    if (req.body.profile_photo && req.body.profile_photo.startsWith('data:image/')) {
      const photoUrl = await uploadPhoto(req.body.profile_photo);
      req.body.profile_photo = photoUrl ?? undefined;
    }

    await student.update(req.body);
    res.status(200).json({ success: true, data: student.toJSON() as StudentAttributes });
  } catch (err: any) {
    if (err.name === 'SequelizeValidationError') {
      const message = err.errors?.[0]?.message ?? 'Validation error';
      res.status(400).json({
        success: false,
        error: message.toLowerCase().includes('email') ? 'Invalid email format' : message,
      });
      return;
    }
    if (err.name === 'SequelizeUniqueConstraintError') {
      res.status(409).json({ success: false, error: 'RFID tag UID already in use' });
      return;
    }
    next(err);
  }
}

/**
 * DELETE /api/v1/students/:id
 * Deletes a student (blocked if they have attendance logs — ON DELETE RESTRICT).
 */
export async function deleteStudent(
  req: Request<{ id: string }>,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const student = await Student.findByPk(req.params.id);
    if (!student) {
      res.status(404).json({ success: false, error: 'Student not found' });
      return;
    }

    await student.destroy();
    res.status(200).json({ success: true, data: { message: 'Student deleted successfully' } });
  } catch (err: any) {
    if (err.name === 'SequelizeForeignKeyConstraintError') {
      res.status(409).json({ success: false, error: 'Cannot delete student with existing attendance logs' });
      return;
    }
    next(err);
  }
}

/**
 * GET /api/v1/students/meta/options
 * Returns the valid grade levels and courses for each student level.
 * Useful for populating dropdowns in the frontend.
 */
export async function getStudentOptions(
  _req: Request,
  res: Response
): Promise<void> {
  res.status(200).json({
    success: true,
    data: {
      student_levels: VALID_LEVELS,
      grade_levels: GRADE_LEVELS,
      college_courses: COLLEGE_COURSES,
    },
  });
}
