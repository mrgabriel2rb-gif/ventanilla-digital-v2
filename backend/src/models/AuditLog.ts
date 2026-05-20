import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class AuditLog extends Model {
  public declare id: number;
  public declare accion: string;
  public declare entidad: string;
  public declare entidadId: number;
  public declare detalles: string;
  public declare adminId: number;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    accion: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entidad: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    entidadId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    detalles: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    adminId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
  }
);
