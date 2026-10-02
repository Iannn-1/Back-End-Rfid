/**
 * TEMPORARY Migration Routes
 * These routes should be REMOVED after successful migration for security.
 */

import { Router, Request, Response } from 'express';
import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

const router = Router();

/**
 * POST /api/v1/migrate/student-names
 * Migrates the student name field to first_name, last_name, middle_name
 * 
 * ⚠️ IMPORTANT: Remove this route after migration is complete!
 */
router.post('/student-names', async (req: Request, res: Response) => {
  try {
    console.log('🚀 Starting student name migration...');

    // Step 1: Check if 'name' column still exists
    const results = await sequelize.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'students' 
       AND TABLE_SCHEMA = DATABASE()
       AND COLUMN_NAME = 'name'`,
      { type: QueryTypes.SELECT }
    );

    if (results.length === 0) {
      console.log('✅ Migration already completed. The "name" column does not exist.');
      return res.status(200).json({ 
        success: true, 
        message: 'Migration already completed',
        alreadyMigrated: true 
      });
    }

    console.log('📋 Found "name" column. Proceeding with migration...');

    // Step 2: Add new columns if they don't exist
    console.log('➕ Adding new columns: first_name, last_name, middle_name...');
    
    await sequelize.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(255) NULL AFTER rfid_tag_uid,
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(255) NULL AFTER first_name,
      ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255) NULL AFTER last_name
    `);

    // Step 3: Migrate existing data
    console.log('🔄 Migrating existing student names...');
    
    const students = await sequelize.query<{ id: number; name: string }>(
      `SELECT id, name FROM students WHERE name IS NOT NULL`,
      { type: QueryTypes.SELECT }
    );

    console.log(`📊 Found ${students.length} students to migrate`);

    let migratedCount = 0;
    const migrationLog: string[] = [];

    for (const student of students) {
      // Split the name into parts
      const nameParts = student.name.trim().split(/\s+/);
      
      let firstName = '';
      let lastName = '';
      let middleName: string | null = null;

      if (nameParts.length === 1) {
        // Only one name provided - treat as last name
        lastName = nameParts[0];
        firstName = nameParts[0]; // duplicate for required field
      } else if (nameParts.length === 2) {
        // Two names: First Last
        firstName = nameParts[0];
        lastName = nameParts[1];
      } else {
        // Three or more names: First Middle(s) Last
        firstName = nameParts[0];
        lastName = nameParts[nameParts.length - 1];
        middleName = nameParts.slice(1, -1).join(' ');
      }

      await sequelize.query(
        `UPDATE students 
         SET first_name = :firstName, 
             last_name = :lastName, 
             middle_name = :middleName
         WHERE id = :id`,
        {
          replacements: { 
            firstName, 
            lastName, 
            middleName,
            id: student.id 
          }
        }
      );

      const logEntry = `"${student.name}" → First: "${firstName}", Last: "${lastName}", Middle: "${middleName || 'N/A'}"`;
      migrationLog.push(logEntry);
      console.log(`✓ ${logEntry}`);
      migratedCount++;
    }

    // Step 4: Make new columns NOT NULL (except middle_name)
    console.log('🔒 Setting first_name and last_name as required fields...');
    
    await sequelize.query(`
      ALTER TABLE students 
      MODIFY COLUMN first_name VARCHAR(255) NOT NULL,
      MODIFY COLUMN last_name VARCHAR(255) NOT NULL
    `);

    // Step 5: Drop the old 'name' column
    console.log('🗑️ Dropping old "name" column...');
    
    await sequelize.query(`
      ALTER TABLE students DROP COLUMN name
    `);

    console.log('✅ Migration completed successfully!');

    return res.status(200).json({
      success: true,
      message: 'Student name migration completed successfully',
      stats: {
        totalMigrated: migratedCount,
        studentsProcessed: students.length
      },
      migrationLog: migrationLog,
      changes: [
        'Added columns: first_name (required), last_name (required), middle_name (optional)',
        'Removed column: name'
      ]
    });

  } catch (error: any) {
    console.error('❌ Migration failed:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Migration failed',
      message: error.message || 'Unknown error occurred',
      details: error.toString()
    });
  }
});

/**
 * GET /api/v1/migrate/status
 * Check migration status without running it
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    // Check if old 'name' column exists
    const nameColumn = await sequelize.query(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'students' 
       AND TABLE_SCHEMA = DATABASE()
       AND COLUMN_NAME = 'name'`,
      { type: QueryTypes.SELECT }
    );

    // Check if new columns exist
    const newColumns = await sequelize.query<{ COLUMN_NAME: string }>(
      `SELECT COLUMN_NAME 
       FROM INFORMATION_SCHEMA.COLUMNS 
       WHERE TABLE_NAME = 'students' 
       AND TABLE_SCHEMA = DATABASE()
       AND COLUMN_NAME IN ('first_name', 'last_name', 'middle_name')`,
      { type: QueryTypes.SELECT }
    );

    const hasOldColumn = nameColumn.length > 0;
    const hasNewColumns = newColumns.length === 3;

    let status = 'unknown';
    let message = '';

    if (!hasOldColumn && hasNewColumns) {
      status = 'completed';
      message = 'Migration has been completed. Using new name structure.';
    } else if (hasOldColumn && !hasNewColumns) {
      status = 'pending';
      message = 'Migration needed. Old name structure detected.';
    } else if (hasOldColumn && hasNewColumns) {
      status = 'in-progress';
      message = 'Migration partially completed. Both old and new columns exist.';
    } else {
      status = 'error';
      message = 'Unexpected database state. Please check manually.';
    }

    return res.status(200).json({
      success: true,
      status,
      message,
      columns: {
        hasOldNameColumn: hasOldColumn,
        hasFirstNameColumn: newColumns.some((c) => c.COLUMN_NAME === 'first_name'),
        hasLastNameColumn: newColumns.some((c) => c.COLUMN_NAME === 'last_name'),
        hasMiddleNameColumn: newColumns.some((c) => c.COLUMN_NAME === 'middle_name'),
      }
    });

  } catch (error: any) {
    console.error('Error checking migration status:', error);
    
    return res.status(500).json({
      success: false,
      error: 'Failed to check migration status',
      message: error.message || 'Unknown error occurred'
    });
  }
});

export default router;
