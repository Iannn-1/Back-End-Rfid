import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ParentAttributes {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  phone?: string;
  rfid_tag_uid: string; // links to students.rfid_tag_uid
  email_verified: boolean;
  verification_code?: string;
  verification_code_expires?: Date;
  reset_password_code?: string;
  reset_password_code_expires?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

type ParentCreationAttributes = Optional<ParentAttributes, 'id' | 'phone' | 'email_verified' | 'verification_code' | 'verification_code_expires' | 'reset_password_code' | 'reset_password_code_expires' | 'createdAt' | 'updatedAt'>;

class Parent extends Model<ParentAttributes, ParentCreationAttributes> implements ParentAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password_hash!: string;
  public phone!: string | undefined;
  public rfid_tag_uid!: string;
  public email_verified!: boolean;
  public verification_code!: string | undefined;
  public verification_code_expires!: Date | undefined;
  public reset_password_code!: string | undefined;
  public reset_password_code_expires!: Date | undefined;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Parent.init(
  {
    id: { type: DataTypes.INTEGER.UNSIGNED, autoIncrement: true, primaryKey: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    email: { type: DataTypes.STRING(255), allowNull: false, unique: true, validate: { isEmail: true } },
    password_hash: { type: DataTypes.STRING(255), allowNull: false },
    phone: { type: DataTypes.STRING(50), allowNull: true },
    rfid_tag_uid: { type: DataTypes.STRING(255), allowNull: false },
    email_verified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    verification_code: { type: DataTypes.STRING(10), allowNull: true },
    verification_code_expires: { type: DataTypes.DATE, allowNull: true },
    reset_password_code: { type: DataTypes.STRING(10), allowNull: true },
    reset_password_code_expires: { type: DataTypes.DATE, allowNull: true },
  },
  { sequelize, tableName: 'parents', modelName: 'Parent' }
);

export default Parent;
