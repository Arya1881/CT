/**
 * PostgreSQL repository — the production / Supabase-compatible data layer.
 *
 * Implements the exact same Repository contract as the in-memory store.
 * When DATABASE_URL is configured, the app runs entirely on Postgres;
 * otherwise it falls back to the in-memory demo store.
 */
import { Pool, type QueryResultRow } from 'pg';
import { config } from '../config';
import type {
  AuditLog,
  Bus,
  Driver,
  EmergencyAlert,
  LiveLocation,
  Notification,
  Parent,
  Route,
  Stop,
  Student,
  Trip,
  User,
} from '../models/types';
import { paginate, type Page } from '../utils/pagination';
import type {
  ListAlertsQuery,
  ListBusesQuery,
  ListDriversQuery,
  ListStudentsQuery,
  ListTripsQuery,
  ListUsersQuery,
  NotificationsQuery,
  Repository,
} from './index';

type FieldMap = Record<string, string>;

const iso = (v: Date | string | null | undefined): string | undefined =>
  v ? new Date(v).toISOString() : undefined;
const day = (v: Date | string | null | undefined): string | undefined =>
  v ? new Date(v).toISOString().slice(0, 10) : undefined;
const num = (v: unknown): number => (v === null || v === undefined ? 0 : Number(v));

const toPg = (v: unknown): unknown => {
  if (v === undefined) return v;
  if (v !== null && typeof v === 'object' && !Array.isArray(v)) return JSON.stringify(v);
  if (Array.isArray(v)) return JSON.stringify(v);
  return v;
};

/* --------------------------- column maps --------------------------- */

const USERS: FieldMap = {
  id: 'id', email: 'email', passwordHash: 'password_hash', firstName: 'first_name',
  lastName: 'last_name', role: 'role', phone: 'phone', avatarUrl: 'avatar_url',
  isActive: 'is_active', createdAt: 'created_at',
};
const STUDENTS: FieldMap = {
  id: 'id', userId: 'user_id', rollNumber: 'roll_number', department: 'department',
  year: 'year', busId: 'bus_id', stopId: 'stop_id', parentId: 'parent_id',
  emergencyContactName: 'emergency_contact_name', emergencyContactPhone: 'emergency_contact_phone', createdAt: 'created_at',
};
const PARENTS: FieldMap = { id: 'id', userId: 'user_id', childrenCount: 'children_count' };
const DRIVERS: FieldMap = {
  id: 'id', userId: 'user_id', licenseNo: 'license_no', phone: 'phone', busId: 'bus_id',
  status: 'status', hireDate: 'hire_date',
};
const BUSES: FieldMap = {
  id: 'id', plateNumber: 'plate_number', model: 'model', capacity: 'capacity', status: 'status',
  routeId: 'route_id', driverId: 'driver_id', fuelLevel: 'fuel_level',
  lastMaintenance: 'last_maintenance', currentLat: 'current_lat', currentLng: 'current_lng', createdAt: 'created_at',
};
const ROUTES: FieldMap = {
  id: 'id', name: 'name', description: 'description', origin: 'origin', destination: 'destination',
  distanceKm: 'distance_km', estimatedDurationMin: 'estimated_duration_min', color: 'color',
  waypoints: 'waypoints', active: 'active', createdAt: 'created_at',
};
const STOPS: FieldMap = {
  id: 'id', routeId: 'route_id', name: 'name', lat: 'lat', lng: 'lng',
  orderIndex: 'order_index', arrivalOffsetMin: 'arrival_offset_min', createdAt: 'created_at',
};
const TRIPS: FieldMap = {
  id: 'id', busId: 'bus_id', routeId: 'route_id', driverId: 'driver_id',
  startedAt: 'started_at', completedAt: 'completed_at', status: 'status',
  passengerCount: 'passenger_count', delayMinutes: 'delay_minutes', distanceKm: 'distance_km',
  startLat: 'start_lat', startLng: 'start_lng', endLat: 'end_lat', endLng: 'end_lng',
};
const NOTIFS: FieldMap = {
  id: 'id', userId: 'user_id', title: 'title', message: 'message', type: 'type',
  busId: 'bus_id', tripId: 'trip_id', read: 'read', createdAt: 'created_at',
};
const ALERTS: FieldMap = {
  id: 'id', userId: 'user_id', type: 'type', lat: 'lat', lng: 'lng', busId: 'bus_id',
  tripId: 'trip_id', description: 'description', status: 'status', resolvedAt: 'resolved_at', createdAt: 'created_at',
};
const AUDIT: FieldMap = {
  id: 'id', userId: 'user_id', action: 'action', entity: 'entity', entityId: 'entity_id',
  meta: 'meta', createdAt: 'created_at',
};
const LOCATIONS: FieldMap = {
  id: 'id', busId: 'bus_id', routeId: 'route_id', tripId: 'trip_id', lat: 'lat', lng: 'lng',
  speedKmh: 'speed_kmh', heading: 'heading', timestamp: 'timestamp',
};

