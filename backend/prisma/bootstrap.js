import dotenv from 'dotenv';
dotenv.config();
import { bootstrapInitialAccounts } from '../src/config/bootstrap.js';
import prisma from '../src/config/db.js';

async function run() {
  try {
    console.log('Running safe, non-destructive database bootstrap...');
    await bootstrapInitialAccounts();
    console.log('Bootstrap finished successfully.');
  } catch (err) {
    console.error('Bootstrap failed:', err);
  } finally {
    await prisma.$disconnect();
  }
}

run();
