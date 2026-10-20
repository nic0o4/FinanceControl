'use strict';

const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Category = require('../models/Category');
const ClassificationRule = require('../models/ClassificationRule');

function listTransactions(filters = {}) {
  return Transaction.list(filters);
}

function getTransaction(id) {
  const transaction = Transaction.findById(id);
  if (!transaction) {
    const error = new Error('Movimiento no encontrado.');
    error.statusCode = 404;
    throw error;
  }
  return transaction;
}

function updateTransactionCategory(id, categoryId) {
  const transaction = Transaction.findById(id);
  if (!transaction) {
    const error = new Error('Movimiento no encontrado.');
    error.statusCode = 404;
    throw error;
  }

  // If setting a category, verify it exists and is active
  if (categoryId !== null && categoryId !== undefined) {
    const category = Category.findById(categoryId);
    if (!category) {
      const error = new Error('Categoría no encontrada.');
      error.statusCode = 404;
      throw error;
    }
    if (!category.is_active) {
      const error = new Error('La categoría está inactiva.');
      error.statusCode = 400;
      throw error;
    }
  }

  return Transaction.updateCategory(id, categoryId);
}

function bulkUpdateCategory(ids, categoryId) {
  if (!Array.isArray(ids) || ids.length === 0) {
    const error = new Error('Se requiere una lista de IDs de movimientos.');
    error.statusCode = 400;
    throw error;
  }

  const category = Category.findById(categoryId);
  if (!category) {
    const error = new Error('Categoría no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  if (!category.is_active) {
    const error = new Error('La categoría está inactiva.');
    error.statusCode = 400;
    throw error;
  }

  return Transaction.bulkUpdateCategory(ids, categoryId);
}

function getPendingTransactions(limit = 100) {
  return Transaction.pending(limit);
}

function getPossibleDuplicates(limit = 100) {
  return Transaction.duplicates(limit);
}

function exportTransactions() {
  return Transaction.exportAll();
}

module.exports = {
  listTransactions,
  getTransaction,
  updateTransactionCategory,
  bulkUpdateCategory,
  getPendingTransactions,
  getPossibleDuplicates,
  exportTransactions,
};
