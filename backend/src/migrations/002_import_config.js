'use strict';

/**
 * Migration 002: Add import configuration columns to accounts table.
 * Idempotent: checks PRAGMA table_info before adding each column.
 */
function run(db) {
  const columns = db.prepare('PRAGMA table_info(accounts)').all();
  const columnNames = columns.map((col) => col.name);

  if (!columnNames.includes('import_skip_rows')) {
    db.exec(
      `ALTER TABLE accounts ADD COLUMN import_skip_rows INTEGER NOT NULL DEFAULT 0`
    );
  }

  if (!columnNames.includes('import_column_mapping')) {
    db.exec(
      `ALTER TABLE accounts ADD COLUMN import_column_mapping TEXT NOT NULL DEFAULT '{}'`
    );
  }
}

module.exports = { run };
