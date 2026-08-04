import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../config/database';

export interface ParentAttributes {
  id: number;
  name: string;
  email: string;
  password_hash: string;
  phone?: string;
  rfid_tag_uid: string; // links to students.rfid_tag_uid
  createdAt?: Date;
  updatedAt?: Date;
}

type ParentCreationAttributes = Optional<ParentAttributes, 'id' | 'phone' | 'createdAt' | 'updatedAt'>;

class Parent extends Model<ParentAttributes, ParentCreationAttributes> implements ParentAttributes {
  public id!: number;
  public name!: string;
  public email!: string;
  public password_hash!: string;
  public phone!: string | undefined;
  public rfid_tag_uid!: string;
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
  },
  { sequelize, tableName: 'parents', modelName: 'Parent' }
);

export default Parent;
