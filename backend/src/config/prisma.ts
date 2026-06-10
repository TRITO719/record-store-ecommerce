import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { env } from './env';

const isProduction = process.env.NODE_ENV === 'production';

const pool = new Pool({ 
  connectionString: env.DATABASE_URL,
  ssl: env.DATABASE_URL.includes('supabase.co') || isProduction
    ? { rejectUnauthorized: false }
    : undefined
});
const adapter = new PrismaPg(pool);

export const prisma = new PrismaClient({ adapter });
