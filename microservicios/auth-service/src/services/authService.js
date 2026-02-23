import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Usuario from '../models/userModel.js';
import UsuarioRol from '../models/userRoleModel.js';
import Rol from '../models/roleModel.js';
import Comisionista from '../models/comisionistaModel.js';
import Vehiculo from '../models/vehiculoModel.js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode-terminal';
import { OAuth2Client } from 'google-auth-library';
import { generarTokenTemporal, generarTokenSesion, verificarToken } from '../utils/jwt.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_temporal';

// Registro de usuario
export const registerUser = async (data) => {
  const {
    nombre, apellido, email, password, rol,
    dni, fecha_nacimiento,telefono
  } = data;

  // 1. Validaciones de existencia (Email único y Rol)
  // Nota: Ya no validamos "if (!email)..." porque Zod lo hizo en el controller
  const existe = await Usuario.findOne({ email });
  if (existe) throw new Error('Email ya registrado');

  const rolDB = await Rol.findById(rol);
  if (!rolDB) throw new Error('Rol inválido');

  // 2. Hash contraseña y Crear usuario
  const contraseña_hash = await bcrypt.hash(password, 10);
  const usuario = await Usuario.create({
    nombre, apellido, email, contraseña_hash,
    dni, fecha_nacimiento, telefono, estado: 'activo'
  });

  // 3. Generar secreto TOTP
  const totpSecret = speakeasy.generateSecret({ length: 20 }).base32;
  usuario.totpSecret = totpSecret;
  await usuario.save();

  // 4. Relación usuario - rol
  await UsuarioRol.create({ usuarioId: usuario._id, rolId: rolDB._id });

  // 5. Datos extra para comisionista
  if (rolDB.nombre === 'comisionista') {
    // Aquí podrías agregar validación de Zod específica para comisionista luego
    await Comisionista.create({
      usuarioId: usuario._id,
      verificado: false
    });
  }

  // 6. Generar QR para consola
  const otpauthUrl = speakeasy.otpauthURL({
    secret: totpSecret,
    label: `${usuario.email}`,
    issuer: 'FlexiDrive'
  });

  console.log("\n------------------------------------------------");
  console.log(`📱 NUEVO USUARIO: ${usuario.email}`);
  qrcode.generate(otpauthUrl, { small: true });
  console.log("------------------------------------------------\n");

  return { message: 'Usuario creado correctamente', usuarioId: usuario._id, otpauthUrl };
};

/* 
export const checkUserProfile = async (userId) => {
  const usuario = await Usuario.findById(userId);
  const relacionRol = await UsuarioRol.findOne({ usuarioId: userId });
  
  // 1. Datos básicos del usuario (DNI y Fecha Nac son obligatorios para todos)
  const tieneDatosBasicos = !!(usuario?.dni && usuario?.fecha_nacimiento);

  let datosComisionistaCompletos = false;
  let tieneVehiculo = false;
  const rol = relacionRol ? relacionRol.rolId : 'pendiente';

  // 2. Lógica específica si es Comisionista
  if (rol === 'comisionista') {
    const comi = await Comisionista.findOne({ usuarioId: userId });
    const vehiculo = await Vehiculo.findOne({ comisionistaId: userId });

    // Verificamos datos bancarios y fotos
    datosComisionistaCompletos = !!(
      comi?.alias && 
      comi?.cbu && 
      comi?.cuit && 
      comi?.dniFrenteUrl && 
      comi?.dniDorsoUrl
    );

    // Verificamos si registró al menos un vehículo
    tieneVehiculo = !!vehiculo;
  }

  return {
    perfilCompleto: tieneDatosBasicos && rol !== 'pendiente',
    datosComisionistaCompletos, // Datos bancarios/DNI
    tieneVehiculo,             // ¿Cargó la Kangoo?
    rol
  };
};
 */
