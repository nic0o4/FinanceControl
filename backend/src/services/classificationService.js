'use strict';

const ClassificationRule = require('../models/ClassificationRule');
const Category = require('../models/Category');
const Transaction = require('../models/Transaction');

function listRules({ includeInactive } = {}) {
  return ClassificationRule.list({ includeInactive });
}

function getRule(id) {
  const rule = ClassificationRule.findById(id);
  if (!rule) {
    const error = new Error('Regla no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  return rule;
}

function createRule({ name, conditionsJson, categoryId, priority, isActive }) {
  if (!name || String(name).trim().length === 0) {
    const error = new Error('El nombre de la regla es obligatorio.');
    error.statusCode = 400;
    throw error;
  }

  if (!categoryId) {
    const error = new Error('La categoría es obligatoria.');
    error.statusCode = 400;
    throw error;
  }

  const category = Category.findById(categoryId);
  if (!category) {
    const error = new Error('Categoría no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  // Validate conditions_json
  try {
    JSON.parse(conditionsJson || '{}');
  } catch (e) {
    const error = new Error('Las condiciones no son un JSON válido.');
    error.statusCode = 400;
    throw error;
  }

  return ClassificationRule.create({ name, conditionsJson, categoryId, priority, isActive });
}

function updateRule(id, { name, conditionsJson, categoryId, priority, isActive }) {
  const rule = ClassificationRule.findById(id);
  if (!rule) {
    const error = new Error('Regla no encontrada.');
    error.statusCode = 404;
    throw error;
  }

  if (categoryId) {
    const category = Category.findById(categoryId);
    if (!category) {
      const error = new Error('Categoría no encontrada.');
      error.statusCode = 404;
      throw error;
    }
  }

  if (conditionsJson) {
    try {
      JSON.parse(conditionsJson);
    } catch (e) {
      const error = new Error('Las condiciones no son un JSON válido.');
      error.statusCode = 400;
      throw error;
    }
  }

  return ClassificationRule.update(id, { name, conditionsJson, categoryId, priority, isActive });
}

function toggleRuleStatus(id, isActive) {
  const rule = ClassificationRule.setStatus(id, isActive);
  if (!rule) {
    const error = new Error('Regla no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  return rule;
}

function removeRule(id) {
  const rule = ClassificationRule.findById(id);
  if (!rule) {
    const error = new Error('Regla no encontrada.');
    error.statusCode = 404;
    throw error;
  }
  ClassificationRule.remove(id);
}

function testRule(conditionsJson) {
  return ClassificationRule.test(conditionsJson);
}

function proposeCategory(transaction) {
  return ClassificationRule.propose(transaction);
}

module.exports = {
  listRules,
  getRule,
  createRule,
  updateRule,
  toggleRuleStatus,
  removeRule,
  testRule,
  proposeCategory,
};
