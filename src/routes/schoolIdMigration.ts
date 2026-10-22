import { Router, Request, Response } from 'express';
import { sequelize } from '../config/database';
import Student from '../models/Student';
import { Op } from 'sequelize';

const router = Router();

/**
 * POST /api/v1/migrate/school-id
 * Migrates the database to add school_id column and generates IDs for existing students
 */
router.post('/school-id', async (req: Request, res: Response) => {
  try {
    console.log('[SchoolID Migration] Starting migration...');

    // Check if column already exists
    const [results]: any = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'students' 
      AND COLUMN_NAME = 'school_id'
    `);

    if (results && results.length > 0) {
      console.log('[SchoolID Migration] Column already exists');
      return res.json({ 
        success: true, 
        message: 'school_id column already exists. Migration not needed.',
        alreadyMigrated: true 
      });
    }

    // Add the column
    console.log('[SchoolID Migration] Adding school_id column...');
    await sequelize.query(`
      ALTER TABLE students 
      ADD COLUMN school_id VARCHAR(20) NULL UNIQUE
    `);
    console.log('[SchoolID Migration] Column added successfully');

    // Generate school_ids for existing students
    console.log('[SchoolID Migration] Generating school IDs...');
    const students = await Student.findAll({
      order: [['id', 'ASC']]
    });

    // Filter students without school_id
    const studentsToMigrate = students.filter(s => !s.school_id || s.school_id === '');
    
    const currentYear = new Date().getFullYear();
    const migratedStudents = [];
    
    for (let i = 0; i < studentsToMigrate.length; i++) {
      const student = studentsToMigrate[i];
      const schoolId = `${currentYear}-${String(i + 1).padStart(4, '0')}`;
      await student.update({ school_id: schoolId });
      
      migratedStudents.push({
        id: student.id,
        name: `${student.last_name}, ${student.first_name}`,
        old_rfid: student.rfid_tag_uid,
        new_school_id: schoolId
      });
      
      console.log(`[SchoolID Migration] Student #${student.id}: ${schoolId}`);
    }

    console.log(`[SchoolID Migration] Migration completed. Generated ${studentsToMigrate.length} school IDs`);

    res.json({
      success: true,
      message: 'School ID migration completed successfully',
      studentsCount: studentsToMigrate.length,
      students: migratedStudents,
      year: currentYear
    });
  } catch (error: any) {
    console.error('[SchoolID Migration] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Migration failed',
      details: error.stack
    });
  }
});

/**
 * GET /api/v1/migrate/school-id/status
 * Checks the migration status
 */
router.get('/school-id/status', async (req: Request, res: Response) => {
  try {
    // Check if column exists
    const [columnCheck]: any = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'students' 
      AND COLUMN_NAME = 'school_id'
    `);

    const columnExists = columnCheck && columnCheck.length > 0;

    if (!columnExists) {
      return res.json({
        success: true,
        migrated: false,
        message: 'school_id column does not exist. Migration needed.'
      });
    }

    // Check how many students have school_id
    const totalStudents = await Student.count();
    const allStudents = await Student.findAll();
    const studentsWithSchoolId = allStudents.filter(s => s.school_id && s.school_id !== '').length;

    res.json({
      success: true,
      migrated: columnExists,
      columnExists,
      totalStudents,
      studentsWithSchoolId,
      needsMigration: studentsWithSchoolId < totalStudents,
      message: studentsWithSchoolId === totalStudents 
        ? 'All students have school IDs. Migration complete.'
        : `${studentsWithSchoolId}/${totalStudents} students have school IDs. ${totalStudents - studentsWithSchoolId} need IDs.`
    });
  } catch (error: any) {
    console.error('[SchoolID Migration] Status check error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to check migration status'
    });
  }
});

export default router;
