import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';

import { logger } from './utils/logger';
import { initializeDb } from './db/connection';
import { errorHandler, notFound } from './middleware/errorHandler';

// Route imports
import questionRoutes from './routes/questions';
import subjectRoutes from './routes/subjects';
import topicRoutes from './routes/topics';
import testRoutes from './routes/tests';
import attemptRoutes from './routes/attempts';
import importRoutes from './routes/imports';
import analyticsRoutes from './routes/analytics';
import settingsRoutes from './routes/settings';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // Vite default
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// Serve uploaded PDFs statically (for preview during review)
app.use('/uploads', express.static(path.resolve(process.cwd(), 'uploads')));

// Routes
app.use('/api/questions', questionRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/topics', topicRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/imports', importRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// Error Handling
app.use(notFound);
app.use(errorHandler);

// Start Server
async function start() {
  try {
    logger.info('Initializing database connection...');
    await initializeDb();
    
    app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
