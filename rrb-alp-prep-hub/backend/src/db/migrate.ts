import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import path from 'path';
import { getDb } from './connection';
import { logger } from '../utils/logger';

async function runMigrations() {
  logger.info('Running database migrations...');
  const db = getDb();
  migrate(db, {
    migrationsFolder: path.resolve(__dirname, '../../../database/migrations'),
  });
  logger.info('Migrations completed successfully');
}

runMigrations().catch((err) => {
  logger.error('Migration failed:', err);
  process.exit(1);
});
