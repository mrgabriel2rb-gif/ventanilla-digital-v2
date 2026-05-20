import { Router } from 'express';
import { 
  obtenerTodosLosReportes, 
  actualizarReporte, 
  registrarAdmin, 
  obtenerAuditLogs 
} from '../controllers/adminController';
import { authenticateToken, requireSuperAdmin } from '../middlewares/auth';

const router = Router();

router.use(authenticateToken); // Protect all routes for Admins

router.get('/reportes', obtenerTodosLosReportes);
router.put('/reportes/:id', actualizarReporte);

// SuperAdmin only routes
router.post('/register', requireSuperAdmin, registrarAdmin);
router.get('/audit', requireSuperAdmin, obtenerAuditLogs);

export default router;
