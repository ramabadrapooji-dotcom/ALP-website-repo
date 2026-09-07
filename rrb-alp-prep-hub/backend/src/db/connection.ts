import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import path from 'path';
import fs from 'fs';
import * as schema from '../../../database/schema/schema';
import { logger } from '../utils/logger';

// ─── Resolve DB path from env ─────────────────────────────────────────────────
function getDbPath(): string {
  const raw = process.env.DATABASE_URL ?? 'file:../data/rrb-alp.db';
  // Strip the "file:" prefix used for Drizzle-kit compatibility
  const filePath = raw.startsWith('file:') ? raw.slice(5) : raw;
  return path.resolve(__dirname, '../../..', filePath);
}

// ─── Ensure data directory exists ────────────────────────────────────────────
function ensureDir(dbPath: string) {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created data directory: ${dir}`);
  }
}

// ─── Singleton connection ─────────────────────────────────────────────────────
let _db: ReturnType<typeof drizzle> | null = null;
let _sqlite: Database.Database | null = null;

export function getDb() {
  if (!_db) {
    const dbPath = getDbPath();
    ensureDir(dbPath);
    logger.info(`Connecting to SQLite database: ${dbPath}`);
    _sqlite = new Database(dbPath);

    // Enable WAL mode for better concurrent reads
    _sqlite.pragma('journal_mode = WAL');
    _sqlite.pragma('foreign_keys = ON');

    _db = drizzle(_sqlite, { schema });
    logger.info('Database connection established');
  }
  return _db;
}

// Alias — used by server start sequence
export async function initializeDb() {
  getDb(); // Ensure connection is opened on startup
}

export function closDb() {
  if (_sqlite) {
    _sqlite.close();
    _sqlite = null;
    _db = null;
    logger.info('Database connection closed');
  }
}

export { schema };
export type DB = ReturnType<typeof getDb>;
