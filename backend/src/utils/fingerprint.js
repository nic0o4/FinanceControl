'use strict';

const crypto = require('crypto');

/**
 * Compute a duplicate-detection fingerprint for a transaction.
 *
 * Considers: account_id, operation_date, amount, description.
 * Normalizes description (trim, collapse whitespace, lowercase) so minor
 * formatting differences don't produce false negatives.
 *
 * Returns a hex SHA-256 hash string.
 */
function fingerprint(accountId, transaction) {
  const operationDate = (transaction.operationDate || transaction.operation_date || '').toString().trim();
  const amount = Number(transaction.amount || 0).toFixed(2);
  const description = String(
    transaction.description || transaction.concept || ''
  )
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ');

  const payload = `${accountId}|${operationDate}|${amount}|${description}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}

module.exports = { fingerprint };
