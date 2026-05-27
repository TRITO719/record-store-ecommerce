import dotenv from 'dotenv';

dotenv.config();

const getRequiredEnv = (name: string): string => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`FATAL: ${name} is not defined in environment variables.`);
  }
  return value;
};

export const env = {
  PORT: process.env.PORT || '3000',
  DATABASE_URL: getRequiredEnv('DATABASE_URL'),
  JWT_SECRET: getRequiredEnv('JWT_SECRET'),
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  SMTP_USER: getRequiredEnv('SMTP_USER'),
  SMTP_PASS: getRequiredEnv('SMTP_PASS'),
};
