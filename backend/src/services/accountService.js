'use strict';

const Account = require('../models/Account');

const ACCOUNT_TYPES = ['CURRENT', 'SAVINGS', 'CREDIT_CARD', 'INVESTMENT', 'OTHER'];

function validateAccountData({
  description,
  bankName,
  accountType,
  currency,
  importSkipRows,
  importColumnMapping,
}) {
  const errors = [];
  if (description !== undefined && (!description || String(description).trim().length === 0)) {
    errors.push('La descripción de la cuenta es obligatoria.');
  }
  if (accountType && !ACCOUNT_TYPES.includes(accountType)) {
    errors.push(`Tipo de cuenta no válido. Valores permitidos: ${ACCOUNT_TYPES.join(', ')}.`);
  }
  if (currency !== undefined && (!currency || String(currency).trim().length === 0)) {
    errors.push('La moneda es obligatoria.');
  }
  if (importSkipRows !== undefined) {
    const skip = parseInt(importSkipRows, 10);
    if (isNaN(skip) || skip < 0) {
      errors.push('Filas a omitir debe ser un número entero >= 0.');
    }
  }
  if (importColumnMapping !== undefined) {
    try {
      const parsed =
        typeof importColumnMapping === 'string'
          ? JSON.parse(importColumnMapping)
          : importColumnMapping;
      if (parsed !== null && typeof parsed !== 'object') {
        errors.push('Mapeo de columnas debe ser un objeto JSON.');
      }
    } catch {
      errors.push('Mapeo de columnas no es un JSON válido.');
    }
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

function createAccount({
  description,
  bankName,
  accountType,
  currency,
  importSkipRows = 0,
  importColumnMapping = {},
}) {
  const errors = validateAccountData({ description, bankName, accountType, currency });
  if (errors.length > 0) {
    const error = new Error(errors.join(' '));
    error.statusCode = 400;
    throw error;
  }
  return Account.create({
    description,
    bankName,
    accountType,
    currency,
    importSkipRows,
    importColumnMapping,
  });
}

function updateAccount(
  id,
  { description, bankName, accountType, currency, importSkipRows, importColumnMapping }
) {
  const errors = validateAccountData({
    description,
    bankName,
    accountType,
    currency,
    importSkipRows,
    importColumnMapping,
  });
  if (errors.length > 0) {
    const error = new Error(errors.join(' '));
    error.statusCode = 400;
    throw error;
  }
  const account = Account.update(id, {
    description,
    bankName,
    accountType,
    currency,
    importSkipRows,
    importColumnMapping,
  });
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
