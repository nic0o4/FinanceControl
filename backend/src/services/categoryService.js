'use strict';

const Category = require('../models/Category');

function listCategories({ includeInactive } = {}) {
  return Category.list({ includeInactive });
}

function getCategory(id) {
  const category = Category.findById(id);
  if (!category) {
    const error = new Error('Categoría no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  return category;
}

function createCategory({ name, description }) {
  if (!name || String(name).trim().length === 0) {
    const error = new Error('El nombre de la categoría es obligatorio.');
    error.statusCode = 400;
    throw error;
  }

  const existing = Category.findByName(name);
  if (existing && existing.is_active) {
    const error = new Error('Ya existe una categoría activa con ese nombre.');
    error.statusCode = 409;
    throw error;
  }

  return Category.create({ name, description });
}

function updateCategory(id, { name, description }) {
  const category = Category.findById(id);
  if (!category) {
    const error = new Error('Categoría no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  if (name && name !== category.name) {
    const existing = Category.findByName(name);
    if (existing && existing.id !== id && existing.is_active) {
      const error = new Error('Ya existe una categoría activa con ese nombre.');
      error.statusCode = 409;
      throw error;
    }
  }

  return Category.update(id, { name, description });
}

function toggleCategoryStatus(id, isActive) {
  const category = Category.setStatus(id, isActive);
  if (!category) {
    const error = new Error('Categoría no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  return category;
}

function removeCategory(id) {
  try {
    Category.remove(id);
  } catch (error) {
    if (error.message === 'CATEGORY_REFERENCED') {
      const err = new Error('No se puede eliminar la categoría porque tiene movimientos asociados.');
      err.statusCode = 409;
      throw err;
    }
    throw error;
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
