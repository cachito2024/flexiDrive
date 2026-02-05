import { 
  registerUser, 
  loginUser, 
  verifyTotp as verifyTotpService,
  enableTotp as enableTotpService,
  confirmTotp as confirmTotpService,
  resetTotp as resetTotpService, 
  googleLoginService, completeComisionistaService
} from '../services/authService.js';
import { registroSchema, loginSchema, userIdSchema, confirmTotpSchema, updateProfileSchema, completeComisionistaSchema } from '../validations/authValidations.js';
import Usuario from '../models/userModel.js';
import UsuarioRol from '../models/userRoleModel.js';
import Rol from '../models/roleModel.js';
import Comisionista from '../models/comisionistaModel.js';

export const register = async (req, res, next) => {
  try {
    registroSchema.parse(req.body); 
    const result = await registerUser(req.body);
    return res.status(201).json(result); // Agregado return
  } catch (err) {
    return next(err); // Agregado return
  }
};


export const login = async (req, res, next) => {
  try {
    loginSchema.parse(req.body);
    const result = await loginUser(req.body);

    // Si el servicio dice que falta el TOTP, devolvemos el código 200 pero con la info de setup
    if (result.requiresTotp || result.requiresSetup) {
      return res.status(200).json({
        requiresTotp: result.requiresTotp || false,
        requiresSetup: result.requiresSetup || false,
        tempToken: result.tempToken, // Este es el que genera tu servicio
        usuarioId: result.usuarioId
      });
    }

    // Si el usuario NO tiene 2FA (flujo viejo o desactivado), devuelve el token final
    return res.status(200).json(result);
    
  } catch (err) {
    return next(err); 
  }
};

export const verifyTotp = async (req, res, next) => {
  try {
    const { tempToken, codigoIngresado } = req.body;
    const result = await verifyTotpService({ tempToken, codigoIngresado });
    return res.status(200).json(result);
  } catch (err) {
    res.status(401);
    return next(err);
  }
};

export const enableTotp = async (req, res, next) => {
  try {
    userIdSchema.parse(req.body); 
    // Corregido: Llamamos a la función importada directamente
    const result = await enableTotpService(req.body.userId);
    return res.status(200).json(result);
  } catch (err) { 
    return next(err); 
  }
};

export const confirmTotp = async (req, res, next) => {
  try {
    confirmTotpSchema.parse(req.body);
    const result = await confirmTotpService(req.body);
    return res.status(200).json(result);
  } catch (err) { 
    return next(err); 
  }
};

export const resetTotp = async (req, res, next) => {
  try {
    userIdSchema.parse(req.body);
    const result = await resetTotpService({ userId: req.body.userId });
    return res.status(200).json(result);
  } catch (err) { 
    return next(err); 
  }
};

export const googleLogin = async (req, res, next) => {
  try {
    const { idToken } = req.body; // Esto es lo que mandará el Front
    if (!idToken) throw new Error("Falta el idToken de Google");

    const result = await googleLoginService(idToken);
    return res.status(200).json(result);
  } catch (err) {
    return next(err);
  }
};



/* export const updateProfile = async (req, res, next) => {
  try {
    // 1. Validamos los datos que vienen del Front
    const datosValidados = updateProfileSchema.parse(req.body);
    
    const userId = req.userId; // Viene del authMiddleware

    // 2. Usamos los datos ya validados por Zod
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      userId,
      datosValidados, 
      { new: true }
    );

    if (!usuarioActualizado) {
        throw new Error("Usuario no encontrado");
    }

    res.status(200).json({
      message: "Perfil completado con éxito",
      usuario: {
          nombre: usuarioActualizado.nombre,
          dni: usuarioActualizado.dni,
          rol: usuarioActualizado.rol
      }
    });
  } catch (error) {
    // Si Zod falla, este 'next' lo manda directo a tu errorHandler
    next(error);
  }
}; */

export const updateProfile = async (req, res, next) => {
  try {
    // 1. Validamos los datos con Zod (dni, fecha_nacimiento, rol)
    const { dni, fecha_nacimiento, rol } = updateProfileSchema.parse(req.body);
    
    const userId = req.userId; // Extraído del authMiddleware

    // 2. Actualizamos datos básicos en la colección de Usuario
    const usuarioActualizado = await Usuario.findByIdAndUpdate(
      userId,
      { dni, fecha_nacimiento },
      { new: true }
    );

    if (!usuarioActualizado) {
      throw new Error("Usuario no encontrado");
    }

    // 3. Verificamos que el rol exista en la DB (para obtener el _id correcto)
    const rolDB = await Rol.findById(rol);
    if (!rolDB) {
      throw new Error("El rol seleccionado no es válido");
    }

    // 4. Guardamos la relación en la tabla 'usuarioxrol'
    // El upsert hace que si no existe la relación (caso Google), la cree.
    await UsuarioRol.findOneAndUpdate(
      { usuarioId: userId },
      { rolId: rolDB._id },
      { upsert: true, new: true }
    );

    // 5. Si el rol es 'comisionista', creamos su perfil específico si no existe
    if (String(rolDB._id) === 'comisionista') {
      const existeComisionista = await Comisionista.findOne({ usuarioId: userId });
      if (!existeComisionista) {
        await Comisionista.create({
          usuarioId: userId,
          verificado: false
          // Los campos cuil, alias y cbu se llenarán después
        });
        console.log(`✅ Perfil de comisionista creado para: ${userId}`);
      }
    }

    // 6. Respuesta final exitosa
    res.status(200).json({
      message: "Perfil y Rol completados con éxito",
      usuario: {
        id: usuarioActualizado._id,
        nombre: usuarioActualizado.nombre,
        dni: usuarioActualizado.dni,
        rol: rolDB._id
      }
    });

  } catch (error) {
    // Cualquier error (de Zod o de DB) cae aquí y va a tu errorHandler
    next(error);
  }
};

export const updateComisionistaData = async (req, res, next) => {
  try {
    // 1. Validamos los campos con el esquema que ya tenés
    const datosValidados = completeComisionistaSchema.parse(req.body);
    
    // 2. El ID viene del token (authMiddleware)
    const userId = req.userId; 

    // 3. Llamamos al servicio (Importante: pasamos los datos limpios)
    const result = await completeComisionistaService(userId, datosValidados);

    return res.status(200).json({
      message: "Datos bancarios actualizados correctamente",
      comisionista: result
    });
  } catch (err) {
    return next(err);
  }
};