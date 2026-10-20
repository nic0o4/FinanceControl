'use strict';

const path = require('path');
const dotenv = require('dotenv');

// Resolve the .env file relative to THIS file's location (backend/src/config/)
// so the backend works regardless of the working directory Node is started from.
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

const required = [
  'PORT',
  'DB_PATH',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'NODE_ENV',
  'CORS_ORIGINS'
];

const missing = required.filter(key => !process.env[key]);

if (missing.length > 0) {
  console.error(
    `[CONFIG] Error: Missing required environment variable(s): ${missing.join(', ')}`
  );
  console.error(`[CONFIG] Loaded .env from: ${envPath}`);
  process.exit(1);
}

const corsOrigins = process.env.CORS_ORIGINS
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

const config = {
  port: parseInt(process.env.PORT, 10) || 3002,
  nodeEnv: process.env.NODE_ENV,
  dbPath: process.env.DB_PATH,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN,
  corsOrigins,
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 10,
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10,
};

module.exports = config;
