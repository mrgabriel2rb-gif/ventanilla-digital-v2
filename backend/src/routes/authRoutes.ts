import { Router } from 'express';
import { login, registerUsuario } from '../controllers/authController';

const router = Router();

router.post('/login', login);
router.post('/register', registerUsuario);

export default router;
