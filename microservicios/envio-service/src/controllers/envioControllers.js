import Envio from '../models/envioModel.js';

export const createEnvio = async (req, res, next) => {
  try {
    // El userId lo sacaremos del token (igual que en Auth)
    const nuevoEnvio = new Envio({
      ...req.body,
      usuarioId: req.userId 
    });

    const envioGuardado = await nuevoEnvio.save();
    
    res.status(201).json({
      message: "Envío solicitado con éxito. Buscando comisionistas...",
      envio: envioGuardado
    });
  } catch (error) {
    next(error);
  }
};