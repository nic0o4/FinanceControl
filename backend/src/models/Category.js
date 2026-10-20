'use strict';

const db = require('../config/db');

class Category {
  static findById(id) {
    return db.prepare(`
      SELECT c.*,
             (SELECT COUNT(*) FROM transactions t WHERE t.category_id = c.id) AS transaction_count
      FROM categories c
      WHERE c.id = ?
    `).get(id);
  }

  static list({ includeInactive = false } = {}) {
    let sql = `
      SELECT c.*,
             (SELECT COUNT(*) FROM transactions t WHERE t.category_id = c.id) AS transaction_count
      FROM categories c
    `;
    const params = [];
    if (!includeInactive) {
      sql += ' WHERE c.is_active = 1';
    }
    sql += ' ORDER BY c.name';
    return db.prepare(sql).all(params);
  }

  static findByName(name) {
    return db.prepare('SELECT * FROM categories WHERE name = ?').get(name);
  }

  static create({ name, description = '' }) {
    const result = db.prepare(
      `INSERT INTO categories (name, description, is_active, created_at, updated_at)
       VALUES (?, ?, 1, datetime('now'), datetime('now'))`
    ).run(name, description);
    return this.findById(result.lastInsertRowid);
  }

  static update(id, { name, description }) {
    const fields = [];
    const params = [];
    if (name !== undefined) { fields.push('name = ?'); params.push(name); }
    if (description !== undefined) { fields.push('description = ?'); params.push(description); }
    if (fields.length === 0) return this.findById(id);
    fields.push('updated_at = datetime(\'now\')');
    params.push(id);
    db.prepare(`UPDATE categories SET ${fields.join(', ')} WHERE id = ?`).run(params);
    return this.findById(id);
  }

  static setStatus(id, isActive) {
    db.prepare(
      'UPDATE categories SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(isActive ? 1 : 0, id);
    return this.findById(id);
  }

  static remove(id) {
    // Check if referenced by transactions before deleting
    const count = db.prepare('SELECT COUNT(*) AS c FROM transactions WHERE category_id = ?').get(id).c;
    if (count > 0) {
      const error = new Error('CATEGORY_REFERENCED');
      error.statusCode = 409;
      throw error;
    }
    return db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  }
}

module.exports = Category;
