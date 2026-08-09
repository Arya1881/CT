/**
 * Centralised application configuration.
 * All environment variables are read here and exposed as a typed object.
 */
import dotenv from 'dotenv';
import path from 'node:path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

function csv(value: string | undefined, fallback: string[]): string[] {
  if (!value) return fallback;
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export const config = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isDev: (process.env.NODE_ENV || 'development') === 'development',

  /** Empty database url => built-in in-memory store (zero infra demo). */
  databaseUrl: process.env.DATABASE_URL || '',

  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',

  corsOrigin: csv(process.env.CORS_ORIGIN, ['http://localhost:5173', 'http://localhost:4173']),

  /** Realtime GPS simulation tick interval in milliseconds. */
  simulationTickMs: Number(process.env.SIMULATION_TICK_MS || 3000),

  /** Seed demo accounts + dataset on first boot. */
  seedDemo: process.env.SEED_DEMO !== 'false',
} as const;
