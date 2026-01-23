import mongoose from 'mongoose';

const ComisionistaSchema = new mongoose.Schema({
  usuarioId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  alias: {
    type: String,
    required: true
  },
  cuil: {
    type: String,
    required: true
  },
  cbu: {
    type: String,
    required: true
  },
  fecha_Alta: {
    type: Date,
    default: Date.now
  },
  verificado: {
    type: Boolean,
    default: false
  }
});

export default mongoose.model(
  'Comisionista',
  ComisionistaSchema,
  'comisionista'
);
