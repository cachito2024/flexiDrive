import Envio from '../models/envioModels.js';
import EnvioXComisionista from '../models/envioXcomisionistaModel.js';

export const createEnvio = async (req, res, next) => {
  try {
   const { direccion_origen, direccion_destino, paquetes, fecha_hora_retiro, notas_adicionales } = req.body;

    // Validación simple: al menos debe haber un paquete
    if (!paquetes || paquetes.length === 0) {
      return res.status(400).json({ message: "Debes incluir al menos un paquete en el envío." });
    }
// 1. CÁLCULO AUTOMÁTICO DEL COSTO
    // Podés cambiar el 500 por el valor que quieras o una lógica por peso
    const TARIFA_POR_BULTO = 1200;
    const costoCalculado = paquetes.length * TARIFA_POR_BULTO;

    // 2. GENERACIÓN DE CÓDIGO ÚNICO (FD-AñoMes-Aleatorio)
    const fecha = new Date();
    const prefijo = `FD-${fecha.getFullYear().toString().slice(-2)}${(fecha.getMonth() + 1).toString().padStart(2, '0')}`;
    const aleatorio = Math.floor(1000 + Math.random() * 9000);
    const nroEnvioUnico = `${prefijo}-${aleatorio}`;

    // 3. PROCESAR PAQUETES (Inyectar ID de cliente y código de bulto)
    const paquetesProcesados = paquetes.map((p, index) => ({
      ...p,
      clienteId: req.userId, // Le asignamos el dueño a cada bulto
      codigo_paquete: `B-${nroEnvioUnico}-${index + 1}` // Ej: B-FD-2602-1234-1
    }));


    const nuevoEnvio = new Envio({
      usuarioId: req.userId,
      nro_envio: nroEnvioUnico, // Viene del authMiddleware
      direccion_origen,
      direccion_destino,
     paquetes: paquetesProcesados,
      costo_estimado: costoCalculado,
      fecha_hora_retiro,
      notas_adicionales
    });

    const envioGuardado = await nuevoEnvio.save();
    
    res.status(201).json({
      message: "Envío solicitado con éxito.",
      envio: envioGuardado
    });
  } catch (error) {
    next(error);
  }
};

export const getEnviosDisponibles = async (req, res, next) => {
  try {
    // Buscamos envíos que no tengan comisionista asignado y estén PENDIENTES
    const envios = await Envio.find({ 
      estadoId: 'PENDIENTE', 
      comisionistaId: null 
    });

    res.status(200).json(envios);
  } catch (error) {
    next(error);
  }
};

export const aceptarEnvio = async (req, res, next) => {
  try {
    const { envioId, vehiculoId } = req.body;
    const comisionistaId = req.userId; // Viene del token

    // 1. Buscamos el envío para ver si sigue disponible
    const envio = await Envio.findById(envioId);
    if (!envio || envio.estadoId !== 'PENDIENTE') {
      return res.status(400).json({ message: "El envío ya no está disponible o no existe." });
    }

    // 2. CREAMOS LA ASIGNACIÓN (Tabla envio_x_comisionista)
    const nuevaAsignacion = new EnvioXComisionista({
      comisionistaId,
      envioId,
      vehiculoId,
      estado_id: 'ASIGNADO'
    });
    await nuevaAsignacion.save();

    // 3. ACTUALIZAMOS EL ENVÍO ORIGINAL
    envio.comisionistaId = comisionistaId;
    envio.estadoId = 'ASIGNADO';
    await envio.save();

    res.status(200).json({
      message: "Envío aceptado correctamente. ¡Buen viaje!",
      asignacion: nuevaAsignacion
    });
  } catch (error) {
    next(error);
  }
};

export const actualizarEstadoEnvio = async (req, res, next) => {
  try {
    const { envioId, nuevoEstado } = req.body; 
    const comisionistaId = req.userId; // Viene del token de Marta

    // 1. Buscamos el envío
    const envio = await Envio.findById(envioId);
    if (!envio) return res.status(404).json({ message: "Envío no encontrado." });

    // 2. Seguridad: Solo Marta puede actualizar SU viaje
    if (envio.comisionistaId.toString() !== comisionistaId) {
      return res.status(403).json({ message: "No tienes permiso para actualizar este envío." });
    }

    // 3. Actualizamos el estado en el envío principal
    envio.estadoId = nuevoEstado;
    await envio.save();

    // 4. Actualizamos la tabla intermedia y guardamos fechas si corresponde
    const datosUpdate = { estado_id: nuevoEstado };
    
    if (nuevoEstado === 'EN_CAMINO') datosUpdate.fecha_inicio = Date.now();
    if (nuevoEstado === 'ENTREGADO') datosUpdate.fecha_fin = Date.now();

    await EnvioXComisionista.findOneAndUpdate(
      { envioId: envioId, comisionistaId: comisionistaId },
      { $set: datosUpdate }
    );

    res.status(200).json({ 
      message: `Envío actualizado a: ${nuevoEstado}`,
      estado: nuevoEstado 
    });
  } catch (error) {
    next(error);
  }
};

