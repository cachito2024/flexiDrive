import mongoose from 'mongoose';
const UsuarioSchema = new mongoose.Schema({
  nombre: String,
  apellido: String,
  email: { type: String,required: true, unique: true },
  contraseña_hash: String,
  estado: { type: String, default: 'activo' },
  dni: Number,
  fecha_nacimiento: Date,
  fecha_registro: { type: Date, default: Date.now },
  telefono: { type: String, required: true }, // Lo agregamos como requerido
 totpSecret: String,
 tempTotpSecret: String // Agrega esto para el flujo de activación/confirmación
});

export default mongoose.model('Usuario', UsuarioSchema, 'usuarios');
