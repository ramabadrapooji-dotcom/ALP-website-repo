import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, 'backend/.env') });

const dbUrl = process.env.DATABASE_URL ?? 'file:./data/rrb-alp.db';

export default defineConfig({
  schema: './database/schema/schema.ts',
  out: './database/migrations',
  dialect: 'sqlite',
  dbCredentials: {
    url: dbUrl.replace('file:', ''),
  },
  verbose: true,
  strict: true,
});
