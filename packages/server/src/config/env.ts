import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config();

// Environment variables with defaults
export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '4000', 10),
  DB_PATH: process.env.DB_PATH || path.join(process.cwd(), 'data', 'excalidraw.db'),
};
