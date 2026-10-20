'use strict';

const importService = require('../services/importService');
const multer = require('multer');

// Configurar almacenamiento temporal para archivos subidos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, require('path').join(__dirname, '../../../data/tmp'));
  },
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.xlsx', '.xls'];
    const ext = require('path').extname(file.originalname).toLowerCase();
    if (!allowed.includes(ext)) {
      return cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls).'), false);
    }
    cb(null, true);
  },
});

function previewFile(req, res, next) {
  try {
    const { accountId } = req.body;
    const filePath = req.file ? req.file.path : null;
    if (!filePath) {
      return res.status(400).json({ error: 'No se proporcionó archivo.' });
    }
    const preview = importService.previewFile(filePath, accountId);
    res.json(preview);
  } catch (err) {
    next(err);
  }
}

function confirmImport(req, res, next) {
  try {
    const { importId, accountId, rows } = req.body;
    const result = importService.confirmImport(importId, accountId, rows);
    res.json({ import: result });
  } catch (err) {
    next(err);
  }
}

function cancelImport(req, res, next) {
  try {
    const { importId } = req.body;
    const result = importService.cancelImport(importId);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function getHistory(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 50;
    const offset = parseInt(req.query.offset, 10) || 0;
    const history = importService.getHistory({ limit, offset });
    res.json(history);
  } catch (err) {
    next(err);
  }
}

function getImportDetail(req, res, next) {
  try {
    const record = importService.getImportDetail(parseInt(req.params.id, 10));
    res.json({ import: record });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  upload,
  previewFile,
  confirmImport,
  cancelImport,
  getHistory,
  getImportDetail,
};
