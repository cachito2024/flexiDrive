import express from 'express';
import { createEnvio } from '../controllers/envioController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js'; // El que vas a copiar

const router = express.Router();

// Solo usuarios logueados pueden crear envíos
router.post('/', authMiddleware, createEnvio);

export default router;