import mongoose from 'mongoose';

const envioSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Cliente que envía
  comisionistaId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Se asigna al aceptar
  
  // Trayecto
  direccion_origen: { type: String, required: true },
  direccion_destino: { type: String, required: true },
  fecha_hora_retiro: { type: Date, required: true },
  costo_estimado: { type: Number, required: true },
  estadoId: { 
    type: String, 
    enum: ['PENDIENTE', 'ASIGNADO', 'EN_RETIRO', 'EN_CAMINO', 'ENTREGADO', 'CANCELADO'],
    default: 'PENDIENTE' 
  },

  // Datos del Paquete (Basado en tu tabla Paquete)
  paquete: {
    alto: Number,
    ancho: Number,
    profundidad: Number,
    peso: Number,
    contenido: String,
    fragil: { type: Boolean, default: false }
  },

  notas_adicionales: String
}, { timestamps: true });

export default mongoose.model('Envio', envioSchema);