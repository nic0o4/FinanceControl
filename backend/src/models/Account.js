'use strict';

const db = require('../config/db');

const ACCOUNT_TYPES = ['CURRENT', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'OTHER'];

class Account {
  static findById(id) {
    return db.prepare(`
      SELECT a.*,
             (SELECT COUNT(*) FROM transactions t WHERE t.account_id = a.id) AS transaction_count
      FROM accounts a
      WHERE a.id = ?
    `).get(id);
  }

  static list({ includeInactive = false } = {}) {
    let sql = `
      SELECT a.*,
             (SELECT COUNT(*) FROM transactions t WHERE t.account_id = a.id) AS transaction_count
      FROM accounts a
    `;
    const params = [];
    if (!includeInactive) {
      sql += ' WHERE a.is_active = 1';
    }
    sql += ' ORDER BY a.description';
    return db.prepare(sql).all(params);
  }

  static create({
    description,
    bankName = '',
    accountType = 'OTHER',
    currency = 'EUR',
    importSkipRows = 0,
    importColumnMapping = {},
  }) {
    if (!ACCOUNT_TYPES.includes(accountType)) {
      accountType = 'OTHER';
    }
    const mappingJson = typeof importColumnMapping === 'string'
      ? importColumnMapping
      : JSON.stringify(importColumnMapping);
    const result = db.prepare(
      `INSERT INTO accounts (description, bank_name, account_type, currency, is_active, import_skip_rows, import_column_mapping, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, ?, ?, datetime('now'), datetime('now'))`
    ).run(description, bankName, accountType, currency, importSkipRows, mappingJson);
    return this.findById(result.lastInsertRowid);
  }

  static update(id, { description, bankName, accountType, currency, importSkipRows, importColumnMapping }) {
    const fields = [];
    const params = [];
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (bankName !== undefined) { fields.push('bank_name = ?'); params.push(bankName); }
    if (accountType !== undefined) { fields.push('account_type = ?'); params.push(accountType); }
    if (currency !== undefined) { fields.push('currency = ?'); params.push(currency); }
    if (importSkipRows !== undefined) { fields.push('import_skip_rows = ?'); params.push(importSkipRows); }
    if (importColumnMapping !== undefined) {
      const mappingJson = typeof importColumnMapping === 'string'
        ? importColumnMapping
        : JSON.stringify(importColumnMapping);
      fields.push('import_column_mapping = ?');
      params.push(mappingJson);
    }
    if (fields.length === 0) return this.findById(id);
    fields.push('updated_at = datetime(\'now\')');
    params.push(id);
    db.prepare(`UPDATE accounts SET ${fields.join(', ')} WHERE id = ?`).run(params);
    return this.findById(id);
  }

  static setStatus(id, isActive) {
    db.prepare(
      'UPDATE accounts SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(isActive ? 1 : 0, id);
    return this.findById(id);
  }

  static remove(id) {
    return db.prepare('DELETE FROM accounts WHERE id = ?').run(id);
  }
}

module.exports = Account;
