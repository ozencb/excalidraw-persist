import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { serverConfig } from './config';
import { openDatabase, initializeDatabase, closeDatabase } from './lib/database';
import { runMigrations } from './lib/migrations';
import apiRoutes from './routes';
import logger from './utils/logger';

const app = express();
const PORT = serverConfig.port;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', apiRoutes);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

const startServer = async () => {
  try {
    await openDatabase();
    logger.info('Database connection established');

    await initializeDatabase();
    logger.info('Database initialized');

    await runMigrations();
    logger.info('Migrations complete');

    app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
    });

    process.on('SIGINT', async () => {
      logger.info('Shutting down server...');
      await closeDatabase();
      logger.info('Database connection closed');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Shutting down server...');
      await closeDatabase();
      logger.info('Database connection closed');
      process.exit(0);
    });

    process.on('uncaughtException', function (err) {
      logger.error('Unhandled Exception:', err);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
