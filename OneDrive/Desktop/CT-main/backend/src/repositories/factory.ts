import { config } from '../config';
import { buildSeed } from '../database/seedData';
import type { Repository } from './index';
import { createMemoryRepository } from './memory.repository';
import { createPostgresRepository } from './postgres.repository';
import { hashPassword } from '../utils/password';
import { logger } from '../utils/logger';

/**
 * Selects and initialises the repository based on configuration.
 *   - DATABASE_URL set  -> PostgreSQL (production / Supabase)
 *   - otherwise         -> in-memory demo store seeded deterministically
 */
export async function createRepository(): Promise<Repository> {
  if (config.databaseUrl) {
    const repo = createPostgresRepository();
    await repo.init();
    logger.info(`[db] Connected to PostgreSQL at ${config.databaseUrl.replace(/\/\/.*@/, '//***@')}`);
    return repo;
  }

  const seed = await buildSeed(hashPassword);
  const repo = createMemoryRepository(seed);
  await repo.init();
  logger.info(
    `[db] Using in-memory demo store (${seed.users.length} users, ${seed.buses.length} buses, ${seed.trips.length} trips, ${seed.notifications.length} notifications)`,
  );
  return repo;
}
