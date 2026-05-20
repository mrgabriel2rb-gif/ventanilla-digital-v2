import { Response } from 'express';
import { Reporte } from '../models/Reporte';
import { AuthRequest } from '../middlewares/auth';

export const crearReporte = async (req: AuthRequest, res: Response) => {
  try {
    const { asunto, descripcion } = req.body;
    const usuarioId = req.user?.id;

    if (!asunto || !descripcion) {
      return res.status(400).json({ error: 'Asunto y descripción son obligatorios' });
    }

    const reporte = await Reporte.create({
      asunto,
      descripcion,
      usuarioId,
      estado: 'Pendiente',
      prioridad: 'Media'
    });

    return res.status(201).json(reporte);
  } catch (error) {
    console.error('Error creando reporte:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const obtenerMisReportes = async (req: AuthRequest, res: Response) => {
  try {
    const usuarioId = req.user?.id;
    const reportes = await Reporte.findAll({ 
      where: { usuarioId },
      order: [['createdAt', 'DESC']]
    });
    return res.json(reportes);
  } catch (error) {
    console.error('Error obteniendo reportes:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
};
