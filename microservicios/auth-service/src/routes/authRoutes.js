import { Router } from 'express';
import { register, login, verifyTotp, enableTotp, confirmTotp, resetTotp, googleLogin, updateProfile, updateComisionistaData} from '../controllers/authControllers.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; // <-- Importalo acá
const router = Router();

router.post('/register', register);
router.post('/login', login);
router.post('/verify-totp', verifyTotp);

// Nuevas rutas para gestión de 2FA
router.post('/enable-totp', enableTotp);
router.post('/confirm-totp', confirmTotp);
router.post('/reset-totp', resetTotp); // <--- Botón "Perdí mi TOTP"

router.post('/google', googleLogin);
router.put('/update-profile', authMiddleware, updateProfile); // Protegida con token

router.put('/complete-comisionista', authMiddleware, updateComisionistaData);

export default router;
