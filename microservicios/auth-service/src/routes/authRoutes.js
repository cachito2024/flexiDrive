import { Router } from 'express';
import { register, login, verifyTotp, enableTotp, confirmTotp, resetTotp, googleLogin, updateProfile, updateComisionistaData, approveComisionista, getMyFullProfile, updateFullProfile, disableAccount} from '../controllers/authControllers.js';
import { authMiddleware, isAdmin } from '../middlewares/authMiddleware.js'; // <-- Importalo acá
import { upload } from '../middlewares/uploadMiddleware.js'; // <-- 1. Importá el middleware de subida
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

router.put('/complete-comisionista', authMiddleware, 
    upload.fields([
    { name: 'dniFrente', maxCount: 1 },
    { name: 'dniDorso', maxCount: 1 }
  ]), updateComisionistaData);


  // Ruta para que el admin apruebe (después de mirar las fotos)
router.patch('/approve-comisionista', authMiddleware, isAdmin, approveComisionista);

//rutas crud usuarios 
// Rutas de Perfil
router.get('/me', authMiddleware, getMyFullProfile);
router.put('/update', authMiddleware, updateFullProfile);
router.patch('/disable', authMiddleware, disableAccount);

export default router;
