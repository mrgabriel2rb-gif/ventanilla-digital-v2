import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Usuario extends Model {
  public declare id: number;
  public declare nombre: string;
  public declare email: string;
  public declare password: string;
  public declare telefono: string;
}

Usuario.init(
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
    telefono: {
      type: DataTypes.STRING(10),
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'usuarios',
  }
);
