'use strict';

const jwt = require('jsonwebtoken');
const config = require('../config/env');

/**
 * Middleware de autenticación JWT.
 * Verifica el token Bearer en la cabecera Authorization y adjunta req.user.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer <token>

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido.' });
  }

  jwt.verify(token, config.jwtSecret, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expirado.' });
      }
      return res.status(403).json({ error: 'Token inválido.' });
    }

    req.user = {
      id: decoded.userId,
      username: decoded.username,
    };
    next();
  });
}

module.exports = { authenticateToken };
