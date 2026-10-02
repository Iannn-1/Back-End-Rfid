/**
 * Migration script to split the 'name' field into 'first_name', 'last_name', and 'middle_name'
 * Run this script once to update the database schema and migrate existing data.
 * 
 * Usage: npx ts-node src/scripts/migrateStudentNames.ts
 */

import { sequelize } from '../config/database';
import { QueryTypes } from 'sequelize';

async function migrateStudentNames() {
  console.log('Starting student name migration...');

  try {
    // Step 1: Check if 'name' column still exists
    const [results] = await sequelize.query(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'students' 
      AND TABLE_SCHEMA = DATABASE()
      AND COLUMN_NAME = 'name'
    `);

    if (results.length === 0) {
      console.log('Migration already completed. The "name" column does not exist.');
      return;
    }

    console.log('Found "name" column. Proceeding with migration...');

    // Step 2: Add new columns if they don't exist
    console.log('Adding new columns: first_name, last_name, middle_name...');
    
    await sequelize.query(`
      ALTER TABLE students 
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(255) NULL AFTER rfid_tag_uid,
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(255) NULL AFTER first_name,
      ADD COLUMN IF NOT EXISTS middle_name VARCHAR(255) NULL AFTER last_name
    `);

    // Step 3: Migrate existing data
    console.log('Migrating existing student names...');
    
    const students = await sequelize.query<{ id: number; name: string }>(
      `SELECT id, name FROM students WHERE name IS NOT NULL`,
      { type: QueryTypes.SELECT }
    );

    console.log(`Found ${students.length} students to migrate`);

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

      await sequelize.query(`
        UPDATE students 
        SET first_name = :firstName, 
            last_name = :lastName, 
            middle_name = :middleName
        WHERE id = :id
      `, {
        replacements: { 
          firstName, 
          lastName, 
          middleName,
          id: student.id 
        }
      });

      console.log(`Migrated: "${student.name}" → First: "${firstName}", Last: "${lastName}", Middle: "${middleName || 'N/A'}"`);
    }

    // Step 4: Make new columns NOT NULL (except middle_name)
    console.log('Setting first_name and last_name as required fields...');
    
    await sequelize.query(`
      ALTER TABLE students 
      MODIFY COLUMN first_name VARCHAR(255) NOT NULL,
      MODIFY COLUMN last_name VARCHAR(255) NOT NULL
    `);

    // Step 5: Drop the old 'name' column
    console.log('Dropping old "name" column...');
    
    await sequelize.query(`
      ALTER TABLE students DROP COLUMN name
    `);

    console.log('✅ Migration completed successfully!');
    console.log('Summary:');
    console.log(`- Migrated ${students.length} student records`);
    console.log('- Added columns: first_name (required), last_name (required), middle_name (optional)');
    console.log('- Removed column: name');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

// Run the migration
migrateStudentNames()
  .then(() => {
    console.log('\nMigration script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nMigration script failed:', error);
    process.exit(1);
  });
