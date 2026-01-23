import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import Usuario from '../models/userModel.js';
import UsuarioRol from '../models/userRoleModel.js';
import Rol from '../models/roleModel.js';
import Comisionista from '../models/comisionistaModel.js';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode-terminal';
import { generarTokenTemporal, generarTokenSesion, verificarToken } from '../utils/jwt.js';

const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_secreta_temporal';

// Registro de usuario
export const registerUser = async (data) => {
  const {
    nombre, apellido, email, password, rol,
    dni, fecha_nacimiento, cuil, alias, cbu
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
    dni, fecha_nacimiento, estado: 'activo'
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
      alias, cuil, cbu, verificado: false
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

/* // Login de usuario (Paso 1) - MODIFICADO
export const loginUser = async ({ email, password }) => {
  const usuario = await Usuario.findOne({ email });
  if (!usuario || usuario.estado !== 'activo') {
    throw new Error('Credenciales inválidas o usuario inactivo');
  }

  const passwordOk = await bcrypt.compare(password, usuario.contraseña_hash);
  if (!passwordOk) throw new Error('Credenciales inválidas');

  // SI NO TIENE TOTP: Lo mandamos a configurar (Setup)
  if (!usuario.totpSecret) {
    const tempToken = generarTokenTemporal({ userId: usuario._id, step: 'setup' }); // <--- USAMOS LA FUNCIÓN
    return { requiresSetup: true, tempToken, usuarioId: usuario._id };
  }

  // SI YA TIENE TOTP: Le pedimos el código normal
  const tempToken = generarTokenTemporal({ userId: usuario._id, step: 'totp' }); // <--- USAMOS LA FUNCIÓN
return { requiresTotp: true, tempToken };
}; */
// Login de usuario (Paso 1)
export const loginUser = async ({ email, password }) => {
  const usuario = await Usuario.findOne({ email });
  if (!usuario || usuario.estado !== 'activo') {
    throw new Error('Credenciales inválidas o usuario inactivo');
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
export const verifyTotp = async ({ tempToken, codigoIngresado }) => {
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
    window: 2 // Un margen razonable de 1 minuto
  });

  if (!verified) throw new Error('Código TOTP inválido');

  // 4. ÉXITO: Generamos el token de sesión definitivo
  const token = generarTokenSesion({ userId: usuario._id });

  return {
    message: 'Login exitoso',
    token, // Este es el pase de 24hs
    usuario: {
      nombre: usuario.nombre,
      email: usuario.email
    }
  };
};/* 
// Verificación TOTP (Paso 2) - MODIFICADO
export const verifyTotp = async ({ tempToken, codigoIngresado }) => {
  const decoded = verificarToken(tempToken);
  try {
    decoded = jwt.verify(tempToken, JWT_SECRET);
  } catch (err) {
    throw new Error('Token temporal inválido o expirado');
  }

  // VALIDACIÓN CLAVE: Si el token es de 'setup', no puede usar esta ruta de verificación normal
  if (decoded.step === 'setup') {
    throw new Error('Debes configurar y confirmar tu 2FA primero usando la ruta de confirmación');
  }

  if (decoded.step !== 'totp') {
    throw new Error('Paso de verificación inválido');
  }

  const usuario = await Usuario.findById(decoded.userId);
  if (!usuario) throw new Error('Usuario no encontrado');

  const verified = speakeasy.totp.verify({
    secret: usuario.totpSecret,
    encoding: 'base32',
    token: codigoIngresado,
    window: 1
  });

  if (!verified) throw new Error('Código TOTP inválido');

  // Si todo está OK, entregamos el token de sesión definitivo por 1 día
  const token = generarTokenSesion({ userId: usuario._id });

  return {
    message: 'Login exitoso',
    token,
    usuarioId: usuario._id
  };
};
 */
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
/* export const confirmTotp = async ({ userId, codigoIngresado }) => {
  // 1. Log para debug (Verifica esto en tu consola de VS Code)
  console.log(`🔍 Intentando confirmar TOTP para ID: ${userId} con código: ${codigoIngresado}`);

  const usuario = await Usuario.findById(userId);
  console.log(`📖 Secreto recuperado de la DB: ${usuario?.tempTotpSecret}`);

  if (!usuario || !usuario.tempTotpSecret) {
    console.log("❌ No se encontró el secreto temporal en la DB");
    throw new Error('No hay un secreto TOTP pendiente de activación.');
  }

  // 2. VERIFICACIÓN (Con ajustes de seguridad)
  const verified = speakeasy.totp.verify({
    secret: usuario.tempTotpSecret,
    encoding: 'base32',
    token: String(codigoIngresado).trim(), // <--- MUY IMPORTANTE: Asegurar que sea String y sin espacios
    window: 6 // Aumentamos el margen a 6 (permite códigos de hace 3 minutos o del próximo 3 minutos)
  });

  if (!verified) {
    console.log("❌ El código no coincide con el secreto generado");
    throw new Error('Código TOTP inválido. Intenta escanear el QR nuevamente.');
  }

  // 3. Activación exitosa
  usuario.totpSecret = usuario.tempTotpSecret;
  usuario.tempTotpSecret = undefined; // Limpiamos el temporal
  await usuario.save();

  console.log("✅ TOTP activado correctamente para:", usuario.email);

  return {
    message: 'La Autenticación de Dos Factores ha sido activada con éxito.'
  };
};
 */
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