export const checkUserProfile = async (userId, rolSolicitado = null) => {
  // 1. Buscamos los datos base del usuario
  const usuario = await Usuario.findById(userId);

  // 2. LÓGICA DE PRIORIDAD DE ROL
  let relacionRol;

  // 2. Buscamos la relación de rol. 
  // Si nos pasan un rol específico (del switch), buscamos ese.
  // Si no nos pasan nada (del login normal), buscamos el primero que tenga.
 /*  const relacionRol = await UsuarioRol.findOne({ 
    usuarioId: userId, 
    rolId: rolSolicitado || { $exists: true } 
  }); */

  if (rolSolicitado) {
    // Si viene del Switch, buscamos ese rol específico para ese usuario
    relacionRol = await UsuarioRol.findOne({ 
      usuarioId: userId, 
      rolId: rolSolicitado 
    });
  } else {
    // SI ES LOGIN NORMAL (rolSolicitado es null):
    // Buscamos todos sus roles y los ordenamos por 'creado_en' (1 = ascendente, el más viejo primero)
    // El .findOne() nos devolverá solo ese primer registro (el original)
    relacionRol = await UsuarioRol.findOne({ usuarioId: userId }).sort({ creado_en: 1 });
  }

  // 3. El 'rolActivo' es el que mandó el Front, o el que encontramos en la DB, o 'pendiente'
  const rolActivo = rolSolicitado || (relacionRol ? relacionRol.rolId : 'pendiente');

  // 4. Datos básicos (DNI y Fecha son obligatorios para TODOS)
  const tieneDatosBasicos = !!(usuario?.dni && usuario?.fecha_nacimiento && usuario?.telefono);

  let datosComisionistaCompletos = false;
  let tieneVehiculo = false;

  // 5. Lógica específica según el rol que se está evaluando
  if (rolActivo === 'comisionista') {
    const comi = await Comisionista.findOne({ usuarioId: userId });
    const vehiculo = await Vehiculo.findOne({ comisionistaId: userId });

    // Verificamos datos bancarios y fotos (Lo que ya tenías)
    datosComisionistaCompletos = !!(
      comi?.alias &&
      comi?.cbu &&
      comi?.cuit &&
      comi?.dniFrenteUrl &&
      comi?.dniDorsoUrl
    );

    // Verificamos si registró al menos un vehículo
    tieneVehiculo = !!vehiculo;
  }

  // 6. Retorno inteligente
  return {
    // Si es comisionista: necesita básicos + documentos + vehículo
    // Si es cliente (o cualquier otro): solo necesita los básicos
    perfilCompleto: rolActivo === 'comisionista' 
      ? (tieneDatosBasicos && datosComisionistaCompletos && tieneVehiculo)
      : (tieneDatosBasicos && rolActivo !== 'pendiente'),
    
    datosComisionistaCompletos, 
    tieneVehiculo, 
    rol: rolActivo 
  };
};
// Login de usuario (Paso 1)
export const loginUser = async ({ email, password }) => {
  const usuario = await Usuario.findOne({ email });
  if (!usuario || usuario.estado !== 'activo') {
    throw new Error('Credenciales inválidas o usuario inactivo');
  }

  // 🛡️ Agregamos esta validación para evitar el error de data and hash
  if (!usuario.contraseña_hash) {
    throw new Error('Este usuario no tiene contraseña (registrado con Google). Usa el inicio de sesión con Google.');
  }
  const passwordOk = await bcrypt.compare(password, usuario.contraseña_hash);
  if (!passwordOk) throw new Error('Credenciales inválidas');

  // SI NO TIENE TOTP: Setup
  if (!usuario.totpSecret) {
    const tempToken = generarTokenTemporal({ userId: usuario._id, step: 'setup' });
    return { requiresSetup: true, tempToken, usuarioId: usuario._id };
  }

  // SI YA TIENE TOTP: Desafío
  const tempToken = generarTokenTemporal({ userId: usuario._id, step: 'totp' });
  return { requiresTotp: true, tempToken };
};

