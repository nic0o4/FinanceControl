'use strict';

const db = require('../config/db');

class ClassificationRule {
  static list({ includeInactive = false } = {}) {
    let sql = `
      SELECT r.*, c.name AS category_name
      FROM classification_rules r
      JOIN categories c ON r.category_id = c.id
      WHERE 1 = 1
    `;
    const params = [];
    if (!includeInactive) {
      sql += ' AND r.is_active = 1';
    }
    sql += ' ORDER BY r.priority DESC, r.created_at ASC';
    return db.prepare(sql).all(params);
  }

  static findById(id) {
    return db.prepare(`
      SELECT r.*, c.name AS category_name
      FROM classification_rules r
      JOIN categories c ON r.category_id = c.id
      WHERE r.id = ?
    `).get(id);
  }

  static create({ name, conditionsJson, categoryId, priority = 0, isActive = 1 }) {
    const result = db.prepare(`
      INSERT INTO classification_rules (name, conditions_json, category_id, priority, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).run(name, conditionsJson, categoryId, priority, isActive);
    return this.findById(result.lastInsertRowid);
  }

  static update(id, { name, conditionsJson, categoryId, priority, isActive }) {
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (conditionsJson !== undefined) { fields.push('conditions_json = ?'); params.push(conditionsJson); }
    if (categoryId !== undefined) { fields.push('category_id = ?'); params.push(categoryId); }
    if (priority !== undefined) { fields.push('priority = ?'); params.push(priority); }
    if (isActive !== undefined) { fields.push('is_active = ?'); params.push(isActive ? 1 : 0); }
    if (fields.length === 0) return this.findById(id);
    fields.push('updated_at = datetime(\'now\')');
    params.push(id);
    db.prepare(`UPDATE classification_rules SET ${fields.join(', ')} WHERE id = ?`).run(params);
    return this.findById(id);
  }

  static setStatus(id, isActive) {
    db.prepare(
      'UPDATE classification_rules SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(isActive ? 1 : 0, id);
    return this.findById(id);
  }

  static remove(id) {
    return db.prepare('DELETE FROM classification_rules WHERE id = ?').run(id);
  }

  /**
   * Evaluate active rules against a transaction's normalized fields.
   * Returns the first matching rule (by priority desc) or null.
   */
  static propose(transaction) {
    const rules = this.list({ includeInactive: false });
    for (const rule of rules) {
      if (this.matches(rule, transaction)) {
        return rule;
      }
    }
    return null;
  }

  static matches(rule, transaction) {
    let conditions;
    try {
      conditions = JSON.parse(rule.conditions_json || '{}');
    } catch (e) {
      return false;
    }
    const operator = conditions.operator || 'AND';
    const criteria = conditions.criteria || [];

    const results = criteria.map(c => evaluateCriterion(c, transaction));

    if (operator === 'OR') {
      return results.some(Boolean);
    }
    return results.every(Boolean);
  }

  /**
   * Test a rule against existing transactions: count how many would match.
   */
  static test(conditionsJson) {
    let conditions;
    try {
      conditions = JSON.parse(conditionsJson || '{}');
    } catch (e) {
      return { matches: 0, error: 'Invalid conditions JSON' };
    }
    const allTransactions = db.prepare('SELECT * FROM transactions').all();
    let matches = 0;
    for (const tx of allTransactions) {
      const rule = { conditions_json: conditionsJson };
      if (this.matches(rule, tx)) {
        matches += 1;
      }
    }
    return { matches, total: allTransactions.length };
  }
}

function evaluateCriterion(criterion, transaction) {
  const field = criterion.field;
  const operator = criterion.operator;
  const value = criterion.value;

  const fieldValue = getTransactionField(transaction, field);

  switch (operator) {
    case 'contains':
      return String(fieldValue || '').toLowerCase().includes(String(value || '').toLowerCase());
    case 'exact':
      return String(fieldValue || '') === String(value || '');
    case 'regex': {
      try {
        const re = new RegExp(String(value || ''));
        return re.test(String(fieldValue || ''));
      } catch (e) {
        return false;
      }
    }
    case 'gte':
      return Number(fieldValue) >= Number(value);
    case 'lte':
      return Number(fieldValue) <= Number(value);
    case 'gt':
      return Number(fieldValue) > Number(value);
    case 'lt':
      return Number(fieldValue) < Number(value);
    case 'eq':
      return String(fieldValue || '') === String(value || '');
    case 'neq':
      return String(fieldValue || '') !== String(value || '');
    default:
      return false;
  }
}

function getTransactionField(transaction, field) {
  const mapping = {
    description: transaction.description,
    concept: transaction.concept,
    bank: transaction.bank_name,
    account: transaction.account_name,
    amount: transaction.amount,
    currency: transaction.currency,
    counterparty: transaction.raw_data_json ? (() => { try { return JSON.parse(transaction.raw_data_json).contraparte; } catch (e) { return undefined; } })() : undefined,
    reference: transaction.bank_reference,
    external_transaction_id: transaction.external_transaction_id,
  };
  return mapping[field] !== undefined ? mapping[field] : transaction[field];
}

module.exports = ClassificationRule;
