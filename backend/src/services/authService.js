'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const config = require('../config/env');

function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'La contraseña es obligatoria.' };
  }
  if (password.length < 6) {
    return { valid: false, error: 'La contraseña debe tener al menos 6 caracteres.' };
  }
  return { valid: true };
}

async function login({ username, password }) {
  if (!username || !password) {
    throw Object.assign(new Error('Usuario y contraseña son obligatorios.'), { statusCode: 400 });
  }

  const user = User.findByUsername(username);
  if (!user) {
    throw Object.assign(new Error('Usuario o contraseña incorrectos.'), { statusCode: 401 });
  }

  if (!user.is_active) {
    throw Object.assign(new Error('El usuario está inactivo.'), { statusCode: 401 });
  }

  const passwordValid = await bcrypt.compare(password, user.password_hash);
  if (!passwordValid) {
    throw Object.assign(new Error('Usuario o contraseña incorrectos.'), { statusCode: 401 });
  }

  const token = jwt.sign(
    { userId: user.id, username: user.username },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );

  return {
    token,
    expiresIn: config.jwtExpiresIn,
    user: {
      id: user.id,
      username: user.username,
      displayName: user.display_name,
    },
  };
}

function me(userId) {
  const user = User.findById(userId);
  if (!user) {
    throw Object.assign(new Error('Usuario no encontrado.'), { statusCode: 404 });
  }
  if (!user.is_active) {
    throw Object.assign(new Error('El usuario está inactivo.'), { statusCode: 401 });
  }
  return {
    id: user.id,
    username: user.username,
    displayName: user.display_name,
  };
}

module.exports = { login, me, validatePassword };
