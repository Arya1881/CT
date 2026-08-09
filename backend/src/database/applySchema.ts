/**
 * Apply database/schema.sql to the configured PostgreSQL database.
 * Usage: npm run db:schema  (requires DATABASE_URL)
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { config } from '../config';
import { logger } from '../utils/logger';

async function main(): Promise<void> {
  if (!config.databaseUrl) {
    logger.error('[db] DATABASE_URL is not set. Configure it in backend/.env');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: config.databaseUrl });
  const schema = readFileSync(join(__dirname, '../../../database/schema.sql'), 'utf8');
  logger.info('[db] applying schema...');
  await pool.query(schema);
  logger.info('[db] schema applied successfully');
  await pool.end();
}

main().catch((err) => {
  logger.error('[db] schema apply failed', err);
  process.exit(1);
});
