const express = require('express');
const router = express.Router();
const userController = require('../controllers/userControllers');

router.post('/', userController.registrarUsuario);

router.get('/', userController.listarUsuarios);


module.exports = router;