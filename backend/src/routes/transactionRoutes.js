'use strict';

const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validationMiddleware');

// All transaction routes require authentication
router.use(authenticateToken);

router.get('/', transactionController.listTransactions);
router.get('/:id', transactionController.getTransaction);
router.patch(
  '/:id/category',
  validateBody(['categoryId']),
  transactionController.updateTransactionCategory
);
router.post(
  '/bulk-classify',
  validateBody(['ids', 'categoryId']),
  transactionController.bulkUpdateCategory
);
router.get('/pending', transactionController.getPendingTransactions);
router.get('/duplicates', transactionController.getPossibleDuplicates);
router.get('/export', transactionController.exportTransactions);

module.exports = router;
