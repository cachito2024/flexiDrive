const userService = require('../services/userService');

async function registrarUsuario(req, res) {
  try {
    const usuario = await userService.crearUsuario(req.body);
    res.status(201).json({ mensaje: 'Usuario creado con éxito', usuario });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
}

async function listarUsuarios(req, res) {
  try {
    const usuarios = await userService.obtenerUsuarios();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener usuarios' });
  }
}

module.exports = { registrarUsuario, listarUsuarios };
