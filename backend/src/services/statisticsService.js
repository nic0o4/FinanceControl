'use strict';

const db = require('../config/db');
const Account = require('../models/Account');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

function getDashboardSummary() {
  const activeAccounts = db.prepare(
    "SELECT COUNT(*) AS c FROM accounts WHERE is_active = 1"
  ).get().c;

  const totalTransactions = db.prepare(
    'SELECT COUNT(*) AS c FROM transactions'
  ).get().c;

  const pendingTransactions = db.prepare(
    'SELECT COUNT(*) AS c FROM transactions WHERE category_id IS NULL'
  ).get().c;

  // Recent imports count
  const recentImports = db.prepare(`
    SELECT COUNT(*) AS c FROM imports
    WHERE started_at >= datetime('now', '-30 days')
  `).get().c;

  // Transactions by category (classified only)
  const byCategory = db.prepare(`
    SELECT c.id AS category_id, c.name AS category_name,
           COUNT(t.id) AS transaction_count,
           COALESCE(SUM(t.amount), 0) AS total_amount
    FROM categories c
    LEFT JOIN transactions t ON t.category_id = c.id
    WHERE c.is_active = 1
    GROUP BY c.id, c.name
    ORDER BY total_amount DESC
  `).all();

  // Income vs expense (classified)
  // Income = positive amount classified as Ingresos or positive generally
  // Expense = negative amount classified (not Inversiones)
  const incomeExpense = db.prepare(`
    SELECT
      COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END), 0) AS total_expense,
      COALESCE(SUM(t.amount), 0) AS net_amount
    FROM transactions t
    WHERE t.category_id IS NOT NULL
  `).get();

  return {
    activeAccounts,
    totalTransactions,
    pendingTransactions,
    suggestedPending: 0, // computed separately if needed
    recentImports,
    totalIncome: incomeExpense.total_income,
    totalExpense: Math.abs(incomeExpense.total_expense),
    netAmount: incomeExpense.net_amount,
    byCategory,
  };
}

function getMovementsByCategory({ dateFrom, dateTo, accountId } = {}) {
  let sql = `
    SELECT c.id AS category_id, c.name AS category_name,
           COUNT(t.id) AS transaction_count,
           COALESCE(SUM(t.amount), 0) AS total_amount,
           COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) AS income,
           COALESCE(SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END), 0) AS expense
    FROM categories c
    LEFT JOIN transactions t ON t.category_id = c.id
    WHERE c.is_active = 1
  `;
  const params = [];
  if (dateFrom) {
    sql += ' AND date(t.operation_date) >= date(?)';
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ' AND date(t.operation_date) <= date(?)';
    params.push(dateTo);
  }
  if (accountId) {
    sql += ' AND t.account_id = ?';
    params.push(accountId);
  }
  sql += ' GROUP BY c.id, c.name ORDER BY total_amount DESC';
  return db.prepare(sql).all(params);
}

function getTimeline({ dateFrom, dateTo, accountId, groupBy = 'month' } = {}) {
  let dateFormat;
  if (groupBy === 'day') dateFormat = '%Y-%m-%d';
  else if (groupBy === 'quarter') dateFormat = '%Y-0' || '%Y-Q';
  else dateFormat = '%Y-%m'; // month

  // Use strftime for grouping
  const groupExpr = `strftime('${dateFormat === '%Y-%m' ? '%Y-%m' : dateFormat}', t.operation_date)`;

  let sql = `
    SELECT ${groupExpr} AS period,
           COUNT(t.id) AS transaction_count,
           COALESCE(SUM(t.amount), 0) AS total_amount,
           COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) AS income,
           COALESCE(SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END), 0) AS expense
    FROM transactions t
    WHERE t.category_id IS NOT NULL
  `;
  const params = [];
  if (dateFrom) {
    sql += ' AND date(t.operation_date) >= date(?)';
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ' AND date(t.operation_date) <= date(?)';
    params.push(dateTo);
  }
  if (accountId) {
    sql += ' AND t.account_id = ?';
    params.push(accountId);
  }
  sql += ` GROUP BY period ORDER BY period ASC`;
  return db.prepare(sql).all(params);
}

function getSummaryByAccount() {
  return db.prepare(`
    SELECT a.id AS account_id, a.description AS account_name, a.bank_name, a.currency,
           COUNT(t.id) AS transaction_count,
           COALESCE(SUM(t.amount), 0) AS total_amount,
           COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) AS income,
           COALESCE(SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END), 0) AS expense
    FROM accounts a
    LEFT JOIN transactions t ON t.account_id = a.id
    WHERE a.is_active = 1
    GROUP BY a.id, a.description, a.bank_name, a.currency
    ORDER BY a.description
  `).all();
}

function getIncomeExpenseSummary({ dateFrom, dateTo, accountId } = {}) {
  let sql = `
    SELECT
      COALESCE(SUM(CASE WHEN t.amount > 0 THEN t.amount ELSE 0 END), 0) AS total_income,
      COALESCE(SUM(CASE WHEN t.amount < 0 THEN t.amount ELSE 0 END), 0) AS total_expense,
      COALESCE(SUM(t.amount), 0) AS net_amount,
      COUNT(t.id) AS transaction_count
    FROM transactions t
    WHERE t.category_id IS NOT NULL
  `;
  const params = [];
  if (dateFrom) {
    sql += ' AND date(t.operation_date) >= date(?)';
    params.push(dateFrom);
  }
  if (dateTo) {
    sql += ' AND date(t.operation_date) <= date(?)';
    params.push(dateTo);
  }
  if (accountId) {
    sql += ' AND t.account_id = ?';
    params.push(accountId);
  }
  return db.prepare(sql).get(params);
}

function getPendingCount() {
  return db.prepare(
    'SELECT COUNT(*) AS c FROM transactions WHERE category_id IS NULL'
  ).get().c;
}

function getSuggestedPendingCount() {
  // Movements classified but with a rule suggestion pending confirmation.
  // Since we don't persist suggestions separately, return 0 (classified = confirmed).
  return 0;
}

function getRecentImports(limit = 10) {
  return db.prepare(`
    SELECT i.id, i.filename, i.status, i.started_at, i.completed_at,
           i.total_rows, i.inserted_rows, i.duplicate_rows, i.rejected_rows,
           a.description AS account_name
    FROM imports i
    JOIN accounts a ON i.account_id = a.id
    ORDER BY i.started_at DESC
    LIMIT ?
  `).all(limit);
}

module.exports = {
  getDashboardSummary,
  getMovementsByCategory,
  getTimeline,
  getSummaryByAccount,
  getIncomeExpenseSummary,
  getPendingCount,
  getSuggestedPendingCount,
  getRecentImports,
};