/* ------------------------------ row mappers ------------------------------ */

type Row = QueryResultRow;
const mapUser = (r: Row): User => ({ ...r, createdAt: iso(r.createdAt), isActive: !!r.isActive }) as User;
const mapStudent = (r: Row): Student => ({ ...r, year: num(r.year), createdAt: iso(r.createdAt) }) as Student;
const mapParent = (r: Row): Parent => ({ ...r, childrenCount: num(r.childrenCount) }) as Parent;
const mapDriver = (r: Row): Driver => ({ ...r, hireDate: day(r.hire_date ?? r.hireDate) ?? '' }) as Driver;
const mapBus = (r: Row): Bus => ({
  ...r,
  capacity: num(r.capacity), fuelLevel: num(r.fuelLevel),
  lastMaintenance: day(r.last_maintenance ?? r.lastMaintenance) ?? '',
  currentLat: r.current_lat ?? r.currentLat ?? undefined,
  currentLng: r.current_lng ?? r.currentLng ?? undefined,
  createdAt: iso(r.createdAt),
}) as Bus;
const mapRoute = (r: Row): Route => ({
  ...r,
  distanceKm: num(r.distanceKm),
  estimatedDurationMin: num(r.estimatedDurationMin),
  waypoints: typeof r.waypoints === 'string' ? JSON.parse(r.waypoints) : r.waypoints,
  createdAt: iso(r.createdAt),
}) as Route;
const mapStop = (r: Row): Stop => ({ ...r, orderIndex: num(r.orderIndex), arrivalOffsetMin: num(r.arrivalOffsetMin), createdAt: iso(r.createdAt) }) as Stop;
const mapTrip = (r: Row): Trip => ({
  ...r,
  passengerCount: num(r.passengerCount), delayMinutes: num(r.delayMinutes), distanceKm: num(r.distanceKm),
  startedAt: iso(r.startedAt) ?? '', completedAt: iso(r.completedAt),
}) as Trip;
const mapNotification = (r: Row): Notification => ({ ...r, read: !!r.read, createdAt: iso(r.createdAt) }) as Notification;
const mapAlert = (r: Row): EmergencyAlert => ({ ...r, createdAt: iso(r.createdAt), resolvedAt: iso(r.resolvedAt) }) as EmergencyAlert;
const mapAudit = (r: Row): AuditLog => ({
  ...r, meta: typeof r.meta === 'string' ? JSON.parse(r.meta) : r.meta, createdAt: iso(r.createdAt),
}) as AuditLog;
const mapLocation = (r: Row): LiveLocation => ({ ...r, speedKmh: num(r.speedKmh), heading: num(r.heading), timestamp: iso(r.timestamp) ?? '' }) as LiveLocation;

/* ------------------------------ factory ------------------------------ */

