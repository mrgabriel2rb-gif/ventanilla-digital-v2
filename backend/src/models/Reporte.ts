import { Model, DataTypes } from 'sequelize';
import { sequelize } from '../config/database';

export class Reporte extends Model {
  public declare id: number;
  public declare asunto: string;
  public declare descripcion: string;
  public declare estado: 'Pendiente' | 'En Proceso' | 'Resuelto' | 'Cancelado';
  public declare prioridad: 'Baja' | 'Media' | 'Alta';
  public declare dependencia: string;
  public declare usuarioId: number;
}

Reporte.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    asunto: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    descripcion: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    estado: {
      type: DataTypes.ENUM('Pendiente', 'En Proceso', 'Resuelto', 'Cancelado'),
      defaultValue: 'Pendiente',
    },
    prioridad: {
      type: DataTypes.ENUM('Baja', 'Media', 'Alta'),
      defaultValue: 'Media',
    },
    dependencia: {
      type: DataTypes.STRING,
      allowNull: true,
    },
    usuarioId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    sequelize,
    tableName: 'reportes',
  }
);
