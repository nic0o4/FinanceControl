'use strict';

const accountService = require('../services/accountService');

function listAccounts(req, res, next) {
  try {
    const { includeInactive } = req.query;
    const accounts = accountService.listAccounts({
      includeInactive: includeInactive === 'true',
    });
    res.json({ accounts });
  } catch (err) {
    next(err);
  }
}

function getAccount(req, res, next) {
  try {
    const account = accountService.getAccount(parseInt(req.params.id, 10));
    res.json({ account });
  } catch (err) {
    next(err);
  }
}

function createAccount(req, res, next) {
  try {
    const account = accountService.createAccount(req.body);
    res.status(201).json({ account });
  } catch (err) {
    next(err);
  }
}

function updateAccount(req, res, next) {
  try {
    const account = accountService.updateAccount(parseInt(req.params.id, 10), req.body);
    res.json({ account });
  } catch (err) {
    next(err);
  }
}

function toggleAccountStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    const account = accountService.toggleAccountStatus(parseInt(req.params.id, 10), isActive);
    res.json({ account });
  } catch (err) {
    next(err);
  }
}

module.exports = { listAccounts, getAccount, createAccount, updateAccount, toggleAccountStatus };
