'use strict';

const db = require('../config/db');

class Import {
  static create({ accountId, filename, totalRows }) {
    const result = db.prepare(`
      INSERT INTO imports (account_id, filename, status, started_at, total_rows, inserted_rows, duplicate_rows, rejected_rows)
      VALUES (?, ?, 'pending', datetime('now'), ?, 0, 0, 0)
    `).run(accountId, filename, totalRows);
    return this.findById(result.lastInsertRowid);
  }

  static findById(id) {
    return db.prepare(`
      SELECT i.*, a.description AS account_name
      FROM imports i
      JOIN accounts a ON i.account_id = a.id
      WHERE i.id = ?
    `).get(id);
  }

  static list({ limit = 50, offset = 0 } = {}) {
    const rows = db.prepare(`
      SELECT i.*, a.description AS account_name
      FROM imports i
      JOIN accounts a ON i.account_id = a.id
      ORDER BY i.started_at DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);
    const total = db.prepare('SELECT COUNT(*) AS c FROM imports').get().c;
    return { rows, total };
  }

  static complete(id, { status, insertedRows, duplicateRows, rejectedRows, errorSummary }) {
    db.prepare(`
      UPDATE imports
      SET status = ?, completed_at = datetime('now'), inserted_rows = ?, duplicate_rows = ?, rejected_rows = ?, error_summary = ?
      WHERE id = ?
    `).run(status, insertedRows, duplicateRows, rejectedRows, errorSummary, id);
    return this.findById(id);
  }

  static remove(id) {
    return db.prepare('DELETE FROM imports WHERE id = ?').run(id);
  }
}

module.exports = Import;
