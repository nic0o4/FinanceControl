'use strict';

const express = require('express');
const router = express.Router();
const importController = require('../controllers/importController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validationMiddleware');

// All import routes require authentication
router.use(authenticateToken);

router.post('/upload', importController.upload.single('file'), importController.previewFile);
router.post('/preview', importController.upload.single('file'), importController.previewFile);
router.post(
  '/confirm',
  validateBody(['importId', 'accountId', 'rows']),
  importController.confirmImport
);
router.post('/cancel', validateBody(['importId']), importController.cancelImport);
router.get('/history', importController.getHistory);
router.get('/:id', importController.getImportDetail);

module.exports = router;
