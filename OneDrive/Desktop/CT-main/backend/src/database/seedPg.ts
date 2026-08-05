/**
 * Seed a PostgreSQL database with the full demo dataset.
 * Usage: npm run db:seed  (requires DATABASE_URL)
 * The dataset is identical to the one used by the in-memory demo store.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { Pool } from 'pg';
import { config } from '../config';
import { buildSeed } from './seedData';
import { hashPassword } from '../utils/password';
import { logger } from '../utils/logger';

async function main(): Promise<void> {
  if (!config.databaseUrl) {
    logger.error('[db] DATABASE_URL is not set. Configure it in backend/.env');
    process.exit(1);
  }
  const pool = new Pool({ connectionString: config.databaseUrl });
  const schema = readFileSync(join(__dirname, '../../../database/schema.sql'), 'utf8');
  await pool.query('BEGIN');
  try {
    await pool.query(schema);
    const seed = await buildSeed(hashPassword);

    await insertMany(pool, 'users', seed.users, mapFor('users'));
    await insertMany(pool, 'routes', seed.routes, (r) => ({ ...r, waypoints: JSON.stringify(r.waypoints) }));
    await insertMany(pool, 'stops', seed.stops, mapFor('stops'));
    await insertMany(pool, 'drivers', seed.drivers, mapFor('drivers'));
    await insertMany(pool, 'buses', seed.buses, mapFor('buses'));
    await insertMany(pool, 'parents', seed.parents, mapFor('parents'));
    await insertMany(pool, 'students', seed.students, mapFor('students'));
    await insertMany(pool, 'student_bus', seed.studentBus, mapFor('student_bus'));
    await insertMany(pool, 'trips', seed.trips, mapFor('trips'));
    await insertMany(pool, 'live_locations', seed.liveLocations, mapFor('live_locations'));
    await insertMany(pool, 'notifications', seed.notifications, mapFor('notifications'));
    await insertMany(pool, 'emergency_alerts', seed.emergencyAlerts, mapFor('emergency_alerts'));
    await insertMany(pool, 'audit_logs', seed.auditLogs, mapFor('audit_logs'));

    await pool.query('COMMIT');
    logger.info(`[db] seeded ${seed.users.length} users, ${seed.students.length} students, ${seed.trips.length} trips`);
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  } finally {
    await pool.end();
  }
}

/** camelCase -> snake_case column mapping per table. */
const SNAKE: Record<string, Record<string, string>> = {
  users: { passwordHash: 'password_hash', firstName: 'first_name', lastName: 'last_name', avatarUrl: 'avatar_url', isActive: 'is_active', createdAt: 'created_at' },
  students: { userId: 'user_id', rollNumber: 'roll_number', busId: 'bus_id', stopId: 'stop_id', parentId: 'parent_id', emergencyContactName: 'emergency_contact_name', emergencyContactPhone: 'emergency_contact_phone', createdAt: 'created_at' },
  parents: { userId: 'user_id', childrenCount: 'children_count' },
  drivers: { userId: 'user_id', licenseNo: 'license_no', busId: 'bus_id', hireDate: 'hire_date' },
  buses: { plateNumber: 'plate_number', routeId: 'route_id', driverId: 'driver_id', fuelLevel: 'fuel_level', lastMaintenance: 'last_maintenance', currentLat: 'current_lat', currentLng: 'current_lng', createdAt: 'created_at' },
  routes: { distanceKm: 'distance_km', estimatedDurationMin: 'estimated_duration_min', createdAt: 'created_at' },
  stops: { routeId: 'route_id', orderIndex: 'order_index', arrivalOffsetMin: 'arrival_offset_min', createdAt: 'created_at' },
  student_bus: { studentId: 'student_id', busId: 'bus_id', routeId: 'route_id' },
  trips: { busId: 'bus_id', routeId: 'route_id', driverId: 'driver_id', startedAt: 'started_at', completedAt: 'completed_at', passengerCount: 'passenger_count', delayMinutes: 'delay_minutes', distanceKm: 'distance_km', startLat: 'start_lat', startLng: 'start_lng', endLat: 'end_lat', endLng: 'end_lng' },
  live_locations: { busId: 'bus_id', routeId: 'route_id', tripId: 'trip_id', speedKmh: 'speed_kmh', timestamp: 'timestamp' },
  notifications: { userId: 'user_id', busId: 'bus_id', tripId: 'trip_id', createdAt: 'created_at' },
  emergency_alerts: { userId: 'user_id', busId: 'bus_id', tripId: 'trip_id', resolvedAt: 'resolved_at', createdAt: 'created_at' },
  audit_logs: { userId: 'user_id', entityId: 'entity_id', createdAt: 'created_at' },
};

function mapFor(table: string) {
  return (row: Record<string, unknown>) => {
    const map = SNAKE[table] ?? {};
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(row)) out[map[k] ?? k] = v;
    return out;
  };
}

async function insertMany(pool: Pool, table: string, rows: readonly unknown[], transform: (r: Record<string, unknown>) => Record<string, unknown>): Promise<void> {
  if (rows.length === 0) return;
  for (const raw of rows) {
    const data = transform(raw as Record<string, unknown>);
    const keys = Object.keys(data);
    const cols = keys.join(', ');
    const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
    await pool.query(`INSERT INTO ${table} (${cols}) VALUES (${placeholders})`, Object.values(data));
  }
}

main().catch((err) => {
  logger.error('[db] seed failed', err);
  process.exit(1);
});
