import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import prisma from './config/db.js';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Verify database connectivity
    await prisma.$connect();
    console.log('✓ Successfully connected to PostgreSQL database (smartwaste_db)');

    // In cloud deployment (Render, Railway, etc.), if database is empty, auto-seed initial demo accounts
    try {
      const userCount = await prisma.user.count();
      if (userCount === 0) {
        console.log('⚡ Empty database detected. Auto-seeding initial users, zones, and schedules...');
        const { execSync } = await import('child_process');
        const { fileURLToPath } = await import('url');
        const { dirname, join } = await import('path');
        const __filename = fileURLToPath(import.meta.url);
        const backendDir = join(dirname(__filename), '..');
        execSync('node prisma/seed.js', { cwd: backendDir, stdio: 'inherit' });
        console.log('✓ Initial deployment records seeded successfully.');
      }
    } catch (seedErr) {
      console.warn('Auto-seed check notice (continuing):', seedErr.message);
    }

    app.listen(PORT, () => {
      console.log(`✓ Smart Waste Backend API running on http://localhost:${PORT}`);
      console.log(`✓ Swagger API Documentation available at http://localhost:${PORT}/api/docs`);
      console.log(`✓ Health check at http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Fatal: Failed to connect to database or start server:', error);
    process.exit(1);
  }
};

startServer();
