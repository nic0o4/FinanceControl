'use strict';

const express = require('express');
const router = express.Router();
const classificationController = require('../controllers/classificationController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validationMiddleware');

// All classification-rule routes require authentication
router.use(authenticateToken);

router.get('/', classificationController.listRules);
router.post(
  '/',
  validateBody(['name', 'conditionsJson', 'categoryId']),
  classificationController.createRule
);
router.get('/:id', classificationController.getRule);
router.patch('/:id', classificationController.updateRule);
router.delete('/:id', classificationController.removeRule);
router.patch(
  '/:id/status',
  validateBody(['isActive']),
  classificationController.toggleRuleStatus
);
router.post(
  '/test',
  validateBody(['conditionsJson']),
  classificationController.testRule
);
router.post('/propose', classificationController.proposeCategory);

module.exports = router;
