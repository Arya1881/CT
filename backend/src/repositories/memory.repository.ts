/**
 * In-memory repository — the default store used for the hackathon demo.
 * Boots instantly from the deterministic seed dataset with zero external
 * infrastructure, while honouring the same Repository contract as the
 * PostgreSQL implementation.
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
import type { SeedData } from '../models/types';
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

const clone = <T>(obj: T): T => (obj ? JSON.parse(JSON.stringify(obj)) : obj);

export function createMemoryRepository(seed: SeedData): Repository {
  const users: User[] = clone(seed.users);
  const students: Student[] = clone(seed.students);
  const parents: Parent[] = clone(seed.parents);
  const drivers: Driver[] = clone(seed.drivers);
  const buses: Bus[] = clone(seed.buses);
  const routes: Route[] = clone(seed.routes);
  const stops: Stop[] = clone(seed.stops);
  const studentBus: { studentId: string; busId: string; routeId: string }[] = clone(seed.studentBus);
  const trips: Trip[] = clone(seed.trips);
  const notifications: Notification[] = clone(seed.notifications);
  const alerts: EmergencyAlert[] = clone(seed.emergencyAlerts);
  const auditLogs: AuditLog[] = clone(seed.auditLogs);
  const settings = new Map<string, string>();

  const latestLocation = new Map<string, LiveLocation>();
  const locationHistory: LiveLocation[] = [];
  for (const loc of seed.liveLocations) latestLocation.set(loc.busId, clone(loc));

  const eq = (a: string | undefined, b: string | undefined) => !!a && !!b && a === b;
  const matches = (needle: string, ...haystack: Array<string | undefined>) =>
    haystack.some((h) => h?.toLowerCase().includes(needle));

  const repo: Repository = {
    async init() {
      /* nothing to prepare for the in-memory store */
    },

    /* Users ---------------------------------------------------------------- */
    async findUserByEmail(email) {
      return clone(users.find((u) => u.email.toLowerCase() === email.toLowerCase()) ?? null);
    },
    async findUserById(id) {
      return clone(users.find((u) => u.id === id) ?? null);
    },
    async createUser(user) {
      users.push(user);
      return clone(user);
    },
    async updateUser(id, patch) {
      const idx = users.findIndex((u) => u.id === id);
      if (idx < 0) throw new Error('User not found');
      users[idx] = { ...users[idx], ...patch };
      return clone(users[idx]);
    },
    async listUsers(query) {
      let list = users;
      if (query.role) list = list.filter((u) => u.role === query.role);
      if (query.q) {
        const q = query.q.toLowerCase();
        list = list.filter((u) => u.email.toLowerCase().includes(q) || `${u.firstName} ${u.lastName}`.toLowerCase().includes(q));
      }
      list = [...list].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
      return { ...paginate(list.map(clone), query), data: paginate(list, query).data.map(clone) } as Page<User>;
    },

    /* Students -------------------------------------------------------------- */
    async listStudents(query) {
      let list = students;
      if (query.q) {
        const q = query.q.toLowerCase();
        list = list.filter(
          (s) => s.rollNumber.toLowerCase().includes(q) || s.department.toLowerCase().includes(q),
        );
      }
      if (query.department) list = list.filter((s) => s.department === query.department);
      if (query.busId) list = list.filter((s) => eq(s.busId, query.busId));
      if (query.parentId) list = list.filter((s) => eq(s.parentId, query.parentId));
      const paged = paginate(list, query);
      return { ...paged, data: paged.data.map(clone) };
    },
    async findStudentById(id) {
      return clone(students.find((s) => s.id === id) ?? null);
    },
    async findStudentByUserId(userId) {
      return clone(students.find((s) => s.userId === userId) ?? null);
    },
    async createStudent(student) {
      students.push(student);
      return clone(student);
    },
    async updateStudent(id, patch) {
      const idx = students.findIndex((s) => s.id === id);
      if (idx < 0) throw new Error('Student not found');
      students[idx] = { ...students[idx], ...patch };
      return clone(students[idx]);
    },
    async deleteStudent(id) {
      const idx = students.findIndex((s) => s.id === id);
      if (idx < 0) return;
      const [student] = students.splice(idx, 1);
      users.splice(users.findIndex((u) => u.id === student.userId), 1);
      for (let i = studentBus.length - 1; i >= 0; i--) if (studentBus[i].studentId === id) studentBus.splice(i, 1);
    },

    /* Parents --------------------------------------------------------------- */
    async findParentById(id) {
      return clone(parents.find((p) => p.id === id) ?? null);
    },
    async findParentByUserId(userId) {
      return clone(parents.find((p) => p.userId === userId) ?? null);
    },
    async listParents() {
      return clone(parents);
    },
    async createParent(parent) {
      parents.push(parent);
      return clone(parent);
    },
    async updateParent(id, patch) {
      const idx = parents.findIndex((p) => p.id === id);
      if (idx < 0) throw new Error('Parent not found');
      parents[idx] = { ...parents[idx], ...patch };
      return clone(parents[idx]);
    },
    async deleteParent(id) {
      const idx = parents.findIndex((p) => p.id === id);
      if (idx < 0) return;
      const [parent] = parents.splice(idx, 1);
      users.splice(users.findIndex((u) => u.id === parent.userId), 1);
      for (const s of students) if (s.parentId === id) s.parentId = undefined;
    },
    async childrenOfParent(parentId) {
      return clone(students.filter((s) => s.parentId === parentId));
    },

    /* Drivers --------------------------------------------------------------- */
    async listDrivers(query) {
      let list = drivers;
      if (query.q) {
        const q = query.q.toLowerCase();
        list = list.filter((d) => d.licenseNo.toLowerCase().includes(q) || d.id.includes(q));
      }
      if (query.status) list = list.filter((d) => d.status === query.status);
      const paged = paginate(list, query);
      return { ...paged, data: paged.data.map(clone) };
    },
    async findDriverById(id) {
      return clone(drivers.find((d) => d.id === id) ?? null);
    },
    async findDriverByUserId(userId) {
      return clone(drivers.find((d) => d.userId === userId) ?? null);
    },
    async createDriver(driver) {
      drivers.push(driver);
      return clone(driver);
    },
    async updateDriver(id, patch) {
      const idx = drivers.findIndex((d) => d.id === id);
      if (idx < 0) throw new Error('Driver not found');
      drivers[idx] = { ...drivers[idx], ...patch };
      return clone(drivers[idx]);
    },
    async deleteDriver(id) {
      const idx = drivers.findIndex((d) => d.id === id);
      if (idx < 0) return;
      const [driver] = drivers.splice(idx, 1);
      users.splice(users.findIndex((u) => u.id === driver.userId), 1);
      const bus = buses.find((b) => b.driverId === id);
      if (bus) {
        bus.driverId = undefined;
        bus.status = 'idle';
      }
    },

    /* Buses ----------------------------------------------------------------- */
    async listBuses(query) {
      let list = buses;
      if (query.q) {
        const q = query.q.toLowerCase();
        list = list.filter((b) => b.plateNumber.toLowerCase().includes(q) || b.model.toLowerCase().includes(q));
      }
      if (query.status) list = list.filter((b) => b.status === query.status);
      if (query.routeId) list = list.filter((b) => eq(b.routeId, query.routeId));
      const paged = paginate(list, query);
      return { ...paged, data: paged.data.map(clone) };
    },
    async findBusById(id) {
      return clone(buses.find((b) => b.id === id) ?? null);
    },
    async findBusByDriverId(driverId) {
      return clone(buses.find((b) => b.driverId === driverId) ?? null);
    },
    async createBus(bus) {
      buses.push(bus);
      return clone(bus);
    },
    async updateBus(id, patch) {
      const idx = buses.findIndex((b) => b.id === id);
      if (idx < 0) throw new Error('Bus not found');
      buses[idx] = { ...buses[idx], ...patch };
      return clone(buses[idx]);
    },
    async deleteBus(id) {
      const idx = buses.findIndex((b) => b.id === id);
      if (idx < 0) return;
      buses.splice(idx, 1);
      latestLocation.delete(id);
      for (const s of students) if (s.busId === id) s.busId = undefined;
      const drv = drivers.find((d) => d.busId === id);
      if (drv) drv.busId = undefined;
    },

    /* Routes ---------------------------------------------------------------- */
    async listRoutes(activeOnly) {
      let list = routes;
      if (activeOnly) list = list.filter((r) => r.active);
      return clone(list);
    },
    async findRouteById(id) {
      return clone(routes.find((r) => r.id === id) ?? null);
    },
    async createRoute(route) {
      routes.push(route);
      return clone(route);
    },
    async updateRoute(id, patch) {
      const idx = routes.findIndex((r) => r.id === id);
      if (idx < 0) throw new Error('Route not found');
      routes[idx] = { ...routes[idx], ...patch };
      return clone(routes[idx]);
    },
    async deleteRoute(id) {
      const idx = routes.findIndex((r) => r.id === id);
      if (idx < 0) return;
      routes.splice(idx, 1);
      for (let i = stops.length - 1; i >= 0; i--) if (stops[i].routeId === id) stops.splice(i, 1);
      for (const b of buses) if (b.routeId === id) b.routeId = undefined;
    },

    /* Stops ----------------------------------------------------------------- */
    async listStops(routeId) {
      let list = stops;
      if (routeId) list = list.filter((s) => s.routeId === routeId);
      return clone([...list].sort((a, b) => a.orderIndex - b.orderIndex));
    },
    async findStopById(id) {
      return clone(stops.find((s) => s.id === id) ?? null);
    },
    async createStop(stop) {
      stops.push(stop);
      return clone(stop);
    },
    async updateStop(id, patch) {
      const idx = stops.findIndex((s) => s.id === id);
      if (idx < 0) throw new Error('Stop not found');
      stops[idx] = { ...stops[idx], ...patch };
      return clone(stops[idx]);
    },
    async deleteStop(id) {
      const idx = stops.findIndex((s) => s.id === id);
      if (idx < 0) return;
      stops.splice(idx, 1);
      for (const s of students) if (s.stopId === id) s.stopId = undefined;
    },

    /* Live tracking ---------------------------------------------------------- */
    async upsertLiveLocation(loc) {
      latestLocation.set(loc.busId, clone(loc));
      locationHistory.push(loc);
      if (locationHistory.length > 5000) locationHistory.splice(0, locationHistory.length - 5000);
      return clone(loc);
    },
    async latestLocations() {
      return [...latestLocation.values()].map(clone);
    },
    async busLocation(busId) {
      return clone(latestLocation.get(busId) ?? null);
    },
    async locationHistory(busId, limit = 50) {
      return clone(locationHistory.filter((l) => l.busId === busId).slice(-limit));
    },

    /* Trips ------------------------------------------------------------------ */
    async createTrip(trip) {
      trips.push(trip);
      return clone(trip);
    },
    async findTripById(id) {
      return clone(trips.find((t) => t.id === id) ?? null);
    },
    async updateTrip(id, patch) {
      const idx = trips.findIndex((t) => t.id === id);
      if (idx < 0) throw new Error('Trip not found');
      trips[idx] = { ...trips[idx], ...patch };
      return clone(trips[idx]);
    },
    async listTrips(query) {
      let list = allTripsFiltered(query);
      const paged = paginate(list, query);
      return { ...paged, data: paged.data.map(clone) };
    },
    async allTrips(filter) {
      return clone(allTripsFiltered(filter ?? {}));
    },
    async driverTrips(driverId, limit = 20) {
      return clone(trips.filter((t) => t.driverId === driverId).sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, limit));
    },
    async busTrips(busId, limit = 20) {
      return clone(trips.filter((t) => t.busId === busId).sort((a, b) => b.startedAt.localeCompare(a.startedAt)).slice(0, limit));
    },

    /* Notifications ------------------------------------------------------------ */
    async createNotification(n) {
      notifications.unshift(n);
      return clone(n);
    },
    async notificationsFor(userId, query) {
      let list = notifications.filter((n) => !n.userId || n.userId === userId);
      if (query.unreadOnly) list = list.filter((n) => !n.read);
      if (query.type) list = list.filter((n) => n.type === query.type);
      const paged = paginate(list, query);
      return { ...paged, data: paged.data.map(clone) };
    },
    async notificationsAll(query) {
      let list = notifications;
      if (query.unreadOnly) list = list.filter((n) => !n.read);
      if (query.type) list = list.filter((n) => n.type === query.type);
      const paged = paginate(list, query);
      return { ...paged, data: paged.data.map(clone) };
    },
    async markNotificationRead(id) {
      const n = notifications.find((n) => n.id === id);
      if (n) n.read = true;
    },
    async markAllNotificationsRead(userId) {
      for (const n of notifications) if (!n.userId || n.userId === userId) n.read = true;
    },
    async unreadCount(userId) {
      return notifications.filter((n) => (!n.userId || n.userId === userId) && !n.read).length;
    },

    /* Emergency ----------------------------------------------------------------- */
    async createAlert(alert) {
      alerts.unshift(alert);
      return clone(alert);
    },
    async listAlerts(query) {
      let list = alerts;
      if (query.status) list = list.filter((a) => a.status === query.status);
      if (query.type) list = list.filter((a) => a.type === query.type);
      const paged = paginate(list, query);
      return { ...paged, data: paged.data.map(clone) };
    },
    async findAlertById(id) {
      return clone(alerts.find((a) => a.id === id) ?? null);
    },
    async updateAlert(id, patch) {
      const idx = alerts.findIndex((a) => a.id === id);
      if (idx < 0) throw new Error('Alert not found');
      alerts[idx] = { ...alerts[idx], ...patch };
      return clone(alerts[idx]);
    },
    async openAlertCount() {
      return alerts.filter((a) => a.status !== 'resolved').length;
    },

    /* Audit ----------------------------------------------------------------------- */
    async createAuditLog(log) {
      auditLogs.unshift(log);
      return clone(log);
    },
    async auditLogs(limit = 100) {
      return clone(auditLogs.slice(0, limit));
    },

    /* Settings --------------------------------------------------------------------- */
    async getSetting(key) {
      return settings.get(key) ?? null;
    },
    async setSetting(key, value) {
      settings.set(key, value);
    },
  };

  function allTripsFiltered(filter: ListTripsQuery | { from?: string; to?: string }): Trip[] {
    let list = [...trips];
    if ('status' in filter && filter.status) list = list.filter((t) => t.status === filter.status);
    if ('busId' in filter && filter.busId) list = list.filter((t) => t.busId === filter.busId);
    if ('routeId' in filter && filter.routeId) list = list.filter((t) => t.routeId === filter.routeId);
    if ('driverId' in filter && filter.driverId) list = list.filter((t) => t.driverId === filter.driverId);
    if (filter.from) list = list.filter((t) => t.startedAt >= filter.from!);
    if (filter.to) list = list.filter((t) => t.startedAt <= filter.to!);
    return [...list].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  }

  return repo;
}
