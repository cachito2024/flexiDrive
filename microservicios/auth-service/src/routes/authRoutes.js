import { Router } from 'express';
import { register, login, verifyTotp, enableTotp, confirmTotp, resetTotp } from '../controllers/authControllers.js';

const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-totp', verifyTotp);

// Nuevas rutas para gestión de 2FA
router.post('/enable-totp', enableTotp);
router.post('/confirm-totp', confirmTotp);
router.post('/reset-totp', resetTotp); // <--- Botón "Perdí mi TOTP"

export default router;
