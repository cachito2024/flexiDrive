const Usuario = require('../models/userModel');
const bcrypt = require('bcrypt');

async function crearUsuario(data) {
  const { nombre, apellido, email, contraseña, rol } = data;

  // Verificar que no exista email
  const usuarioExistente = await Usuario.findOne({ email });
  if (usuarioExistente) throw new Error('El email ya está registrado');

  // Hashear contraseña
  const contraseña_hash = await bcrypt.hash(contraseña, 10);

  const nuevoUsuario = new Usuario({
    nombre,
    apellido,
    email,
    contraseña_hash,
    rol,
  });

  return await nuevoUsuario.save();
}

async function obtenerUsuarios() {
  return await Usuario.find();
}


module.exports = { crearUsuario, obtenerUsuarios  };

