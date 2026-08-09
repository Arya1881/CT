/**
 * Repository contract.
 *
 * Services depend only on this interface, so the data layer can be swapped
 * between the built-in in-memory store (demo) and PostgreSQL (production /
 * Supabase) without touching business logic. The same seam later allows real
 * GPS devices to write live locations without changes elsewhere.
 */
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
import type { Page, Pagination } from '../utils/pagination';

/* ------------------------------ Query DTOs ----------------------------- */

export interface ListStudentsQuery extends Pagination {
  q?: string;
  department?: string;
  busId?: string;
  parentId?: string;
}

export interface ListBusesQuery extends Pagination {
  q?: string;
  status?: string;
  routeId?: string;
}

export interface ListDriversQuery extends Pagination {
  q?: string;
  status?: string;
}

export interface ListTripsQuery extends Pagination {
  status?: string;
  busId?: string;
  routeId?: string;
  driverId?: string;
  from?: string;
  to?: string;
}

export interface ListUsersQuery extends Pagination {
  role?: string;
  q?: string;
}

export interface ListAlertsQuery extends Pagination {
  status?: string;
  type?: string;
}

export interface NotificationsQuery extends Pagination {
  unreadOnly?: boolean;
  type?: string;
}

/* ------------------------------- Interface ----------------------------- */

export interface Repository {
  /** Prepare the underlying store (open pool / ingest seed). */
  init(): Promise<void>;

  /* Users --------------------------------------------------------------- */
  findUserByEmail(email: string): Promise<User | null>;
  findUserById(id: string): Promise<User | null>;
  createUser(user: User): Promise<User>;
  updateUser(id: string, patch: Partial<User>): Promise<User>;
  listUsers(query: ListUsersQuery): Promise<Page<User>>;

  /* Students ------------------------------------------------------------- */
  listStudents(query: ListStudentsQuery): Promise<Page<Student>>;
  findStudentById(id: string): Promise<Student | null>;
  findStudentByUserId(userId: string): Promise<Student | null>;
  createStudent(student: Student): Promise<Student>;
  updateStudent(id: string, patch: Partial<Student>): Promise<Student>;
  deleteStudent(id: string): Promise<void>;

  /* Parents -------------------------------------------------------------- */
  findParentById(id: string): Promise<Parent | null>;
  findParentByUserId(userId: string): Promise<Parent | null>;
  listParents(): Promise<Parent[]>;
  createParent(parent: Parent): Promise<Parent>;
  updateParent(id: string, patch: Partial<Parent>): Promise<Parent>;
  deleteParent(id: string): Promise<void>;
  childrenOfParent(parentId: string): Promise<Student[]>;

  /* Drivers -------------------------------------------------------------- */
  listDrivers(query: ListDriversQuery): Promise<Page<Driver>>;
  findDriverById(id: string): Promise<Driver | null>;
  findDriverByUserId(userId: string): Promise<Driver | null>;
  createDriver(driver: Driver): Promise<Driver>;
  updateDriver(id: string, patch: Partial<Driver>): Promise<Driver>;
  deleteDriver(id: string): Promise<void>;

  /* Buses ---------------------------------------------------------------- */
  listBuses(query: ListBusesQuery): Promise<Page<Bus>>;
  findBusById(id: string): Promise<Bus | null>;
  findBusByDriverId(driverId: string): Promise<Bus | null>;
  createBus(bus: Bus): Promise<Bus>;
  updateBus(id: string, patch: Partial<Bus>): Promise<Bus>;
  deleteBus(id: string): Promise<void>;

  /* Routes --------------------------------------------------------------- */
  listRoutes(activeOnly?: boolean): Promise<Route[]>;
  findRouteById(id: string): Promise<Route | null>;
  createRoute(route: Route): Promise<Route>;
  updateRoute(id: string, patch: Partial<Route>): Promise<Route>;
  deleteRoute(id: string): Promise<void>;

  /* Stops ---------------------------------------------------------------- */
  listStops(routeId?: string): Promise<Stop[]>;
  findStopById(id: string): Promise<Stop | null>;
  createStop(stop: Stop): Promise<Stop>;
  updateStop(id: string, patch: Partial<Stop>): Promise<Stop>;
  deleteStop(id: string): Promise<void>;

  /* Live tracking -------------------------------------------------------- */
  upsertLiveLocation(loc: LiveLocation): Promise<LiveLocation>;
  latestLocations(): Promise<LiveLocation[]>;
  busLocation(busId: string): Promise<LiveLocation | null>;
  locationHistory(busId: string, limit?: number): Promise<LiveLocation[]>;

  /* Trips ---------------------------------------------------------------- */
  createTrip(trip: Trip): Promise<Trip>;
  findTripById(id: string): Promise<Trip | null>;
  updateTrip(id: string, patch: Partial<Trip>): Promise<Trip>;
  listTrips(query: ListTripsQuery): Promise<Page<Trip>>;
  allTrips(filter?: Partial<Trip> & { from?: string; to?: string }): Promise<Trip[]>;
  driverTrips(driverId: string, limit?: number): Promise<Trip[]>;
  busTrips(busId: string, limit?: number): Promise<Trip[]>;

  /* Notifications -------------------------------------------------------- */
  createNotification(n: Notification): Promise<Notification>;
  notificationsFor(userId: string, query: NotificationsQuery): Promise<Page<Notification>>;
  notificationsAll(query: NotificationsQuery): Promise<Page<Notification>>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(userId: string): Promise<void>;
  unreadCount(userId: string): Promise<number>;

  /* Emergency ------------------------------------------------------------ */
  createAlert(alert: EmergencyAlert): Promise<EmergencyAlert>;
  listAlerts(query: ListAlertsQuery): Promise<Page<EmergencyAlert>>;
  findAlertById(id: string): Promise<EmergencyAlert | null>;
  updateAlert(id: string, patch: Partial<EmergencyAlert>): Promise<EmergencyAlert>;
  openAlertCount(): Promise<number>;

  /* Audit ---------------------------------------------------------------- */
  createAuditLog(log: AuditLog): Promise<AuditLog>;
  auditLogs(limit?: number): Promise<AuditLog[]>;

  /* Settings ------------------------------------------------------------- */
  getSetting(key: string): Promise<string | null>;
  setSetting(key: string, value: string): Promise<void>;
}
