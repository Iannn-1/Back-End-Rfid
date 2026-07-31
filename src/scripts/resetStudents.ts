import { sequelize, Student, AttendanceLog } from '../models';

async function resetStudentsData() {
  try {
    console.log('Connecting to database...');
    await sequelize.authenticate();
    console.log('Database connected successfully.');

    console.log('Clearing students and attendance logs...');
    // Disable foreign key checks to allow truncating tables with foreign keys
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    await AttendanceLog.destroy({ truncate: true });
    await Student.destroy({ truncate: true });
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');

    console.log('✅ Successfully cleared all data from "students" and "attendance_logs" tables!');
    console.log('Your database tables are now completely clean and ready for fresh deployment.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting students table:', error);
    process.exit(1);
  }
}

resetStudentsData();
