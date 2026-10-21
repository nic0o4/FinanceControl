'use strict';

const path = require('path');
const XLSX = require('xlsx');
const db = require('../config/db');
const Import = require('../models/Import');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const ClassificationRule = require('../models/ClassificationRule');
const { fingerprint } = require('../utils/fingerprint');

const MAX_FILE_SIZE_MB = 10;
const MAX_ROWS = 50000;

/**
 * Parse Spanish/European number formats to float.
 * Handles: "1.234,56", "1,234.56", "1234.56", "-1.234,56", "(1.234,56)"
 */
function parseAmount(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }
  let text = String(value).trim();
  if (text === '') return 0;

  // Parentheses indicate negative: (1.234,56) -> -1234.56
  const isParenNegative = text.startsWith('(') && text.endsWith(')');
  if (isParenNegative) {
    text = text.slice(1, -1);
  }

  // Detect decimal separator by checking the last separator
  const lastDot = text.lastIndexOf('.');
  const lastComma = text.lastIndexOf(',');

  if (lastComma > lastDot) {
    // European: 1.234,56 -> remove dots, replace comma with dot
    text = text.replace(/\./g, '').replace(/,/g, '.');
  } else {
    // US/UK: 1,234.56 -> remove commas
    text = text.replace(/,/g, '');
  }

  const parsed = parseFloat(text);
  if (isNaN(parsed)) return 0;
  return isParenNegative ? -Math.abs(parsed) : parsed;
}

