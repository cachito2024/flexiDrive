import mongoose from 'mongoose';

const UsuarioRolSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  rolId: { type: String, ref: 'Rol' },
  creado_en: { type: Date, default: Date.now }
});

export default mongoose.model('UsuarioRol', UsuarioRolSchema, 'usuarioxrol');
