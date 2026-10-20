'use strict';

const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const { username, password } = req.body;
    const result = await authService.login({ username, password });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

function me(req, res, next) {
  try {
    const result = authService.me(req.user.id);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me };
