'use strict';

const Account = require('../models/Account');

const ACCOUNT_TYPES = ['CURRENT', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'OTHER'];

function validateAccountData({ description, bankName, accountType, currency }) {
  const errors = [];
  if (!description || String(description).trim().length === 0) {
    errors.push('La descripción de la cuenta es obligatoria.');
  }
  if (accountType && !ACCOUNT_TYPES.includes(accountType)) {
    errors.push(`Tipo de cuenta no válido. Valores permitidos: ${ACCOUNT_TYPES.join(', ')}.`);
  }
  if (!currency || String(currency).trim().length === 0) {
    errors.push('La moneda es obligatoria.');
  }
  return errors;
}

function listAccounts({ includeInactive } = {}) {
  return Account.list({ includeInactive });
}

function getAccount(id) {
  const account = Account.findById(id);
  if (!account) {
    const error = new Error('Cuenta no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  return account;
}

function createAccount({ description, bankName, accountType, currency }) {
  const errors = validateAccountData({ description, bankName, accountType, currency });
  if (errors.length > 0) {
    const error = new Error(errors.join(' '));
    error.statusCode = 400;
    throw error;
  }
  return Account.create({ description, bankName, accountType, currency });
}

function updateAccount(id, { description, bankName, accountType, currency }) {
  const errors = validateAccountData({ description, bankName, accountType, currency });
  if (errors.length > 0) {
    const error = new Error(errors.join(' '));
    error.statusCode = 400;
    throw error;
  }
  const account = Account.update(id, { description, bankName, accountType, currency });
  if (!account) {
    const error = new Error('Cuenta no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  return account;
}

function toggleAccountStatus(id, isActive) {
  const account = Account.setStatus(id, isActive);
  if (!account) {
    const error = new Error('Cuenta no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  return account;
}

module.exports = {
  listAccounts,
  getAccount,
  createAccount,
  updateAccount,
  toggleAccountStatus,
};
