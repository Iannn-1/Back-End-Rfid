import { sequelize } from '../config/database';
import AttendanceLog from './AttendanceLog';
import Student from './Student';
import User from './User';
import Parent from './Parent';
import ParentStudent from './ParentStudent';
export { GRADE_LEVELS, COLLEGE_COURSES, ALL_COURSES } from './Student';

// Define associations
Student.hasMany(AttendanceLog, { foreignKey: 'student_id', onDelete: 'RESTRICT' });
AttendanceLog.belongsTo(Student, { foreignKey: 'student_id', as: 'Student' });

// Parent-Student many-to-many relationship through ParentStudent junction table
Parent.belongsToMany(Student, { 
  through: ParentStudent, 
  foreignKey: 'parent_id',
  otherKey: 'rfid_tag_uid',
  as: 'Children'
});

Student.belongsToMany(Parent, { 
  through: ParentStudent, 
  foreignKey: 'rfid_tag_uid',
  otherKey: 'parent_id',
  sourceKey: 'rfid_tag_uid',
  as: 'Parents'
});

export { sequelize, AttendanceLog, Student, User, Parent, ParentStudent };
