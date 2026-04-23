import { Pool } from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
  const { rows } = await pool.query('SELECT id, email, role FROM "User"');
  console.log('Users in DB:');
  console.table(rows);
  process.exit(0);
}
check();