// Verificación TOTP (Paso 2)
/* export const verifyTotp = async ({ tempToken, codigoIngresado }) => {
  // 1. Usamos SOLO nuestra función. No hace falta el try/catch acá porque 
  // verificarToken ya lanza el error si falla.
  const decoded = verificarToken(tempToken);

  // 2. Validaciones de seguridad sobre el contenido del token
  if (decoded.step === 'setup') {
    throw new Error('Debes confirmar tu 2FA primero usando la ruta de confirmación');
  }

  if (decoded.step !== 'totp') {
    throw new Error('Paso de verificación inválido');
  }

  const usuario = await Usuario.findById(decoded.userId);
  if (!usuario) throw new Error('Usuario no encontrado');

  // 3. Verificación del código de Google Authenticator
  const verified = speakeasy.totp.verify({
    secret: usuario.totpSecret,
    encoding: 'base32',
    token: String(codigoIngresado).trim(),
    window: 6 // Un margen razonable de 1 minuto
  });

  if (!verified) throw new Error('Código TOTP inválido');
  // --- OJO ACÁ: BUSCAMOS EL ROL PARA METERLO EN EL TOKEN ---
 // const relacion = await UsuarioRol.findOne({ usuarioId: usuario._id });
  //const miRol = relacion ? relacion.rolId : 'cliente'; // Default por las dudas

  const miRol = decoded.targetRole || 'cliente';
  
  // 4. ÉXITO: Generamos el token de sesión definitivo
  const token = generarTokenSesion({ userId: usuario._id, rol: miRol });

  // LLAMAMOS AL MISMO CHEQUEO MAESTRO ACÁ TAMBIÉN
  const estadoPerfil = await checkUserProfile(usuario._id);

  return {
    message: 'Login exitoso',
    token,
    ...estadoPerfil, // Este es el pase de 24hs
    rol: miRol, // Se lo devolvemos al Front también
    usuario: {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email
    }
  };
}; */

export const verifyTotp = async ({ tempToken, codigoIngresado }) => {
  const decoded = verificarToken(tempToken);

  if (decoded.step !== 'totp') {
    throw new Error('Paso de verificación inválido');
  }

  const usuario = await Usuario.findById(decoded.userId);
  if (!usuario) throw new Error('Usuario no encontrado');

  const verified = speakeasy.totp.verify({
    secret: usuario.totpSecret,
    encoding: 'base32',
    token: String(codigoIngresado).trim(),
    window: 6 
  });

  if (!verified) throw new Error('Código TOTP inválido');

  // PRIORIDAD: 
  // 1. El rol que viene en el token (targetRole)
  // 2. Si no hay nada (login inicial de usuario nuevo), 'cliente' por defecto.
  const miRol = decoded.targetRole || 'cliente';

  // Generamos el token de sesión definitivo con el rol ELEGIDO
  const token = generarTokenSesion({ userId: usuario._id, rol: miRol });

  // Ejecutamos el chequeo maestro pasando el rol activo
  const estadoPerfil = await checkUserProfile(usuario._id, miRol);

  return {
    message: 'Login exitoso',
    token,
    ...estadoPerfil,
    rol: miRol,
    usuario: {
      id: usuario._id,
      nombre: usuario.nombre,
      email: usuario.email
    }
  };
};

/* =========================
    HABILITAR TOTP (para usuarios existentes)
========================= */

export const enableTotp = async (userId) => {
  const usuario = await Usuario.findById(userId);
  if (!usuario) throw new Error('Usuario no encontrado');

  // 1. Generar secreto y ASEGURAR que sea base32 puro
  const secret = speakeasy.generateSecret({ length: 20 });
  const secretBase32 = secret.base32; // Este es el texto: F5JHC...

  // 2. Generar la URL usando EL MISMO secreto que guardamos
  const otpauthUrl = `otpauth://totp/FlexiDrive:${usuario.email}?secret=${secretBase32}&issuer=FlexiDrive`;

  // 3. Guardar en la DB
  usuario.tempTotpSecret = secretBase32;
  await usuario.save();

  // 4. Mostrar en consola
  console.log("\n------------------------------------------------");
  console.log(`💾 Secreto Guardado: ${secretBase32}`);
  console.log(`🚀 ESCANEA ESTE QR:`);

  // Usamos la URL construida manualmente para evitar errores de la librería
  qrcode.generate(otpauthUrl, { small: true });

  console.log("------------------------------------------------\n");

  return {
    message: 'Escanea el QR para activar 2FA.',
    otpauthUrl,
    userId: usuario._id
  };
};

/* =========================
    CONFIRMAR ACTIVACIÓN TOTP
   ========================= */

