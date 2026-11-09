import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ParentStudentAttributes {
  id: number;
  parent_id: number;
  rfid_tag_uid: string; // links to students.rfid_tag_uid
  is_primary: boolean; // which child to show by default
  createdAt?: Date;
  updatedAt?: Date;
}

type ParentStudentCreationAttributes = Optional<ParentStudentAttributes, 'id' | 'is_primary' | 'createdAt' | 'updatedAt'>;

class ParentStudent extends Model<ParentStudentAttributes, ParentStudentCreationAttributes> implements ParentStudentAttributes {
  public id!: number;
  public parent_id!: number;
  public rfid_tag_uid!: string;
  public is_primary!: boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

ParentStudent.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    parent_id: { 
      type: DataTypes.INTEGER.UNSIGNED, 
      allowNull: false,
      references: { model: 'parents', key: 'id' },
      onDelete: 'CASCADE',
    },
    rfid_tag_uid: { 
      type: DataTypes.STRING(255), 
      allowNull: false,
    },
    is_primary: { 
      type: DataTypes.BOOLEAN, 
      allowNull: false, 
      defaultValue: false,
      comment: 'Primary child to display by default',
    },
  },
  { 
    sequelize, 
    tableName: 'parent_students', 
    modelName: 'ParentStudent',
    indexes: [
      {
        unique: true,
        fields: ['parent_id', 'rfid_tag_uid'],
        name: 'parent_student_unique',
      },
    ],
  }
);

export default ParentStudent;
