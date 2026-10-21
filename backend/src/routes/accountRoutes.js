'use strict';

const express = require('express');
const router = express.Router();
const accountController = require('../controllers/accountController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validationMiddleware');

// All account routes require authentication
router.use(authenticateToken);

router.get('/', accountController.listAccounts);
router.post(
  '/',
  validateBody(['description', 'bankName', 'accountType', 'currency']),
  accountController.createAccount
);
router.get('/:id', accountController.getAccount);
router.patch(
  '/:id',
  validateBody([]),
  accountController.updateAccount
);
router.patch('/:id/status', validateBody(['isActive']), accountController.toggleAccountStatus);

module.exports = router;
