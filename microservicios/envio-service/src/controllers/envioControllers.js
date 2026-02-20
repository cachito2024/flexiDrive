import Envio from '../models/envioModels.js';
import EnvioXComisionista from '../models/envioXcomisionistaModel.js';
import axios from 'axios';

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

    // 1. Validaciones de lógica de estados
    if (nuevoEstado === 'DEVUELTO' && envio.estadoId !== 'CANCELADO_RETORNO') {
      return res.status(400).json({ message: "Solo se puede marcar como DEVUELTO si fue cancelado en tránsito." });
    }


    // 3. Actualizamos el estado en el envío principal
    envio.estadoId = nuevoEstado;
    await envio.save();

    // 4. Actualizamos la tabla intermedia y guardamos fechas si corresponde
    const datosUpdate = { estado_id: nuevoEstado };

    if (nuevoEstado === 'EN_RETIRO') {
      datosUpdate.fecha_retiro = Date.now();
    }

    // CASO B: Marta ya tiene el paquete y sale hacia el destino
    if (nuevoEstado === 'EN_CAMINO') {
      datosUpdate.fecha_inicio = Date.now();
    }

    // C. ¡NUEVO! Registra cuándo ocurrió un inconveniente
    if (nuevoEstado === 'DEMORADO') {
      datosUpdate.fecha_demora = Date.now();
    }
    // CASO C: El ciclo termina (Ya sea por entrega exitosa o devolución)
    if (nuevoEstado === 'ENTREGADO' || nuevoEstado === 'DEVUELTO') {
      datosUpdate.fecha_fin = Date.now();
    }

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

//editar envio solo si esta penmdiente 
export const updateEnvio = async (req, res, next) => {
  try {
    const { id } = req.params;
    // Extraemos paquetes también del body
    const { direccion_origen, direccion_destino, notas_adicionales, paquetes } = req.body;

    const envio = await Envio.findById(id);
    if (!envio) return res.status(404).json({ message: "Envío no encontrado." });

    if (envio.usuarioId.toString() !== req.userId) {
      return res.status(403).json({ message: "No tienes permiso." });
    }

    if (envio.estadoId !== 'PENDIENTE') {
      return res.status(400).json({ message: "No puedes editar un envío ya aceptado." });
    }

    // --- LÓGICA DE ACTUALIZACIÓN ---
    let datosActualizados = { direccion_origen, direccion_destino, notas_adicionales };

    // Si el cliente mandó una nueva lista de paquetes, recalculamos todo
    if (paquetes && paquetes.length > 0) {
      const TARIFA_POR_BULTO = 1200;
      datosActualizados.costo_estimado = paquetes.length * TARIFA_POR_BULTO;

      // Volvemos a generar los códigos de bulto para que coincidan con la nueva lista
      datosActualizados.paquetes = paquetes.map((p, index) => ({
        ...p,
        clienteId: req.userId,
        codigo_paquete: `B-${envio.nro_envio}-${index + 1}`
      }));
    }

    const envioActualizado = await Envio.findByIdAndUpdate(
      id,
      { $set: datosActualizados },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Envío actualizado y costo recalculado.",
      envio: envioActualizado
    });
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
    if (envio.estadoId === 'EN_CAMINO' || envio.estadoId === 'ASIGNADO' || envio.estadoId === 'EN_RETIRO' || envio.estadoId === 'DEMORADO') {

      // --- INTEGRACIÓN ENTRE MICROS ---
      // 2. Le pedimos los datos al Micro de Usuarios (asumiendo que corre en el puerto 3000)
     const urlUsuarios = `http://localhost:3000/api/auth/usuarios/${envio.comisionistaId}`;

      const respuesta = await axios.get(urlUsuarios, {
        headers: { Authorization: req.headers.authorization } // Le pasamos el token de Ana para que el otro micro la deje pasar
      });

      // Buscamos los datos del comisionista para el WhatsApp
      const comisionista = respuesta.data;

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
    // Si el micro de usuarios falla, capturamos el error
    if (error.response) {
       return res.status(error.response.status).json({ message: "Error al obtener datos del comisionista" });
    }
    next(error);
  }
};


export const getEnviosPorFecha = async (req, res, next) => {
  try {
    const { comisionistaId } = req.params;
    const { fecha } = req.query; // Ejemplo: "2026-02-19"

    if (!fecha) {
      return res.status(400).json({ message: "La fecha es obligatoria" });
    }

    // Forzamos el inicio y fin del día en UTC exacto
    // Esto evita que el desfasaje de Argentina (UTC-3) te traiga envíos del día anterior
    const inicioDia = new Date(`${fecha}T00:00:00.000Z`);
    const finDia = new Date(`${fecha}T23:59:59.999Z`);

    const envios = await Envio.find({
      comisionistaId: comisionistaId,
      fecha_hora_retiro: { $gte: inicioDia, $lte: finDia },
      estadoId: { $in: ['ASIGNADO', 'EN_RETIRO', 'EN_CAMINO'] }
    });

    res.status(200).json(envios);
  } catch (error) {
    console.error("Error en getEnviosPorFecha:", error);
    next(error);
  }
};

export const getEnvioById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const envio = await Envio.findById(id);
    if (!envio) {
      return res.status(404).json({ message: "Envío no encontrado" });
    }
    res.status(200).json(envio);
  } catch (error) {
    next(error);
  }
};



// Agregá esta función para actualizaciones técnicas desde otros micros
export const patchEnvioTecnico = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    // Buscamos y actualizamos solo los campos que vengan en el body
    // Esto permite que la IA guarde la polyline sin tocar lo demás
    const envioActualizado = await Envio.findByIdAndUpdate(
      id,
      { $set: req.body }, 
      { new: true }
    );

    if (!envioActualizado) return res.status(404).json({ message: "Envío no encontrado." });

    res.status(200).json(envioActualizado);
  } catch (error) {
    next(error);
  }
};