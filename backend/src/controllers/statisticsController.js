'use strict';

const statisticsService = require('../services/statisticsService');

function getDashboardSummary(req, res, next) {
  try {
    const summary = statisticsService.getDashboardSummary();
    res.json(summary);
  } catch (err) {
    next(err);
  }
}

function getMovementsByCategory(req, res, next) {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      accountId: req.query.accountId,
    };
    const data = statisticsService.getMovementsByCategory(filters);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

function getTimeline(req, res, next) {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      accountId: req.query.accountId,
      groupBy: req.query.groupBy || 'month',
    };
    const data = statisticsService.getTimeline(filters);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

function getSummaryByAccount(req, res, next) {
  try {
    const data = statisticsService.getSummaryByAccount();
    res.json(data);
  } catch (err) {
    next(err);
  }
}

function getIncomeExpenseSummary(req, res, next) {
  try {
    const filters = {
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      accountId: req.query.accountId,
    };
    const data = statisticsService.getIncomeExpenseSummary(filters);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

function getPendingCount(req, res, next) {
  try {
    const count = statisticsService.getPendingCount();
    res.json({ pendingCount: count });
  } catch (err) {
    next(err);
  }
}

function getRecentImports(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const data = statisticsService.getRecentImports(limit);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboardSummary,
  getMovementsByCategory,
  getTimeline,
  getSummaryByAccount,
  getIncomeExpenseSummary,
  getPendingCount,
  getRecentImports,
};
