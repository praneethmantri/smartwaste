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
