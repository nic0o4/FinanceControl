'use strict';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const config = require('./config/env');

const authRoutes = require('./routes/authRoutes');
const accountRoutes = require('./routes/accountRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const importRoutes = require('./routes/importRoutes');
const statisticsRoutes = require('./routes/statisticsRoutes');
const classificationRoutes = require('./routes/classificationRoutes');
const { errorHandler } = require('./middleware/errorMiddleware');

const app = express();

// Security headers
app.use(helmet());

// CORS restricted to configured origins (never wildcard in production)
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
  })
);

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', apiLimiter);

// Stricter rate limiting on login attempts
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // limit each IP to 20 login attempts per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos de inicio de sesión. Inténtelo de nuevo más tarde.' },
});
app.use('/api/auth/login', loginLimiter);

// Body parsing (JSON) with 10 MB limit to match file upload limit
app.use(express.json({ limit: '10mb' }));

// Health endpoints
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'controlfinanciero-backend',
    env: config.nodeEnv,
  });
});

app.get('/api/health/database', (_req, res) => {
  try {
    const db = require('./config/db');
    const result = db.prepare('SELECT 1 AS connected').get();
    res.json({
      status: 'ok',
      database: result.connected === 1 ? 'connected' : 'error',
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: err.message,
    });
  }
});

// API routes (all mounted under /api)
app.use('/api/auth', authRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/statistics', statisticsRoutes);
app.use('/api/classification-rules', classificationRoutes);

// 404 for unknown API routes
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Endpoint no encontrado.' });
});

// Centralized error handler (must be last)
app.use(errorHandler);

module.exports = app;
