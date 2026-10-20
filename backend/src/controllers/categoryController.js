'use strict';

const categoryService = require('../services/categoryService');

function listCategories(req, res, next) {
  try {
    const { includeInactive } = req.query;
    const categories = categoryService.listCategories({
      includeInactive: includeInactive === 'true',
    });
    res.json({ categories });
  } catch (err) {
    next(err);
  }
}

function getCategory(req, res, next) {
  try {
    const category = categoryService.getCategory(parseInt(req.params.id, 10));
    res.json({ category });
  } catch (err) {
    next(err);
  }
}

function createCategory(req, res, next) {
  try {
    const category = categoryService.createCategory(req.body);
    res.status(201).json({ category });
  } catch (err) {
    next(err);
  }
}

function updateCategory(req, res, next) {
  try {
    const category = categoryService.updateCategory(parseInt(req.params.id, 10), req.body);
    res.json({ category });
  } catch (err) {
    next(err);
  }
}

function toggleCategoryStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    const category = categoryService.toggleCategoryStatus(parseInt(req.params.id, 10), isActive);
    res.json({ category });
  } catch (err) {
    next(err);
  }
}

function removeCategory(req, res, next) {
  try {
    categoryService.removeCategory(parseInt(req.params.id, 10));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listCategories,
  getCategory,
  createCategory,
  updateCategory,
  toggleCategoryStatus,
  removeCategory,
};
