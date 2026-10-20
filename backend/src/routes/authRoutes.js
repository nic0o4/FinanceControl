'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validationMiddleware');

// Public: login (rate limited in app.js)
router.post('/login', validateBody(['username', 'password']), authController.login);

// Protected: current authenticated user
router.get('/me', authenticateToken, authController.me);

module.exports = router;
