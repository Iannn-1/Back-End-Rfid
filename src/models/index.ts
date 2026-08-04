import { sequelize } from '../config/database';
import AttendanceLog from './AttendanceLog';
import Student from './Student';
import User from './User';
import Parent from './Parent';
export { GRADE_LEVELS, COLLEGE_COURSES, ALL_COURSES } from './Student';

// Define associations
Student.hasMany(AttendanceLog, { foreignKey: 'student_id', onDelete: 'RESTRICT' });
AttendanceLog.belongsTo(Student, { foreignKey: 'student_id', as: 'Student' });

export { sequelize, AttendanceLog, Student, User, Parent };
