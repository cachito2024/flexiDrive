import jwt from 'jsonwebtoken';

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "No se proporcionó un token de seguridad" });
  }

  try {
    // Verificamos con la JWT_SECRET que definas en el .env de este micro
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Extraemos el ID y lo pasamos al req para que el controlador lo use
    req.userId = decoded.userId; 
    
    next(); 
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

// NOTA: No copies 'isAdmin' aquí por ahora, a menos que necesites 
// proteger rutas de envíos específicamente para el Admin.