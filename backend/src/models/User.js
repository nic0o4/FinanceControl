'use strict';

const db = require('../config/db');

class User {
  static findById(id) {
    return db.prepare('SELECT id, username, display_name, is_active, created_at, updated_at FROM users WHERE id = ?').get(id);
  }

  static findByUsername(username) {
    return db.prepare('SELECT id, username, password_hash, display_name, is_active, created_at, updated_at FROM users WHERE username = ?').get(username);
  }

  static create({ username, passwordHash, displayName }) {
    const result = db.prepare(
      'INSERT INTO users (username, password_hash, display_name, is_active, created_at, updated_at) VALUES (?, ?, ?, 1, datetime(\'now\'), datetime(\'now\'))'
    ).run(username, passwordHash, displayName);
    return this.findById(result.lastInsertRowid);
  }

  static updatePasswordHash(id, passwordHash) {
    db.prepare(
      'UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(passwordHash, id);
    return this.findById(id);
  }

  static setActive(id, isActive) {
    db.prepare(
      'UPDATE users SET is_active = ?, updated_at = datetime(\'now\') WHERE id = ?'
    ).run(isActive ? 1 : 0, id);
    return this.findById(id);
  }

  static list() {
    return db.prepare(
      'SELECT id, username, display_name, is_active, created_at, updated_at FROM users ORDER BY username'
    ).all();
  }
}

module.exports = User;
