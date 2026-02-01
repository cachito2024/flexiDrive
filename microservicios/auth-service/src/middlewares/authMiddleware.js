import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  // 1. Buscamos el token en el header Authorization
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // El formato es "Bearer TOKEN"

  if (!token) {
    return res.status(401).json({ error: "No se proporcionó un token de seguridad" });
  }

  try {
    // 2. Verificamos que el token sea nuestro y esté vigente
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 3. ¡ESTO ES CLAVE! Metemos el userId dentro del objeto 'req'
    // Así, cuando llegue a tu controlador 'updateProfile', el ID ya estará ahí.
    req.userId = decoded.userId; 
    
    next(); // Seguimos al controlador
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};