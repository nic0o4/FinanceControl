'use strict';

/**
 * Middleware centralizado de manejo de errores.
 * Nunca expone trazas internas ni secretos en respuestas públicas.
 */
function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  const response = {
    error: err.message || 'Error interno del servidor.',
  };

  // Solo incluir detalles en desarrollo, y nunca secretos
  if (process.env.NODE_ENV === 'development' && err.stack) {
    response.debug = err.stack.split('\n').slice(0, 3);
  }

  console.error(`[${new Date().toISOString()}] ${statusCode} - ${err.message}`);

  res.status(statusCode).json(response);
}

module.exports = { errorHandler };
