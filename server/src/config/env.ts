// src/config/env.ts
import dotenv from 'dotenv';
import { logger } from './logger';

dotenv.config();

const getEnvVar = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    logger.error(`Environment variable ${name} is not defined.`);
    process.exit(1);
  }
  return value;
};

export const config = {
  port: getEnvVar('PORT'),
  mongoUri: getEnvVar('MONGO_URI'),
  jwtSecret: getEnvVar('JWT_SECRET'),
  jwtExpiresIn: getEnvVar('JWT_EXPIRES_IN'),
  client_url: getEnvVar('CLIENT_URL'),
};