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
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY || '',
  DEEPSEEK_API_URL: process.env.DEEPSEEK_API_URL || 'https://api.deepseek.com/chat/completions',
  DEEPSEEK_MODEL: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
  HF_API_TOKEN: process.env.HF_API_TOKEN || '',
  HF_MODEL: process.env.HF_MODEL || 'google/flan-t5-base',
};