export const confirmTotp = async ({ userId, codigoIngresado }) => {
  console.log(`🔍 Intentando confirmar TOTP para ID: ${userId}`);

  const usuario = await Usuario.findById(userId);

  if (!usuario || !usuario.tempTotpSecret) {
    throw new Error('No hay un secreto TOTP pendiente de activación.');
  }

  // LOG de seguridad para ver si hay espacios ocultos
  console.log(`📖 Secreto en DB: "${usuario.tempTotpSecret}" (Largo: ${usuario.tempTotpSecret.length})`);
  console.log(`🔢 Código ingresado: "${codigoIngresado}"`);

  // VERIFICACIÓN
  // Forzamos a que el secreto esté en mayúsculas y sin espacios por si las dudas
  const secretToVerify = usuario.tempTotpSecret.toUpperCase().trim();

  const verified = speakeasy.totp.verify({
    secret: secretToVerify,
    encoding: 'base32',
    token: String(codigoIngresado).trim(),
    window: 50 // Subimos a 50 (esto es MUY permisivo, 25 min de margen)
  });

  if (!verified) {
    // Si falla, vamos a imprimir el código que el servidor ESPERABA para ese secreto
    const expectedToken = speakeasy.totp({
      secret: secretToVerify,
      encoding: 'base32'
    });
    console.log(`❌ Error: El servidor esperaba el código ${expectedToken} pero recibió ${codigoIngresado}`);
    throw new Error('Código TOTP inválido. Revisá la hora de tu celular.');
  }

  // Éxito
  usuario.totpSecret = secretToVerify;
  usuario.tempTotpSecret = undefined;
  await usuario.save();

  console.log("✅ TOTP activado con éxito");
  return { message: 'La Autenticación de Dos Factores ha sido activada con éxito.' };
};

/* =========================
    DESACTIVAR TOTP (Controlada)
========================= */
export const disableTotp = async ({ userId, password, codigoIngresado }) => {
  const usuario = await Usuario.findById(userId);
  if (!usuario) throw new Error('Usuario no encontrado');

  // 1. Verificar Contraseña
  const passwordOk = await bcrypt.compare(password, usuario.contraseña_hash);
  if (!passwordOk) throw new Error('Contraseña incorrecta.');

  if (!usuario.totpSecret) throw new Error('2FA no está activa.');

  // 2. Verificar Código TOTP
  const verified = speakeasy.totp.verify({
    secret: usuario.totpSecret,
    encoding: 'base32',
    token: codigoIngresado,
    window: 1
  });

  if (!verified) throw new Error('Código TOTP inválido.');

  // 3. Desactivar
  usuario.totpSecret = undefined;
  await usuario.save();

  return { message: '2FA desactivada con éxito.' };
};

/* =========================
    RESTABLECER TOTP (Versión Simplificada)
   ========================= */
export const resetTotp = async ({ userId }) => {
  const usuario = await Usuario.findById(userId);
  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  // Simplemente borramos el secreto. 
  // Al hacer esto, la próxima vez que intente loguearse, 
  // el sistema detectará que no tiene 2FA y le pedirá setup (requiresSetup: true)
  usuario.totpSecret = undefined;
  usuario.tempTotpSecret = undefined;

  await usuario.save();

  return {
    message: 'Seguridad restablecida. En tu próximo login deberás vincular tu dispositivo nuevamente.'
  };
};


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

/* export const googleLoginService = async (idToken) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { email, given_name, family_name } = ticket.getPayload();

  // 1. Unificación: Buscamos si el mail ya está registrado (manual o Google)
  let usuario = await Usuario.findOne({ email });

  if (!usuario) {
    // 2. Registro nuevo si no existe
    usuario = await Usuario.create({
      nombre: given_name,
      apellido: family_name,
      email: email,
      estado: 'activo'
    });
    console.log(`✨ Nuevo usuario creado: ${email}`);
  }

  // 3. Generamos el token de sesión nuestro (el de 24hs)
  const token = generarTokenSesion({ userId: usuario._id });

  // LLAMAMOS AL CHEQUEO MAESTRO
  const estadoPerfil = await checkUserProfile(usuario._id);

  /*  // 4. Chequeamos si faltan datos obligatorios para Flexi Drive
  const perfilCompleto = !!(usuario.dni && usuario.fecha_nacimiento && (usuario.rol === 'cliente' || usuario.rol === 'comisionista')); */

 /*  return {
    token,
    ...estadoPerfil,
    usuario: {
      id: usuario._id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email
    }
  };
}; */ 

