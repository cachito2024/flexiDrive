const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // <-- agregado
require('dotenv').config();

const userRoutes = require('./src/routes/userRoutes');

const app = express();

// Middleware
app.use(cors()); // <-- permite recibir peticiones del frontend
app.use(express.json());

// Conexión a MongoDB
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Error conectando a MongoDB:', err));

// Rutas
app.use('/api/usuarios', userRoutes);

// Iniciar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
});
