import { Response } from 'express';
import bcrypt from 'bcrypt';
import { Reporte } from '../models/Reporte';
import { AuditLog } from '../models/AuditLog';
import { Admin } from '../models/Admin';
import { AuthRequest } from '../middlewares/auth';
import { Usuario } from '../models/Usuario';

export const obtenerTodosLosReportes = async (req: AuthRequest, res: Response) => {
  try {
    const reportes = await Reporte.findAll({
      include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'email', 'telefono'] }],
      order: [['createdAt', 'DESC']]
    });
    return res.json(reportes);
  } catch (error) {
    console.error('Error obteniendo reportes:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const actualizarReporte = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { estado, prioridad, dependencia } = req.body;
    const adminId = req.user?.id;

    const reporte = await Reporte.findByPk(Number(id), {
      include: [{ model: Usuario, as: 'usuario', attributes: ['nombre', 'email', 'telefono'] }]
    });
    
    if (!reporte) return res.status(404).json({ error: 'Reporte no encontrado' });

    let detalles = `Reporte #${id} actualizado.`;
    if (estado && estado !== reporte.estado) detalles += ` Estado: ${reporte.estado} -> ${estado}.`;
    if (prioridad && prioridad !== reporte.prioridad) detalles += ` Prioridad: ${reporte.prioridad} -> ${prioridad}.`;
    if (dependencia !== undefined && dependencia !== reporte.dependencia) detalles += ` Dependencia: ${reporte.dependencia || 'N/A'} -> ${dependencia}.`;

    if (estado) reporte.estado = estado;
    if (prioridad) reporte.prioridad = prioridad;
    if (dependencia !== undefined) reporte.dependencia = dependencia;
    
    await reporte.save();

    await AuditLog.create({
      accion: 'UPDATE',
      entidad: 'Reporte',
      entidadId: reporte.id,
      detalles,
      adminId: adminId!
    });

    // Emitir el evento de Socket.io
    const io = req.app.get('io');
    if (io) {
      io.emit('reporteActualizado', reporte);
    }

    return res.json(reporte);
  } catch (error) {
    console.error('Error actualizando reporte:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const registrarAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const { nombre, email, password } = req.body;

    const existingAdmin = await Admin.findOne({ where: { email } });
    if (existingAdmin) return res.status(400).json({ error: 'El email ya está registrado como Admin.' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await Admin.create({
      nombre,
      email,
      password: hashedPassword,
      role: 'Admin',
    });

    return res.status(201).json({ message: 'Administrador registrado exitosamente', id: newAdmin.id });
  } catch (error) {
    return res.status(500).json({ error: 'Error en el servidor' });
  }
};

export const obtenerAuditLogs = async (req: AuthRequest, res: Response) => {
  try {
    const logs = await AuditLog.findAll({
      include: [{ model: Admin, as: 'admin', attributes: ['nombre', 'email', 'role'] }],
      order: [['createdAt', 'DESC']]
    });
    return res.json(logs);
  } catch (error) {
    console.error('Error obteniendo auditoría:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
