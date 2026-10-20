'use strict';

const express = require('express');
const router = express.Router();
const statisticsController = require('../controllers/statisticsController');
const { authenticateToken } = require('../middleware/authMiddleware');

// All statistics routes require authentication
router.use(authenticateToken);

router.get('/dashboard-summary', statisticsController.getDashboardSummary);
router.get('/movements-by-category', statisticsController.getMovementsByCategory);
router.get('/timeline', statisticsController.getTimeline);
router.get('/summary-by-account', statisticsController.getSummaryByAccount);
router.get(
  '/income-expense-summary',
  statisticsController.getIncomeExpenseSummary
);
router.get('/pending-count', statisticsController.getPendingCount);
router.get('/recent-imports', statisticsController.getRecentImports);

module.exports = router;
