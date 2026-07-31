import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';
import { StudentAttributes } from '../types/models';

// id, createdAt, updatedAt and optional fields are auto-generated or optional on creation
type StudentCreationAttributes = Optional<
  StudentAttributes,
  'id' | 'email' | 'course' | 'profile_photo' | 'signature' | 'createdAt' | 'updatedAt'
>;

// ---------------------------------------------------------------------------
// Valid grade levels per student level
// ---------------------------------------------------------------------------
export const GRADE_LEVELS = {
  Elementary: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6'],
  'Junior High School': ['Grade 7', 'Grade 8', 'Grade 9', 'Grade 10'],
  'Senior High School': ['Grade 11', 'Grade 12'],
  College: ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year'],
} as const;

// ---------------------------------------------------------------------------
// College courses (excludes Medicine, Agriculture, Law, Architecture, Arts & Sciences)
// ---------------------------------------------------------------------------
export const COLLEGE_COURSES: Record<string, string[]> = {
  'Computer Studies': [
    'BS Information Technology (BSIT)',
    'BS Computer Science (BSCS)',
    'BS Information Systems (BSIS)',
    'BS Computer Engineering (BSCpE)',
  ],
  Engineering: [
    'BS Civil Engineering (BSCE)',
    'BS Electrical Engineering (BSEE)',
    'BS Mechanical Engineering (BSME)',
    'BS Electronics Engineering (BSECE)',
    'BS Industrial Engineering (BSIE)',
  ],
  Business: [
    'BS Business Administration (BSBA)',
    'BS Accountancy (BSA)',
    'BS Management Accounting (BSMA)',
    'BS Entrepreneurship',
    'BS Marketing Management',
  ],
  Education: [
    'Bachelor of Elementary Education (BEEd)',
    'Bachelor of Secondary Education (BSEd)',
    'Bachelor of Physical Education (BPEd)',
    'Bachelor of Special Needs Education (BSNEd)',
  ],
  Nursing: ['BS Nursing (BSN)'],
  'Hospitality & Tourism': [
    'BS Hospitality Management (BSHM)',
    'BS Tourism Management (BSTM)',
    'BS Hotel and Restaurant Management',
  ],
};

// Flat list of all valid courses for validation
export const ALL_COURSES = Object.values(COLLEGE_COURSES).flat();

class Student
  extends Model<StudentAttributes, StudentCreationAttributes>
  implements StudentAttributes
{
  public id!: number;
  public rfid_tag_uid!: string;
  public name!: string;
  public email!: string | undefined;
  public student_level!: 'Elementary' | 'Junior High School' | 'Senior High School' | 'College';
  public grade_level!: string;
  public section!: string;
  public course!: string | undefined;
  public status!: 'Active' | 'Inactive';
  public profile_photo!: string | undefined;
  public signature!: string | undefined;
  public parent_name!: string;
  public parent_email!: string;
  public parent_phone!: string;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Student.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true,
    },
    rfid_tag_uid: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: true,
      validate: {
        isEmail: true,
      },
    },
    student_level: {
      type: DataTypes.ENUM(
        'Elementary',
        'Junior High School',
        'Senior High School',
        'College'
      ),
      allowNull: false,
    },
    grade_level: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    section: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    course: {
      type: DataTypes.STRING(255),
      allowNull: true, // only required for College
    },
    status: {
      type: DataTypes.ENUM('Active', 'Inactive'),
      allowNull: false,
      defaultValue: 'Active',
    },
    profile_photo: {
      type: DataTypes.STRING(512), // Cloudinary URL
      allowNull: true,
    },
    signature: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    parent_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    parent_email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      validate: {
        isEmail: true,
      },
    },
    parent_phone: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'students',
    modelName: 'Student',
    indexes: [
      {
        unique: true,
        fields: ['rfid_tag_uid'],
      },
    ],
  }
);

export default Student;