export const getHistorial = async (req, res, next) => {
  try {
    const userId = req.userId;
    const userRol = req.userRol;
    let query = {};

    // Si es cliente, buscamos por usuarioId
    if (userRol === 'cliente') {
      query = { usuarioId: userId };
    } 
    // Si es comisionista, buscamos por comisionistaId
    else if (userRol === 'comisionista') {
      query = { comisionistaId: userId };
    }

    // Traemos los envíos ordenados por fecha (del más nuevo al más viejo)
    const historial = await Envio.find(query).sort({ createdAt: -1 });

    // Calculamos un resumen rápido (opcional, pero queda re pro)
    const totalEnvios = historial.length;
    const totalCosto = historial.reduce((acc, envio) => acc + envio.costo_estimado, 0);

    res.status(200).json({
      totalEnvios,
      totalFacturado: userRol === 'comisionista' ? totalCosto : undefined, // Solo el comisionista ve el total ganado
      historial
    });
  } catch (error) {
    next(error);
  }
};

// EDITAR ENVÍO (Solo si está PENDIENTE)
export const updateEnvio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { direccion_origen, direccion_destino, notas_adicionales } = req.body;

    const envio = await Envio.findById(id);
    if (!envio) return res.status(404).json({ message: "Envío no encontrado." });

    // Seguridad: Solo el dueño puede editarlo
    if (envio.usuarioId.toString() !== req.userId) {
      return res.status(403).json({ message: "No tienes permiso para editar este envío." });
    }

    // Regla de Negocio: No se edita si ya tiene chofer
    if (envio.estadoId !== 'PENDIENTE') {
      return res.status(400).json({ message: "No puedes editar un envío que ya fue aceptado o está en curso." });
    }

    const envioActualizado = await Envio.findByIdAndUpdate(
      id,
      { direccion_origen, direccion_destino, notas_adicionales },
      { new: true }
    );

    res.status(200).json({ message: "Envío actualizado con éxito.", envio: envioActualizado });
  } catch (error) {
    next(error);
  }
};

//cancelar envio logico (estado cancelado o cancelado_retorno dependiendo si ya fue aceptado o no)

export const cancelarEnvio = async (req, res, next) => {
  try {
    const { id } = req.params;
    const envio = await Envio.findById(id);

    if (!envio) return res.status(404).json({ message: "Envío no encontrado." });
    if (envio.usuarioId.toString() !== req.userId) {
      return res.status(403).json({ message: "No tienes permiso." });
    }

    // CASO 1: Envío todavía no aceptado (Cancelación normal)
    if (envio.estadoId === 'PENDIENTE') {
      envio.estadoId = 'CANCELADO';
      await envio.save();
      return res.status(200).json({ message: "Envío cancelado correctamente." });
    }

    // CASO 2: Envío en tránsito (Logística Inversa)
    if (envio.estadoId === 'EN_CAMINO' || envio.estadoId === 'ASIGNADO' || envio.estadoId === 'EN_RETIRO') {
      
      // Buscamos los datos del comisionista para el WhatsApp
      const comisionista = await Usuario.findById(envio.comisionistaId).select('telefono nombre');

      envio.estadoId = 'CANCELADO_RETORNO';
      envio.notas_adicionales += ` [CANCELADO EN TRÁNSITO - COORDINAR DEVOLUCIÓN AL: ${comisionista.telefono}]`;
      await envio.save();

      // Actualizamos también la tabla intermedia
      await EnvioXComisionista.findOneAndUpdate(
        { envioId: id },
        { estado_id: 'CANCELADO_RETORNO' }
      );

      // Le mandamos al Front el link listo para usar
      const msj = `Hola ${comisionista.nombre}, necesito cancelar el envío ${envio.nro_envio}. ¿Cómo coordinamos la devolución?`;
      const waLink = `https://wa.me/${comisionista.telefono}?text=${encodeURIComponent(msj)}`;

      return res.status(200).json({ 
        message: "El envío está en curso. Se ha marcado como CANCELADO_RETORNO. No se reintegra el pago por gastos logísticos.",
        waLink: waLink 
      });
    }

    res.status(400).json({ message: "Este envío no se puede cancelar en su estado actual." });
  } catch (error) {
    next(error);
  }
};