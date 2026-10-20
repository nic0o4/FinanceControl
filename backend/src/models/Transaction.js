'use strict';

const db = require('../config/db');

class Transaction {
  static findById(id) {
    return db.prepare(`
      SELECT t.*,
             a.description AS account_name,
             a.bank_name,
             c.name AS category_name
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE t.id = ?
    `).get(id);
  }

  static list({
    page = 1,
    pageSize = 20,
    accountId,
    categoryId,
    status, // 'classified', 'pending', 'suggested', 'all'
    dateFrom,
    dateTo,
    search,
    minAmount,
    maxAmount,
    onlyDuplicates = false,
    sortBy = 'operation_date',
    sortDir = 'DESC'
  } = {}) {
    let sql = `
      SELECT t.*,
             a.description AS account_name,
             a.bank_name,
             c.name AS category_name
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      WHERE 1 = 1
    `;
    const params = [];

    if (accountId) {
      sql += ' AND t.account_id = ?';
      params.push(accountId);
    }
    if (categoryId) {
      sql += ' AND t.category_id = ?';
      params.push(categoryId);
    }
    if (dateFrom) {
      sql += ' AND date(t.operation_date) >= date(?)';
      params.push(dateFrom);
    }
    if (dateTo) {
      sql += ' AND date(t.operation_date) <= date(?)';
      params.push(dateTo);
    }
    if (minAmount !== undefined) {
      sql += ' AND t.amount >= ?';
      params.push(minAmount);
    }
    if (maxAmount !== undefined) {
      sql += ' AND t.amount <= ?';
      params.push(maxAmount);
    }
    if (search) {
      sql += ' AND (LOWER(t.description) LIKE ? OR LOWER(t.concept) LIKE ?)';
      params.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`);
    }

    // Classification status filter
    if (status === 'pending') {
      sql += ' AND t.category_id IS NULL';
    } else if (status === 'classified') {
      sql += ' AND t.category_id IS NOT NULL';
    } else if (status === 'suggested') {
      // Suggested = classified but there is a rule that could propose (kept simple)
      sql += ' AND t.category_id IS NOT NULL';
    }

    // Duplicate detection placeholder: mark transactions sharing fingerprint as possible duplicates
    if (onlyDuplicates) {
      sql += ' AND t.id IN (SELECT t1.id FROM transactions t1 JOIN transactions t2 ON t1.account_id = t2.account_id AND t1.id <> t2.id AND t1.operation_date = t2.operation_date AND t1.amount = t2.amount AND t1.description = t2.description LIMIT 100)';
    }

    const allowedSort = ['operation_date', 'value_date', 'amount', 'description', 'account_name', 'category_name', 'created_at'];
    if (!allowedSort.includes(sortBy)) sortBy = 'operation_date';
    const dir = sortDir.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    sql += ` ORDER BY t.${sortBy} ${dir}`;

    const offset = (page - 1) * pageSize;
    sql += ' LIMIT ? OFFSET ?';
    params.push(pageSize, offset);

    const rows = db.prepare(sql).all(params);
    const totalRow = db.prepare(
      `SELECT COUNT(*) AS total FROM transactions t WHERE 1 = 1`
    ).get(); // simplified; count without filters for now
    // More accurate total:
    let countSql = `SELECT COUNT(*) AS total FROM transactions t JOIN accounts a ON t.account_id = a.id LEFT JOIN categories c ON t.category_id = c.id WHERE 1 = 1`;
    const countParams = [];
    if (accountId) { countSql += ' AND t.account_id = ?'; countParams.push(accountId); }
    if (categoryId) { countSql += ' AND t.category_id = ?'; countParams.push(categoryId); }
    if (dateFrom) { countSql += ' AND date(t.operation_date) >= date(?)'; countParams.push(dateFrom); }
    if (dateTo) { countSql += ' AND date(t.operation_date) <= date(?)'; countParams.push(dateTo); }
    if (minAmount !== undefined) { countSql += ' AND t.amount >= ?'; countParams.push(minAmount); }
    if (maxAmount !== undefined) { countSql += ' AND t.amount <= ?'; countParams.push(maxAmount); }
    if (search) { countSql += ' AND (LOWER(t.description) LIKE ? OR LOWER(t.concept) LIKE ?)'; countParams.push(`%${search.toLowerCase()}%`, `%${search.toLowerCase()}%`); }
    if (status === 'pending') { countSql += ' AND t.category_id IS NULL'; }
    else if (status === 'classified') { countSql += ' AND t.category_id IS NOT NULL'; }

    const total = db.prepare(countSql).all(countParams)[0].total;

    return { rows, total, page, pageSize };
  }

  static create({ accountId, importId, operationDate, valueDate, description, concept, amount, currency, balanceAfter, bankReference, externalTransactionId, rawData }) {
    const result = db.prepare(`
      INSERT INTO transactions (account_id, import_id, operation_date, value_date, description, concept, amount, currency, balance_after_operation, bank_reference, external_transaction_id, raw_data_json, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(
      accountId, importId, operationDate, valueDate, description, concept,
      amount, currency, balanceAfter, bankReference, externalTransactionId,
      JSON.stringify(rawData || {})
    );
    return this.findById(result.lastInsertRowid);
  }

  static updateCategory(id, categoryId) {
    db.prepare(
      'UPDATE transactions SET category_id = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(categoryId, id);
    return this.findById(id);
  }

  static bulkUpdateCategory(ids, categoryId) {
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(
      `UPDATE transactions SET category_id = ?, updated_at = datetime('now') WHERE id IN (${placeholders})`
    ).run(categoryId, ...ids);
    return { updated: ids.length };
  }

  static pending(limit = 100) {
    return db.prepare(`
      SELECT t.*, a.description AS account_name, a.bank_name
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE t.category_id IS NULL
      ORDER BY t.operation_date DESC
      LIMIT ?
    `).all(limit);
  }

  static duplicates(limit = 100) {
    return db.prepare(`
      SELECT t.*, a.description AS account_name, a.bank_name
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      WHERE t.id IN (
        SELECT t1.id FROM transactions t1
        JOIN transactions t2 ON t1.account_id = t2.account_id AND t1.id <> t2.id
        WHERE t1.operation_date = t2.operation_date AND t1.amount = t2.amount AND t1.description = t2.description
        LIMIT ?
      )
    `).all(limit);
  }

  static exportAll() {
    return db.prepare(`
      SELECT t.operation_date, t.value_date, a.description AS account_name, a.bank_name,
             t.description, t.concept, t.amount, t.currency, t.balance_after_operation,
             t.bank_reference, t.external_transaction_id, c.name AS category_name,
             t.raw_data_json, t.created_at
      FROM transactions t
      JOIN accounts a ON t.account_id = a.id
      LEFT JOIN categories c ON t.category_id = c.id
      ORDER BY t.operation_date DESC
    `).all();
  }
}

module.exports = Transaction;
