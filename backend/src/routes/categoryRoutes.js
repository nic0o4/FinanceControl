'use strict';

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken } = require('../middleware/authMiddleware');
const { validateBody } = require('../middleware/validationMiddleware');

// All category routes require authentication
router.use(authenticateToken);

router.get('/', categoryController.listCategories);
router.post('/', validateBody(['name']), categoryController.createCategory);
router.get('/:id', categoryController.getCategory);
router.patch('/:id', validateBody(['name']), categoryController.updateCategory);
router.patch(
  '/:id/status',
  validateBody(['isActive']),
  categoryController.toggleCategoryStatus
);
router.delete('/:id', categoryController.removeCategory);

module.exports = router;
