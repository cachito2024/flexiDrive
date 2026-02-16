import mongoose from 'mongoose';

const ComisionistaSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  // Datos Bancarios del formulario
  entidadBancaria: {
    type: String,
    required: true
  },
  nroCuenta: {
    type: String,
    required: true
  },
  tipoCuenta: {
    type: String, // Ej: Caja de Ahorro, Cuenta Corriente
    required: true
  },
  alias: {
    type: String,
    required: true
  },
  cbu: {
    type: String,
    required: true
  },
  cuit: { // Cambiado de cuil a cuit según diseño
    type: String,
    required: true
  },
  // Verificación de Usuario (Subida de archivos)
  dniFrenteUrl: {
    type: String,
    required: false // Se marca como false inicialmente hasta que se procese el archivo
  },
  dniDorsoUrl: {
    type: String,
    required: false
  },
  fecha_Alta: {
    type: Date,
    default: Date.now
  },
  verificado: {
    type: Boolean,
    default: false
  },
  calificacionPromedio: { type: Number, default: 5.0 }, // Inicia con el máximo
  totalCalificaciones: { type: Number, default: 0 }    // Para ayudar al cálculo
});

export default mongoose.model(
  'Comisionista',
  ComisionistaSchema,
  'comisionista'
);