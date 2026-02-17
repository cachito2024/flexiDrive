import mongoose from 'mongoose';

const envioSchema = new mongoose.Schema({
  usuarioId: { type: mongoose.Schema.Types.ObjectId, required: true }, // El Cliente (Ana)
  comisionistaId: { type: mongoose.Schema.Types.ObjectId, default: null }, // Quién lo lleva
  
  // Ubicación para Google Maps e IA
  direccion_origen: {
    texto: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  direccion_destino: {
    texto: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
nro_envio: { type: String, unique: true }, // El código humano
  // Un envío puede tener muchos bultos
  paquetes: [{
    alto: Number,
    ancho: Number,
    profundidad: Number,
    peso: Number,
    contenido: String,
    fragil: { type: Boolean, default: false },
    codigo_paquete: String, // Identificador del bulto
    clienteId: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' } // Dueño del bulto
  }],

  costo_estimado: { type: Number, required: true },
  fecha_hora_retiro: { type: Date, required: true },
  estadoId: { 
    type: String, 
    enum: ['PENDIENTE', 
      'ASIGNADO', 
      'EN_RETIRO', 
      'EN_CAMINO', 
      'ENTREGADO', 
      'DEMORADO', 
      'CANCELADO', 
      'CANCELADO_RETORNO', 
      'DEVUELTO'],
    default: 'PENDIENTE' 
  },
  
  notas_adicionales: String
}, { timestamps: true });

export default mongoose.model('Envio', envioSchema, 'envios');