function parseDate(value) {
  if (value === null || value === undefined || value === '') return null;
  // If it's a JS Date (from Excel serial), convert
  if (value instanceof Date) {
    return value.toISOString().split('T')[0];
  }
  let text = String(value).trim();
  if (text === '') return null;

  // Excel serial number
  if (!isNaN(text) && text.includes('.') === false && text.length < 8) {
    const serial = parseFloat(text);
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const ms = serial * 86400000;
    const date = new Date(excelEpoch.getTime() + ms);
    return date.toISOString().split('T')[0];
  }

  // Spanish formats: dd/mm/yyyy, dd-mm-yyyy, dd.mm.yyyy
  const spanishMatch = text.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (spanishMatch) {
    const day = parseInt(spanishMatch[1], 10);
    const month = parseInt(spanishMatch[2], 10);
    const year = parseInt(spanishMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // ISO: yyyy-mm-dd
  const isoMatch = text.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (isoMatch) {
    const year = parseInt(isoMatch[1], 10);
    const month = parseInt(isoMatch[2], 10);
    const day = parseInt(isoMatch[3], 10);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
  }

  // Try parsing with Date
  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) {
    return parsed.toISOString().split('T')[0];
  }

  return null;
}

/**
 * Detect column mapping from header row.
 * Returns mapping of normalized field -> column index.
 */
function detectMapping(headers) {
  const mapping = {};
  const lowerHeaders = headers.map(h => String(h || '').trim().toLowerCase());

  const fieldAliases = {
    operation_date: ['fecha operación', 'fecha operacion', 'fecha de operación', 'fechaoperacion', 'fecha oper.', 'fecha op', 'date'],
    value_date: ['fecha valor', 'fecha valor ', 'valuedate', 'fecha valor contable'],
    description: ['descripción', 'descripcion', 'concepto', 'descripcion operación', 'descripción operación', 'concepto / descripción'],
    concept: ['concepto', 'concepto ', 'nota', 'detalle'],
    amount: ['importe', 'amount', 'importe €', 'importe eur'],
    charge: ['cargo', 'debito', 'débito', 'charge', 'deb'],
    credit: ['abono', 'abono ', 'crédito', 'credito', 'credit', 'aben'],
    balance: ['saldo', 'balance', 'saldo disponible'],
    bank_reference: ['referencia', 'referencia bancaria', 'ref'],
    external_transaction_id: ['identificador', 'id operación', 'id operacion', 'transaction id', 'operation id'],
    currency: ['divisa', 'moneda', 'currency'],
    counterparty: ['contraparte', 'beneficiario', 'ordenante'],
    document_number: ['número de documento', 'numero documento', 'doc', 'factura'],
  };

  for (const [field, aliases] of Object.entries(fieldAliases)) {
    for (let i = 0; i < lowerHeaders.length; i++) {
      const h = lowerHeaders[i];
      if (aliases.includes(h)) {
        mapping[field] = i;
        break;
      }
      // Substring match
      for (const alias of aliases) {
        if (h.includes(alias) && mapping[field] === undefined) {
          mapping[field] = i;
          break;
        }
      }
    }
  }

  return mapping;
}

function normalizeRow(row, mapping) {
  const get = (field) => {
    const idx = mapping[field];
    return idx !== undefined ? row[idx] : null;
  };

  const operationDate = parseDate(get('operation_date'));
  const valueDate = parseDate(get('value_date'));
  const description = String(get('description') || '').trim();
  const concept = String(get('concept') || '').trim();

  let amount = 0;
  const charge = parseAmount(get('charge'));
  const credit = parseAmount(get('credit'));
  const directAmount = parseAmount(get('amount'));

  if (charge !== 0 || credit !== 0) {
    // Charge and credit in separate columns
    if (charge !== 0 && credit === 0) {
      amount = -Math.abs(charge);
    } else if (credit !== 0 && charge === 0) {
      amount = Math.abs(credit);
    } else {
      amount = credit - charge;
    }
  } else if (directAmount !== 0) {
    amount = directAmount;
  }

  const currency = String(get('currency') || 'EUR').trim() || 'EUR';
  const bankReference = String(get('bank_reference') || '').trim() || null;
  const externalTransactionId = String(get('external_transaction_id') || '').trim() || null;
  const balanceAfter = parseAmount(get('balance')) || null;

  const rawData = {};
  row.forEach((cell, idx) => {
    const header = (mapping._headers && mapping._headers[idx]) || `col_${idx}`;
    rawData[header] = cell;
  });

  return {
    operationDate,
    valueDate,
    description,
    concept,
    amount,
    currency,
    balanceAfter,
    bankReference,
    externalTransactionId,
    rawData,
  };
}

function detectDuplicates(existingFingerprints, transaction, accountId) {
  const fp = fingerprint(accountId, transaction);
  return existingFingerprints.has(fp);
}

/**
 * Main import flow:
 * 1. Read XLSX file
 * 2. Detect sheets, headers, mapping
 * 3. Parse and normalize rows
 * 4. Detect duplicates
 * 5. Propose categories via rules
 * 6. Return preview (not saved yet)
 */
function previewFile(filePath, accountId) {
  const account = Account.findById(accountId);
  if (!account) {
    const error = new Error('Cuenta no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  // Import configuration from account (if any)
  const skipRows = parseInt(account.import_skip_rows || 0, 10);
  let configuredMapping = null;
  if (
    account.import_column_mapping &&
    account.import_column_mapping.trim() !== '' &&
    account.import_column_mapping !== '{}'
  ) {
    try {
      configuredMapping = JSON.parse(account.import_column_mapping);
    } catch {
      // fall back to auto-detection below
    }
  }

  const workbook = XLSX.readFile(filePath);
  const sheetNames = workbook.SheetNames;

  if (sheetNames.length === 0) {
    const error = new Error('El archivo no contiene hojas.');
    error.statusCode = 400;
    throw error;
  }

  // Use the first sheet by default
  const sheetName = sheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  // Need: skipRows rows + 1 header row + at least 1 data row
  if (jsonData.length < skipRows + 2) {
    const error = new Error(
      'La hoja no contiene datos suficientes (filas omitidas + encabezado + al menos una fila de datos).'
    );
    error.statusCode = 400;
    throw error;
  }

  // Skip configured rows, then the next row is the header
  const dataFromSkip = jsonData.slice(skipRows);
  const headers = dataFromSkip[0].map((h) => String(h || '').trim());

  let mapping;
  if (configuredMapping) {
    mapping = { ...configuredMapping, _headers: headers };
  } else {
    mapping = detectMapping(headers);
    mapping._headers = headers;
  }

  const dataRows = dataFromSkip.slice(1);
  const parsedRows = [];
  const errors = [];

  dataRows.forEach((row, index) => {
    const rowNum = index + skipRows + 2; // Excel row number (1-based, +1 for header, +skipRows)
    try {
      const normalized = normalizeRow(row, mapping);
      // Skip completely empty rows
      if (!normalized.description && !normalized.concept && normalized.amount === 0) {
        return;
      }
      const fp = fingerprint(accountId, normalized);
      parsedRows.push({
        rowNumber: rowNum,
        ...normalized,
        fingerprint: fp,
      });
    } catch (e) {
      errors.push({ row: rowNum, error: e.message });
    }
  });

  if (parsedRows.length > MAX_ROWS) {
    const error = new Error(`El archivo excede el límite de ${MAX_ROWS} filas.`);
    error.statusCode = 400;
    throw error;
  }

  // Load existing fingerprints for duplicate detection
  const existing = db.prepare(
    'SELECT account_id, operation_date, amount, description FROM transactions WHERE account_id = ?'
  ).all(accountId);
  const existingFingerprints = new Set();
  for (const t of existing) {
    existingFingerprints.add(fingerprint(t.account_id, {
      operationDate: t.operation_date,
      amount: t.amount,
      description: t.description,
    }));
  }

  // Mark duplicates and propose categories
  for (const row of parsedRows) {
    row.isDuplicate = detectDuplicates(existingFingerprints, row, accountId);
    const proposal = ClassificationRule.propose(row);
    row.suggestedCategoryId = proposal ? proposal.category_id : null;
    row.suggestedCategoryName = proposal ? (proposal.category_name || null) : null;
    row.suggestedByRule = proposal ? proposal.name : null;
  }

  return {
    sheetName,
    sheetNames,
    mapping: { ...mapping, _headers: undefined },
    rows: parsedRows,
    totalRows: parsedRows.length,
    errors,
  };
}

/**
 * Confirm and save the import transactionally.
 * Only saves non-duplicate rows. Duplicates are counted but not inserted.
 */
function confirmImport(importId, accountId, rowsToImport) {
  const account = Account.findById(accountId);
  if (!account) {
    const error = new Error('Cuenta no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  const importRecord = Import.findById(importId);
  if (!importRecord) {
    const error = new Error('Importación no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  if (importRecord.status !== 'pending') {
    const error = new Error('La importación ya ha sido procesada.');
    error.statusCode = 400;
    throw error;
  }

  const insertTransaction = db.prepare(`
    INSERT INTO transactions (account_id, import_id, operation_date, value_date, description, concept, amount, currency, balance_after_operation, bank_reference, external_transaction_id, category_id, raw_data_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `);

  const updateImport = db.prepare(`
    UPDATE imports SET inserted_rows = ?, duplicate_rows = ?, rejected_rows = ?, status = 'completed', completed_at = datetime('now') WHERE id = ?
  `);

  const transaction = db.transaction(() => {
    let inserted = 0;
    let duplicates = 0;
    let rejected = 0;

    // Existing fingerprints within this account (including ones inserted in this batch)
    const existing = db.prepare(
      'SELECT account_id, operation_date, amount, description FROM transactions WHERE account_id = ?'
    ).all(accountId);
    const existingFingerprints = new Set();
    for (const t of existing) {
      existingFingerprints.add(fingerprint(t.account_id, {
        operationDate: t.operation_date,
        amount: t.amount,
        description: t.description,
      }));
    }

    for (const row of rowsToImport) {
      if (!row.operationDate || !row.description) {
        rejected += 1;
        continue;
      }

      const fp = fingerprint(accountId, row);
      if (existingFingerprints.has(fp)) {
        duplicates += 1;
        continue;
      }

      try {
        insertTransaction.run(
          accountId,
          importId,
          row.operationDate,
          row.valueDate || null,
          row.description,
          row.concept,
          row.amount,
          row.currency,
          row.balanceAfter,
          row.bankReference,
          row.externalTransactionId,
          row.suggestedCategoryId || null,
          JSON.stringify(row.rawData || {})
        );
        existingFingerprints.add(fp);
        inserted += 1;
      } catch (e) {
        rejected += 1;
      }
    }

    updateImport.run(inserted, duplicates, rejected, importId);
    return { inserted, duplicates, rejected, total: rowsToImport.length };
  });

  const result = transaction();
  return Import.findById(importId);
}

function cancelImport(importId) {
  const importRecord = Import.findById(importId);
  if (!importRecord) {
    const error = new Error('Importación no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  if (importRecord.status === 'completed') {
    const error = new Error('No se puede cancelar una importación ya completada.');
    error.statusCode = 400;
    throw error;
  }
  Import.remove(importId);
  return { cancelled: true };
}

function getHistory({ limit = 50, offset = 0 } = {}) {
  return Import.list({ limit, offset });
}

function getImportDetail(id) {
  const record = Import.findById(id);
  if (!record) {
    const error = new Error('Importación no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  return record;
}

module.exports = {
  previewFile,
  confirmImport,
  cancelImport,
  getHistory,
  getImportDetail,
  parseAmount,
  parseDate,
};
