const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  contraseña_hash: { type: String, required: true },
  rol: { type: String, enum: ['cliente', 'comisionista', 'pasajero', 'conductor', 'admin'], required: true },
  fecha_registro: { type: Date, default: Date.now },
  estado: { type: String, enum: ['activo', 'inactivo'], default: 'activo' }
});

module.exports = mongoose.model('Usuario', userSchema);

