import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = `${process.env.DATABASE_URL}`;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  try {
    console.log('Testing connection to:', connectionString);
    const users = await prisma.user.count();
    const products = await prisma.product.count();
    console.log(`Connection successful!`);
    console.log(`Users count: ${users}`);
    console.log(`Products count: ${products}`);
    
    const allProducts = await prisma.product.findMany();
    console.log('Products:', JSON.stringify(allProducts, null, 2));
  } catch (error) {
    console.error('Database connection failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
