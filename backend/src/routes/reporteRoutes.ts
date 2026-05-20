import { Router } from 'express';
import { crearReporte, obtenerMisReportes } from '../controllers/reporteController';
import { authenticateToken } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken);
router.post('/', crearReporte);
router.get('/mis-reportes', obtenerMisReportes);

export default router;
