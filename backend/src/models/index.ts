import { Usuario } from './Usuario';
import { Admin } from './Admin';
import { Reporte } from './Reporte';
import { AuditLog } from './AuditLog';
import { sequelize } from '../config/database';

// Relaciones
Usuario.hasMany(Reporte, { foreignKey: 'usuarioId', as: 'reportes' });
Reporte.belongsTo(Usuario, { foreignKey: 'usuarioId', as: 'usuario' });

Admin.hasMany(AuditLog, { foreignKey: 'adminId', as: 'auditLogs' });
AuditLog.belongsTo(Admin, { foreignKey: 'adminId', as: 'admin' });

export {
  Usuario,
  Admin,
  Reporte,
  AuditLog,
  sequelize
};
