/**
 * Migration script to add school_id column to students table
 * Run with: npm run ts-node src/scripts/addSchoolIdColumn.ts
 */

import { sequelize } from '../config/database';
import Student from '../models/Student';

async function addSchoolIdColumn() {
  try {
    console.log('🔧 Starting school_id column migration...');

    // Connect to database
    await sequelize.authenticate();
    console.log('✅ Database connection established');

    // Check if column already exists
    const [results]: any = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'students' 
      AND COLUMN_NAME = 'school_id'
    `);

    if (results && results.length > 0) {
      console.log('⚠️  school_id column already exists. Skipping...');
      await sequelize.close();
      return;
    }

    // Add the column
    console.log('📝 Adding school_id column...');
    await sequelize.query(`
      ALTER TABLE students 
      ADD COLUMN school_id VARCHAR(20) NULL UNIQUE
    `);

    console.log('✅ school_id column added successfully');

    // Generate school_id for existing students
    console.log('🔄 Generating school_id for existing students...');
    const { Op } = require('sequelize');
    const students = await Student.findAll({
      where: { 
        [Op.or]: [
          { school_id: null },
          { school_id: '' }
        ]
      },
      order: [['id', 'ASC']]
    });

    const currentYear = new Date().getFullYear();
    let counter = 1;

    for (const student of students) {
      const schoolId = `${currentYear}-${String(counter).padStart(4, '0')}`;
      await student.update({ school_id: schoolId });
      console.log(`  ✓ Student #${student.id}: ${schoolId}`);
      counter++;
    }

    console.log(`✅ Generated ${students.length} school IDs`);
    console.log('🎉 Migration completed successfully!');

    await sequelize.close();
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Run the migration
addSchoolIdColumn();
