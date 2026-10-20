'use strict';

/**
 * Middleware de validación simple del cuerpo de la solicitud.
 * Valida que los campos requeridos estén presentes y no vacíos.
 */
function validateBody(requiredFields) {
  return (req, res, next) => {
    const missing = [];
    const empty = [];

    for (const field of requiredFields) {
      const value = req.body[field];
      if (value === undefined || value === null) {
        missing.push(field);
      } else if (typeof value === 'string' && value.trim() === '') {
        empty.push(field);
      }
    }

    if (missing.length > 0 || empty.length > 0) {
      const details = [];
      if (missing.length > 0) details.push(`Faltan campos: ${missing.join(', ')}`);
      if (empty.length > 0) details.push(`Campos vacíos: ${empty.join(', ')}`);
      return res.status(400).json({ error: details.join('. ') });
    }

    next();
  };
}

module.exports = { validateBody };
