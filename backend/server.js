'use strict';

const config = require('./src/config/env'); // validates required env vars (exits if missing)
const db = require('./src/config/db');
const { run: runMigration } = require('./src/migrations/001_initial_schema');
const { run: runImportConfigMigration } = require('./src/migrations/002_import_config');
const app = require('./src/app');

// Run migrations (idempotent: CREATE TABLE IF NOT EXISTS, seed only if empty)
runMigration(db);
runImportConfigMigration(db);

const server = app.listen(config.port, () => {
  console.log(`[SERVER] ControlFinanciero backend listening on port ${config.port}`);
  console.log(`[SERVER] Environment: ${config.nodeEnv}`);
});

module.exports = server;
