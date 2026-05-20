import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Admin extends Model {
  public declare id: number;
  public declare nombre: string;
  public declare email: string;
  public declare password: string;
  public declare role: 'SuperAdmin' | 'Admin';
}

Admin.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    nombre: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('SuperAdmin', 'Admin'),
      defaultValue: 'Admin',
    },
  },
  {
    sequelize,
    tableName: 'admins',
  }
);
