'use strict';

const classificationService = require('../services/classificationService');

function listRules(req, res, next) {
  try {
    const { includeInactive } = req.query;
    const rules = classificationService.listRules({
      includeInactive: includeInactive === 'true',
    });
    res.json({ rules });
  } catch (err) {
    next(err);
  }
}

function getRule(req, res, next) {
  try {
    const rule = classificationService.getRule(parseInt(req.params.id, 10));
    res.json({ rule });
  } catch (err) {
    next(err);
  }
}

function createRule(req, res, next) {
  try {
    const rule = classificationService.createRule(req.body);
    res.status(201).json({ rule });
  } catch (err) {
    next(err);
  }
}

function updateRule(req, res, next) {
  try {
    const rule = classificationService.updateRule(parseInt(req.params.id, 10), req.body);
    res.json({ rule });
  } catch (err) {
    next(err);
  }
}

function toggleRuleStatus(req, res, next) {
  try {
    const { isActive } = req.body;
    const rule = classificationService.toggleRuleStatus(parseInt(req.params.id, 10), isActive);
    res.json({ rule });
  } catch (err) {
    next(err);
  }
}

function removeRule(req, res, next) {
  try {
    classificationService.removeRule(parseInt(req.params.id, 10));
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
}

function testRule(req, res, next) {
  try {
    const { conditionsJson } = req.body;
    const result = classificationService.testRule(conditionsJson);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function proposeCategory(req, res, next) {
  try {
    const transaction = req.body;
    const proposal = classificationService.proposeCategory(transaction);
    res.json({ proposal });
  } catch (err) {
    next(err);
  }
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
