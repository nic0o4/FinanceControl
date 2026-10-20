'use strict';

/**
 * Initial database schema migration for ControlFinanciero.
 * Creates all tables, indexes, and seeds initial data.
 * Designed to be idempotent-safe (CREATE TABLE IF NOT EXISTS).
 */

const initialCategories = [
  { name: 'Inversiones', description: 'Transferencias destinadas a inversión y movimientos entre cuentas propios relacionados con inversiones.' },
  { name: 'Reintegro efectivo', description: 'Retiradas de efectivo o reintegros de cajeros automáticos.' },
  { name: 'Compras para Casa', description: 'Compras domésticas y del hogar.' },
  { name: 'Compras general', description: 'Gastos de consumo general.' },
  { name: 'Recurrentes', description: 'Pagos periódicos, suscripciones y recibos habituales.' },
  { name: 'Extraordinarios', description: 'Gastos o movimientos no habituales.' },
  { name: 'Ingresos', description: 'Nóminas, ingresos recurrentes u otros abonos clasificados como ingresos.' },
];

function run(db) {
  const transaction = db.transaction(() => {
    // ================================================================
    // users
    // ================================================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL DEFAULT '',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // ================================================================
    // accounts
    // ================================================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        bank_name TEXT NOT NULL DEFAULT '',
        account_type TEXT NOT NULL DEFAULT 'OTHER',
        currency TEXT NOT NULL DEFAULT 'EUR',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // ================================================================
    // categories
    // ================================================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS categories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
    `);

    // ================================================================
    // imports
    // ================================================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS imports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        filename TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'pending',
        started_at TEXT NOT NULL DEFAULT (datetime('now')),
        completed_at TEXT,
        total_rows INTEGER NOT NULL DEFAULT 0,
        inserted_rows INTEGER NOT NULL DEFAULT 0,
        duplicate_rows INTEGER NOT NULL DEFAULT 0,
        rejected_rows INTEGER NOT NULL DEFAULT 0,
        error_summary TEXT DEFAULT NULL,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
      );
    `);

    // ================================================================
    // transactions
    // ================================================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        account_id INTEGER NOT NULL,
        import_id INTEGER,
        operation_date TEXT NOT NULL,
        value_date TEXT,
        description TEXT NOT NULL DEFAULT '',
        concept TEXT NOT NULL DEFAULT '',
        amount REAL NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'EUR',
        balance_after_operation REAL,
        bank_reference TEXT,
        external_transaction_id TEXT,
        category_id INTEGER,
        raw_data_json TEXT NOT NULL DEFAULT '{}',
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE,
        FOREIGN KEY (import_id) REFERENCES imports(id) ON DELETE SET NULL,
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
      );
    `);

    // ================================================================
    // classification_rules
    // ================================================================
    db.exec(`
      CREATE TABLE IF NOT EXISTS classification_rules (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        conditions_json TEXT NOT NULL DEFAULT '{}',
        category_id INTEGER NOT NULL,
        priority INTEGER NOT NULL DEFAULT 0,
        is_active INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now')),
        FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
      );
    `);

    // ================================================================
    // Indexes for frequent queries
    // ================================================================
    db.exec(`
      CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON transactions(account_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_category_id ON transactions(category_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_operation_date ON transactions(operation_date);
      CREATE INDEX IF NOT EXISTS idx_transactions_import_id ON transactions(import_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_external_id ON transactions(external_transaction_id);
      CREATE INDEX IF NOT EXISTS idx_transactions_bank_reference ON transactions(bank_reference);
      CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at);

      CREATE INDEX IF NOT EXISTS idx_imports_account_id ON imports(account_id);
      CREATE INDEX IF NOT EXISTS idx_imports_status ON imports(status);
      CREATE INDEX IF NOT EXISTS idx_imports_started_at ON imports(started_at);

      CREATE INDEX IF NOT EXISTS idx_classification_rules_active ON classification_rules(is_active);
      CREATE INDEX IF NOT EXISTS idx_classification_rules_priority ON classification_rules(priority);

      CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
      CREATE INDEX IF NOT EXISTS idx_accounts_active ON accounts(is_active);
      CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    `);

    // ================================================================
    // Seed initial categories (only if table is empty)
    // ================================================================
    const existing = db.prepare('SELECT COUNT(*) AS c FROM categories').get().c;
    if (existing === 0) {
      const insertCategory = db.prepare(
        'INSERT INTO categories (name, description, is_active, created_at, updated_at) VALUES (?, ?, 1, datetime(\'now\'), datetime(\'now\'))'
      );
      for (const cat of initialCategories) {
        insertCategory.run(cat.name, cat.description);
      }
    }

    // ================================================================
    // Seed default admin user (admin / admin123)
    // ================================================================
    const existingUser = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
    if (existingUser === 0) {
      const bcrypt = require('bcryptjs');
      const saltRounds = 10;
      const passwordHash = bcrypt.hashSync('admin123', saltRounds);
      db.prepare(
        'INSERT INTO users (username, password_hash, display_name, is_active, created_at, updated_at) VALUES (?, ?, \'Administrador\', 1, datetime(\'now\'), datetime(\'now\'))'
      ).run('admin', passwordHash);
    }
  });

  transaction();
}

module.exports = { run };