/* export const googleLoginService = async (idToken,telefonoRecibido = null) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { email, given_name, family_name } = ticket.getPayload();

  let usuario = await Usuario.findOne({ email });

  if (!usuario) {
    // Si el usuario es nuevo y el Front nos mandó el teléfono:
    if (!telefonoRecibido) {
      throw new Error("El teléfono es obligatorio para completar el registro.");
    }

  if (!usuario) {
    usuario = await Usuario.create({
      nombre: given_name,
      apellido: family_name,
      email: email,
      telefono: telefonoRecibido, // <--- GUARDAMOS EL DATO DEL MODAL
      estado: 'activo'
    });
  };

  // 1. Buscamos qué roles tiene y si el perfil está completo
  // Pasamos null al principio para que checkUserProfile busque el rol por defecto
  const estadoPerfil = await checkUserProfile(usuario._id);
  
  const tiene2FA = !!usuario.totpSecret;

  // 2. LÓGICA DE TOKEN TEMPORAL (Seguridad)
  // Siempre mandamos el targetRole para que el verifyTotp sepa qué rol dar al final
  const token = generarTokenTemporal({ 
    userId: usuario._id, 
    step: tiene2FA ? 'totp' : 'setup',
    targetRole: estadoPerfil.rol // <--- AQUÍ LO PASAMOS
  });

  return {
    token, // Este es el token temporal (TOTP o Setup)
    ...estadoPerfil,
    requiresSetup: !tiene2FA, 
    requiresTotp: tiene2FA,
    usuario: {
      id: usuario._id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email
    }
  };
};
 */

export const googleLoginService = async (idToken) => {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  const { email, given_name, family_name } = ticket.getPayload();

  let usuario = await Usuario.findOne({ email });

  if (!usuario) {
   
    // Si el usuario es nuevo y SI tenemos el teléfono, lo creamos:
    usuario = await Usuario.create({
      nombre: given_name,
      apellido: family_name,
      email: email,
      estado: 'activo'
    });
    console.log(`✨ Nuevo usuario Google creado: ${email}`);
  }

  // 1. Buscamos qué roles tiene y si el perfil está completo
  const estadoPerfil = await checkUserProfile(usuario._id);
  
  const tiene2FA = !!usuario.totpSecret;

  // 2. LÓGICA DE TOKEN TEMPORAL
  const token = generarTokenTemporal({ 
    userId: usuario._id, 
    step: tiene2FA ? 'totp' : 'setup',
    targetRole: estadoPerfil.rol 
  });

  return {
    token,
    ...estadoPerfil,
    requiresSetup: !tiene2FA, 
    requiresTotp: tiene2FA,
    usuario: {
      id: usuario._id,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      email: usuario.email
    }
  };
};

export const completeComisionistaService = async (userId, data) => {
  // data incluye: entidadBancaria, nroCuenta, tipoCuenta, alias, cbu, cuit, dniFrenteUrl, dniDorsoUrl

  const actualizado = await Comisionista.findOneAndUpdate(
    { usuarioId: userId },
    {
      ...data,
      // Forzamos que el usuarioId esté siempre presente en caso de que sea un 'upsert' (creación)
      usuarioId: userId
    },
    {
      new: true,
      upsert: true, // Si no existe el registro en la tabla 'comisionista', lo crea ahora
      runValidators: true // Valida contra el Schema de Mongoose
    }
  );

  // Con upsert: true, es muy difícil que 'actualizado' sea null, 
  // pero lo dejamos por seguridad.
  if (!actualizado) {
    throw new Error("No se pudo procesar el perfil del comisionista.");
  }

  return actualizado;
};

export const registerVehiculoService = async (userId, data) => {
  // Verificamos si la patente ya existe para no duplicar
  const existePatente = await Vehiculo.findOne({ patente: data.patente });
  if (existePatente) throw new Error("Esta patente ya está registrada en el sistema.");

  const nuevoVehiculo = await Vehiculo.create({
    ...data,
    comisionistaId: userId,
    verificado: false // El admin deberá aprobarlo después
  });

  return nuevoVehiculo;
};