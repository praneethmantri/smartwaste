import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import complaintRoutes from './routes/complaintRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import scheduleRoutes from './routes/scheduleRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { setupSwagger } from './routes/swaggerDocs.js';
import { errorHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security and utility middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

const parseAllowedOrigins = () => {
  const envUrl = process.env.CLIENT_URL;
  if (!envUrl || envUrl === '*') return '*';
  return envUrl.split(',').map((u) => u.trim());
};

const allowedOrigins = parseAllowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile native, server-to-server, curl)
      if (!origin || allowedOrigins === '*') return callback(null, true);
      if (Array.isArray(allowedOrigins) && allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Allow any vercel deployment preview if main domain is configured
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV === 'production') {
        return callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
      return callback(null, true);
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Serve uploaded media files publicly
app.use('/uploads', express.static(path.resolve(__dirname, '../uploads')));

// Swagger Documentation
setupSwagger(app);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    system: 'Smart Waste Collection & Management System',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Mount Routes with API Rate Limiter
app.use('/api', apiLimiter);
app.use('/api/auth', authRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/admin', adminRoutes);

// In production or when built frontend exists, serve frontend/dist static files
const frontendDistPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) {
      return next();
    }
    const indexPath = path.join(frontendDistPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      return res.sendFile(indexPath);
    }
    next();
  });
}

// Catch 404 for unhandled API or asset requests
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Resource not found: ${req.method} ${req.originalUrl}`,
  });
});

// Centralized Error Handler
app.use(errorHandler);

export default app;
