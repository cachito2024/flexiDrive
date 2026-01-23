import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
// 1. IMPORTA EL MIDDLEWARE (asegúrate de que la ruta sea correcta)
import { errorHandler } from './middlewares/errorMiddlewares.js';

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// MongoDB
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error MongoDB:', err));

// Routes
app.use('/api/auth', authRoutes);
// 2. CONECTA EL MANEJADOR DE ERRORES (Debe ir DESPUÉS de las rutas)
app.use(errorHandler);

// Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Auth service corriendo en puerto ${PORT}`);
});
