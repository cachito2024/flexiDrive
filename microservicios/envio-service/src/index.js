import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import conectarDB from './config/db.js'; // Importamos la conexión
import envioRoutes from './routes/envioRoutes.js';

dotenv.config();

// Conectamos a la base de datos
conectarDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/envios', envioRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Micro Envíos en puerto ${PORT}`);
});