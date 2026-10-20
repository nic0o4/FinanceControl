'use strict';

const transactionService = require('../services/transactionService');

function listTransactions(req, res, next) {
  try {
    const filters = {
      page: parseInt(req.query.page, 10) || 1,
      pageSize: parseInt(req.query.pageSize, 10) || 20,
      accountId: req.query.accountId,
      categoryId: req.query.categoryId,
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
      search: req.query.search,
      minAmount: req.query.minAmount !== undefined ? parseFloat(req.query.minAmount) : undefined,
      maxAmount: req.query.maxAmount !== undefined ? parseFloat(req.query.maxAmount) : undefined,
      onlyDuplicates: req.query.onlyDuplicates === 'true',
      sortBy: req.query.sortBy || 'operation_date',
      sortDir: req.query.sortDir || 'DESC',
    };
    const result = transactionService.listTransactions(filters);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function getTransaction(req, res, next) {
  try {
    const transaction = transactionService.getTransaction(parseInt(req.params.id, 10));
    res.json({ transaction });
  } catch (err) {
    next(err);
  }
}

function updateTransactionCategory(req, res, next) {
  try {
    const { categoryId } = req.body;
    const transaction = transactionService.updateTransactionCategory(
      parseInt(req.params.id, 10),
      categoryId
    );
    res.json({ transaction });
  } catch (err) {
    next(err);
  }
}

function bulkUpdateCategory(req, res, next) {
  try {
    const { ids, categoryId } = req.body;
    const result = transactionService.bulkUpdateCategory(ids, categoryId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function getPendingTransactions(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const transactions = transactionService.getPendingTransactions(limit);
    res.json({ transactions });
  } catch (err) {
    next(err);
  }
}

function getPossibleDuplicates(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 100;
    const transactions = transactionService.getPossibleDuplicates(limit);
    res.json({ transactions });
  } catch (err) {
    next(err);
  }
}

function exportTransactions(req, res, next) {
  try {
    const transactions = transactionService.exportTransactions();
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="movimientos.csv"');

    const headers = [
      'Fecha Operación',
      'Fecha Valor',
      'Cuenta',
      'Banco',
      'Descripción',
      'Concepto',
      'Importe',
      'Moneda',
      'Saldo',
      'Referencia',
      'ID Externo',
      'Categoría',
    ];
    const lines = [headers.join(',')];
    for (const t of transactions) {
      lines.push([
        t.operation_date,
        t.value_date || '',
        t.account_name,
        t.bank_name,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        `"${(t.concept || '').replace(/"/g, '""')}"`,
        t.amount,
        t.currency,
        t.balance_after_operation || '',
        t.bank_reference || '',
        t.external_transaction_id || '',
        t.category_name || '',
      ].join(','));
    }
    res.send(lines.join('\n'));
  } catch (err) {
    next(err);
  }
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