export function createPostgresRepository(): Repository {
  const pool = new Pool({ connectionString: config.databaseUrl, max: 10 });

  const select = (table: string, fieldMap: FieldMap): string => {
    const cols = Object.entries(fieldMap)
      .map(([camel, snake]) => (camel === snake ? snake : `${snake} AS "${camel}"`))
      .join(', ');
    return `SELECT ${cols} FROM ${table}`;
  };

  async function updateRow(table: string, id: string, patch: Record<string, unknown>, fieldMap: FieldMap, mapper: (r: Row) => unknown, selectSql: string): Promise<unknown> {
    const entries = Object.entries(patch).filter(([k, v]) => fieldMap[k] !== undefined && v !== undefined);
    if (entries.length === 0) {
      const res = await pool.query(`${selectSql} WHERE id = $1`, [id]);
      return mapper(res.rows[0]);
    }
    const sets = entries.map(([k], i) => `${fieldMap[k]} = $${i + 1}`);
    const values = entries.map(([, v]) => toPg(v));
    const sql = `UPDATE ${table} SET ${sets.join(', ')} WHERE id = $${entries.length + 1} RETURNING *`;
    const res = await pool.query(sql, [...values, id]);
    return mapper(res.rows[0]);
  }

  async function insertRow(table: string, data: Record<string, unknown>, fieldMap: FieldMap, mapper: (r: Row) => unknown): Promise<unknown> {
    const cols = Object.keys(data).filter((k) => fieldMap[k] !== undefined && data[k] !== undefined);
    const sqlCols = cols.map((k) => fieldMap[k]).join(', ');
    const placeholders = cols.map((_, i) => `$${i + 1}`).join(', ');
    const values = cols.map((k) => toPg(data[k]));
    const res = await pool.query(`INSERT INTO ${table} (${sqlCols}) VALUES (${placeholders}) RETURNING *`, values);
    return mapper(res.rows[0]);
  }

  async function notificationQuery(cond: string, base: unknown[], query: NotificationsQuery) {
    const where: string[] = [cond];
    const params = [...base];
    if (query.unreadOnly) where.push('read = FALSE');
    if (query.type) { params.push(query.type); where.push(`type = $${params.length}`); }
    const total = (await pool.query(`SELECT count(*)::int AS c FROM notifications WHERE ${where.join(' AND ')}`, params)).rows[0].c as number;
    params.push(query.pageSize, (query.page - 1) * query.pageSize);
    const res = await pool.query(
      `${select('notifications', NOTIFS)} WHERE ${where.join(' AND ')} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params,
    );
    return paginate(res.rows.map(mapNotification), query);
  }

  const repo: Repository = {
    async init() {
      await pool.query('SELECT 1');
    },

    /* Users ---------------------------------------------------------------- */
    async findUserByEmail(email) {
      const res = await pool.query(`${select('users', USERS)} WHERE lower(email) = lower($1)`, [email]);
      return (res.rows[0] && mapUser(res.rows[0])) || null;
    },
    async findUserById(id) {
      const res = await pool.query(`${select('users', USERS)} WHERE id = $1`, [id]);
      return (res.rows[0] && mapUser(res.rows[0])) || null;
    },
    async createUser(user) {
      return (await insertRow('users', user as unknown as unknown as Record<string, unknown>, USERS, mapUser)) as User;
    },
    async updateUser(id, patch) {
      return (await updateRow('users', id, patch as unknown as unknown as Record<string, unknown>, USERS, mapUser, select('users', USERS))) as User;
    },
    async listUsers(query) {
      const where: string[] = [];
      const params: unknown[] = [];
      if (query.role) { params.push(query.role); where.push(`role = $${params.length}`); }
      if (query.q) { params.push(`%${query.q}%`); where.push(`(lower(email) LIKE lower($${params.length}) OR lower(first_name || ' ' || last_name) LIKE lower($${params.length}))`); }
      const cond = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const total = (await pool.query(`SELECT count(*)::int AS c FROM users ${cond}`, params)).rows[0].c as number;
      params.push(query.pageSize, (query.page - 1) * query.pageSize);
      const res = await pool.query(`${select('users', USERS)} ${cond} ORDER BY created_at ASC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
      return paginate(res.rows.map(mapUser), query) as Page<User> & { data: User[] };
    },

    /* Students -------------------------------------------------------------- */
    async listStudents(query) {
      const where: string[] = [];
      const params: unknown[] = [];
      if (query.q) { params.push(`%${query.q}%`); where.push(`(lower(roll_number) LIKE lower($${params.length}) OR lower(department) LIKE lower($${params.length}))`); }
      if (query.department) { params.push(query.department); where.push(`department = $${params.length}`); }
      if (query.busId) { params.push(query.busId); where.push(`bus_id = $${params.length}`); }
      if (query.parentId) { params.push(query.parentId); where.push(`parent_id = $${params.length}`); }
      const cond = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const total = (await pool.query(`SELECT count(*)::int AS c FROM students ${cond}`, params)).rows[0].c as number;
      params.push(query.pageSize, (query.page - 1) * query.pageSize);
      const res = await pool.query(`${select('students', STUDENTS)} ${cond} ORDER BY roll_number LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
      return paginate(res.rows.map(mapStudent), query);
    },
    async findStudentById(id) {
      const res = await pool.query(`${select('students', STUDENTS)} WHERE id = $1`, [id]);
      return (res.rows[0] && mapStudent(res.rows[0])) || null;
    },
    async findStudentByUserId(userId) {
      const res = await pool.query(`${select('students', STUDENTS)} WHERE user_id = $1`, [userId]);
      return (res.rows[0] && mapStudent(res.rows[0])) || null;
    },
    async createStudent(student) {
      return (await insertRow('students', student as unknown as Record<string, unknown>, STUDENTS, mapStudent)) as Student;
    },
    async updateStudent(id, patch) {
      return (await updateRow('students', id, patch as unknown as Record<string, unknown>, STUDENTS, mapStudent, select('students', STUDENTS))) as Student;
    },
    async deleteStudent(id) {
      const st = await repo.findStudentById(id);
      await pool.query('DELETE FROM students WHERE id = $1', [id]);
      if (st) await pool.query('DELETE FROM users WHERE id = $1', [st.userId]);
    },

    /* Parents --------------------------------------------------------------- */
    async findParentById(id) {
      const res = await pool.query(`${select('parents', PARENTS)} WHERE id = $1`, [id]);
      return (res.rows[0] && mapParent(res.rows[0])) || null;
    },
    async findParentByUserId(userId) {
      const res = await pool.query(`${select('parents', PARENTS)} WHERE user_id = $1`, [userId]);
      return (res.rows[0] && mapParent(res.rows[0])) || null;
    },
    async listParents() {
      const res = await pool.query(`${select('parents', PARENTS)} ORDER BY created_at ASC`);
      return res.rows.map(mapParent);
    },
    async createParent(parent) {
      return (await insertRow('parents', parent as unknown as Record<string, unknown>, PARENTS, mapParent)) as Parent;
    },
    async updateParent(id, patch) {
      return (await updateRow('parents', id, patch as unknown as Record<string, unknown>, PARENTS, mapParent, select('parents', PARENTS))) as Parent;
    },
    async deleteParent(id) {
      const p = await repo.findParentById(id);
      await pool.query("UPDATE students SET parent_id = NULL WHERE parent_id = $1", [id]);
      await pool.query('DELETE FROM parents WHERE id = $1', [id]);
      if (p) await pool.query('DELETE FROM users WHERE id = $1', [p.userId]);
    },
    async childrenOfParent(parentId) {
      const res = await pool.query(`${select('students', STUDENTS)} WHERE parent_id = $1`, [parentId]);
      return res.rows.map(mapStudent);
    },

    /* Drivers --------------------------------------------------------------- */
    async listDrivers(query) {
      const where: string[] = [];
      const params: unknown[] = [];
      if (query.q) { params.push(`%${query.q}%`); where.push(`(lower(license_no) LIKE lower($${params.length}))`); }
      if (query.status) { params.push(query.status); where.push(`status = $${params.length}`); }
      const cond = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const total = (await pool.query(`SELECT count(*)::int AS c FROM drivers ${cond}`, params)).rows[0].c as number;
      params.push(query.pageSize, (query.page - 1) * query.pageSize);
      const res = await pool.query(`${select('drivers', DRIVERS)} ${cond} ORDER BY hire_date DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
      return paginate(res.rows.map(mapDriver), query);
    },
    async findDriverById(id) {
      const res = await pool.query(`${select('drivers', DRIVERS)} WHERE id = $1`, [id]);
      return (res.rows[0] && mapDriver(res.rows[0])) || null;
    },
    async findDriverByUserId(userId) {
      const res = await pool.query(`${select('drivers', DRIVERS)} WHERE user_id = $1`, [userId]);
      return (res.rows[0] && mapDriver(res.rows[0])) || null;
    },
    async createDriver(driver) {
      return (await insertRow('drivers', driver as unknown as Record<string, unknown>, DRIVERS, mapDriver)) as Driver;
    },
    async updateDriver(id, patch) {
      return (await updateRow('drivers', id, patch as unknown as Record<string, unknown>, DRIVERS, mapDriver, select('drivers', DRIVERS))) as Driver;
    },
    async deleteDriver(id) {
      const d = await repo.findDriverById(id);
      await pool.query('UPDATE buses SET driver_id = NULL, status = \'idle\' WHERE driver_id = $1', [id]);
      await pool.query('DELETE FROM drivers WHERE id = $1', [id]);
      if (d) await pool.query('DELETE FROM users WHERE id = $1', [d.userId]);
    },

    /* Buses ----------------------------------------------------------------- */
    async listBuses(query) {
      const where: string[] = [];
      const params: unknown[] = [];
      if (query.q) { params.push(`%${query.q}%`); where.push(`(lower(plate_number) LIKE lower($${params.length}) OR lower(model) LIKE lower($${params.length}))`); }
      if (query.status) { params.push(query.status); where.push(`status = $${params.length}`); }
      if (query.routeId) { params.push(query.routeId); where.push(`route_id = $${params.length}`); }
      const cond = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const total = (await pool.query(`SELECT count(*)::int AS c FROM buses ${cond}`, params)).rows[0].c as number;
      params.push(query.pageSize, (query.page - 1) * query.pageSize);
      const res = await pool.query(`${select('buses', BUSES)} ${cond} ORDER BY plate_number LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
      return paginate(res.rows.map(mapBus), query);
    },
    async findBusById(id) {
      const res = await pool.query(`${select('buses', BUSES)} WHERE id = $1`, [id]);
      return (res.rows[0] && mapBus(res.rows[0])) || null;
    },
    async findBusByDriverId(driverId) {
      const res = await pool.query(`${select('buses', BUSES)} WHERE driver_id = $1`, [driverId]);
      return (res.rows[0] && mapBus(res.rows[0])) || null;
    },
    async createBus(bus) {
      return (await insertRow('buses', bus as unknown as Record<string, unknown>, BUSES, mapBus)) as Bus;
    },
    async updateBus(id, patch) {
      return (await updateRow('buses', id, patch as unknown as Record<string, unknown>, BUSES, mapBus, select('buses', BUSES))) as Bus;
    },
    async deleteBus(id) {
      await pool.query('UPDATE students SET bus_id = NULL WHERE bus_id = $1', [id]);
      await pool.query('UPDATE drivers SET bus_id = NULL WHERE bus_id = $1', [id]);
      await pool.query('DELETE FROM live_locations WHERE bus_id = $1', [id]);
      await pool.query('DELETE FROM buses WHERE id = $1', [id]);
    },

    /* Routes ---------------------------------------------------------------- */
    async listRoutes(activeOnly) {
      const res = await pool.query(
        `${select('routes', ROUTES)}${activeOnly ? ' WHERE active = TRUE' : ''} ORDER BY name`,
      );
      return res.rows.map(mapRoute);
    },
    async findRouteById(id) {
      const res = await pool.query(`${select('routes', ROUTES)} WHERE id = $1`, [id]);
      return (res.rows[0] && mapRoute(res.rows[0])) || null;
    },
    async createRoute(route) {
      return (await insertRow('routes', { ...route, waypoints: JSON.stringify(route.waypoints) }, ROUTES, mapRoute)) as Route;
    },
    async updateRoute(id, patch) {
      const mapped = { ...patch, waypoints: patch.waypoints ? JSON.stringify(patch.waypoints) : patch.waypoints };
      return (await updateRow('routes', id, mapped as unknown as Record<string, unknown>, ROUTES, mapRoute, select('routes', ROUTES))) as Route;
    },
    async deleteRoute(id) {
      await pool.query('DELETE FROM routes WHERE id = $1', [id]);
    },

    /* Stops ----------------------------------------------------------------- */
    async listStops(routeId) {
      const res = await pool.query(
        `${select('stops', STOPS)}${routeId ? ' WHERE route_id = $1' : ''} ORDER BY order_index ASC`,
        routeId ? [routeId] : [],
      );
      return res.rows.map(mapStop);
    },
    async findStopById(id) {
      const res = await pool.query(`${select('stops', STOPS)} WHERE id = $1`, [id]);
      return (res.rows[0] && mapStop(res.rows[0])) || null;
    },
    async createStop(stop) {
      return (await insertRow('stops', stop as unknown as Record<string, unknown>, STOPS, mapStop)) as Stop;
    },
    async updateStop(id, patch) {
      return (await updateRow('stops', id, patch as unknown as Record<string, unknown>, STOPS, mapStop, select('stops', STOPS))) as Stop;
    },
    async deleteStop(id) {
      await pool.query('UPDATE students SET stop_id = NULL WHERE stop_id = $1', [id]);
      await pool.query('DELETE FROM stops WHERE id = $1', [id]);
    },

    /* Live tracking ---------------------------------------------------------- */
    async upsertLiveLocation(loc) {
      const data = { ...loc, speedKmh: loc.speedKmh, heading: loc.heading };
      const res = await pool.query(
        `INSERT INTO live_locations (bus_id, route_id, trip_id, lat, lng, speed_kmh, heading, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (bus_id) DO UPDATE SET route_id = EXCLUDED.route_id, trip_id = EXCLUDED.trip_id,
           lat = EXCLUDED.lat, lng = EXCLUDED.lng, speed_kmh = EXCLUDED.speed_kmh, heading = EXCLUDED.heading,
           timestamp = EXCLUDED.timestamp
         RETURNING *`,
        [data.busId, data.routeId ?? null, data.tripId ?? null, data.lat, data.lng, data.speedKmh, data.heading, data.timestamp],
      );
      await pool.query(
        `INSERT INTO bus_positions (bus_id, route_id, trip_id, lat, lng, speed_kmh, heading, timestamp)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [data.busId, data.routeId ?? null, data.tripId ?? null, data.lat, data.lng, data.speedKmh, data.heading, data.timestamp],
      );
      return mapLocation(res.rows[0]);
    },
    async latestLocations() {
      const res = await pool.query(`${select('live_locations', LOCATIONS)}`);
      return res.rows.map(mapLocation);
    },
    async busLocation(busId) {
      const res = await pool.query(`${select('live_locations', LOCATIONS)} WHERE bus_id = $1`, [busId]);
      return (res.rows[0] && mapLocation(res.rows[0])) || null;
    },
    async locationHistory(busId, limit = 50) {
      const res = await pool.query(
        `${select('bus_positions', LOCATIONS)} WHERE bus_id = $1 ORDER BY timestamp DESC LIMIT $2`,
        [busId, limit],
      );
      return res.rows.map(mapLocation).reverse();
    },

    /* Trips ------------------------------------------------------------------ */
    async createTrip(trip) {
      return (await insertRow('trips', trip as unknown as Record<string, unknown>, TRIPS, mapTrip)) as Trip;
    },
    async findTripById(id) {
      const res = await pool.query(`${select('trips', TRIPS)} WHERE id = $1`, [id]);
      return (res.rows[0] && mapTrip(res.rows[0])) || null;
    },
    async updateTrip(id, patch) {
      return (await updateRow('trips', id, patch as unknown as Record<string, unknown>, TRIPS, mapTrip, select('trips', TRIPS))) as Trip;
    },
    async listTrips(query) {
      const where: string[] = [];
      const params: unknown[] = [];
      if (query.status) { params.push(query.status); where.push(`status = $${params.length}`); }
      if (query.busId) { params.push(query.busId); where.push(`bus_id = $${params.length}`); }
      if (query.routeId) { params.push(query.routeId); where.push(`route_id = $${params.length}`); }
      if (query.driverId) { params.push(query.driverId); where.push(`driver_id = $${params.length}`); }
      if (query.from) { params.push(query.from); where.push(`started_at >= $${params.length}`); }
      if (query.to) { params.push(query.to); where.push(`started_at <= $${params.length}`); }
      const cond = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const total = (await pool.query(`SELECT count(*)::int AS c FROM trips ${cond}`, params)).rows[0].c as number;
      params.push(query.pageSize, (query.page - 1) * query.pageSize);
      const res = await pool.query(`${select('trips', TRIPS)} ${cond} ORDER BY started_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
      return paginate(res.rows.map(mapTrip), query);
    },
    async allTrips(filter) {
      const where: string[] = [];
      const params: unknown[] = [];
      if (!filter) filter = {};
      if (filter.status) { params.push(filter.status); where.push(`status = $${params.length}`); }
      if (filter.busId) { params.push(filter.busId); where.push(`bus_id = $${params.length}`); }
      if (filter.routeId) { params.push(filter.routeId); where.push(`route_id = $${params.length}`); }
      if (filter.driverId) { params.push(filter.driverId); where.push(`driver_id = $${params.length}`); }
      if (filter.from) { params.push(filter.from); where.push(`started_at >= $${params.length}`); }
      if (filter.to) { params.push(filter.to); where.push(`started_at <= $${params.length}`); }
      const cond = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const res = await pool.query(`${select('trips', TRIPS)} ${cond} ORDER BY started_at DESC LIMIT 20000`, params);
      return res.rows.map(mapTrip);
    },
    async driverTrips(driverId, limit = 20) {
      const res = await pool.query(`${select('trips', TRIPS)} WHERE driver_id = $1 ORDER BY started_at DESC LIMIT $2`, [driverId, limit]);
      return res.rows.map(mapTrip);
    },
    async busTrips(busId, limit = 20) {
      const res = await pool.query(`${select('trips', TRIPS)} WHERE bus_id = $1 ORDER BY started_at DESC LIMIT $2`, [busId, limit]);
      return res.rows.map(mapTrip);
    },

    /* Notifications ------------------------------------------------------------ */
    async createNotification(n) {
      return (await insertRow('notifications', n as unknown as Record<string, unknown>, NOTIFS, mapNotification)) as Notification;
    },
    async notificationsFor(userId, query) {
      return notificationQuery(`(user_id = $1 OR user_id IS NULL)`, [userId], query);
    },
    async notificationsAll(query) {
      return notificationQuery('TRUE', [], query);
    },
    async markNotificationRead(id) {
      await pool.query('UPDATE notifications SET read = TRUE WHERE id = $1', [id]);
    },
    async markAllNotificationsRead(userId) {
      await pool.query('UPDATE notifications SET read = TRUE WHERE user_id = $1 OR user_id IS NULL', [userId]);
    },
    async unreadCount(userId) {
      const res = await pool.query(
        'SELECT count(*)::int AS c FROM notifications WHERE (user_id = $1 OR user_id IS NULL) AND read = FALSE',
        [userId],
      );
      return res.rows[0].c as number;
    },

    /* Emergency ----------------------------------------------------------------- */
    async createAlert(alert) {
      return (await insertRow('emergency_alerts', alert as unknown as Record<string, unknown>, ALERTS, mapAlert)) as EmergencyAlert;
    },
    async listAlerts(query) {
      const where: string[] = [];
      const params: unknown[] = [];
      if (query.status) { params.push(query.status); where.push(`status = $${params.length}`); }
      if (query.type) { params.push(query.type); where.push(`type = $${params.length}`); }
      const cond = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const total = (await pool.query(`SELECT count(*)::int AS c FROM emergency_alerts ${cond}`, params)).rows[0].c as number;
      params.push(query.pageSize, (query.page - 1) * query.pageSize);
      const res = await pool.query(`${select('emergency_alerts', ALERTS)} ${cond} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`, params);
      return paginate(res.rows.map(mapAlert), query);
    },
    async findAlertById(id) {
      const res = await pool.query(`${select('emergency_alerts', ALERTS)} WHERE id = $1`, [id]);
      return (res.rows[0] && mapAlert(res.rows[0])) || null;
    },
    async updateAlert(id, patch) {
      return (await updateRow('emergency_alerts', id, patch as unknown as Record<string, unknown>, ALERTS, mapAlert, select('emergency_alerts', ALERTS))) as EmergencyAlert;
    },
    async openAlertCount() {
      const res = await pool.query("SELECT count(*)::int AS c FROM emergency_alerts WHERE status <> 'resolved'");
      return res.rows[0].c as number;
    },

    /* Audit ----------------------------------------------------------------------- */
    async createAuditLog(log) {
      return (await insertRow('audit_logs', { ...log, meta: JSON.stringify(log.meta) }, AUDIT, mapAudit)) as AuditLog;
    },
    async auditLogs(limit = 100) {
      const res = await pool.query(`${select('audit_logs', AUDIT)} ORDER BY created_at DESC LIMIT $1`, [limit]);
      return res.rows.map(mapAudit);
    },

    /* Settings --------------------------------------------------------------------- */
    async getSetting(key) {
      const res = await pool.query('SELECT value FROM app_settings WHERE key = $1', [key]);
      return res.rows[0]?.value ?? null;
    },
    async setSetting(key, value) {
      await pool.query(
        'INSERT INTO app_settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value',
        [key, value],
      );
    },
  };

  return repo;
}
