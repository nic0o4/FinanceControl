'use strict';

const path = require('path');
const Database = require('better-sqlite3');
const config = require('./env');

// Resolve the database path relative to the backend root if it is not absolute.
const resolveDbPath = (dbPath) => {
  if (path.isAbsolute(dbPath)) {
    return dbPath;
  }
  return path.resolve(__dirname, '../../', dbPath);
};

const dbFile = resolveDbPath(config.dbPath);

const db = new Database(dbFile, {
  fileMustExist: false,
  verbose: config.nodeEnv === 'development' ? console.log : null,
});

// Enable foreign key constraints and WAL mode for better concurrency/integrity.
db.pragma('foreign_keys = ON');
db.pragma('journal_mode = WAL');

module.exports = db;
