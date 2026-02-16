import express from 'express';
import { createEnvio, getEnviosDisponibles, aceptarEnvio, actualizarEstadoEnvio, getHistorial} from '../controllers/envioControllers.js';
import { authMiddleware, isCliente, isComisionista} from '../middlewares/authMiddlewares.js'; // El que vas a copiar

const router = express.Router();

// Solo usuarios logueados pueden crear envíos
router.post('/', authMiddleware, isCliente, createEnvio);

// Marta (comisionista) consulta qué hay para llevar
router.get('/disponibles', authMiddleware, isComisionista, getEnviosDisponibles);

router.patch('/aceptar', authMiddleware, isComisionista, aceptarEnvio);

router.patch('/actualizar-estado', authMiddleware, isComisionista, actualizarEstadoEnvio);

// Historial de viajes para Clientes y Comisionistas
router.get('/historial', authMiddleware, getHistorial);

// MODIFICAR ENVÍO (Ana quiere cambiar la dirección o nota antes de que Marta lo acepte)
router.put('/:id', authMiddleware, isCliente, updateEnvio);

// CANCELAR ENVÍO (Ana se arrepiente)
router.delete('/:id', authMiddleware, isCliente, cancelarEnvio);

export default router;