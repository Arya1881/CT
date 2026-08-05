import type { Driver, Trip } from '../models/types';
import type { Repository } from '../repositories';
import { badRequest } from '../utils/errors';
import type { Page } from '../utils/pagination';

export type ReportRange = 'daily' | 'weekly' | 'monthly';

export interface Overview {
  fleet: { total: number; running: number; idle: number; maintenance: number; delayed: number };
  students: number;
  drivers: number;
  driversOnDuty: number;
  activeTrips: number;
  tripsToday: number;
  delayedToday: number;
  openAlerts: number;
  onTimeRate: number;
  totalTrips30d: number;
  totalDistance30d: number;
  avgPassengers: number;
}

export interface SeriesPoint {
  label: string;
  trips: number;
  completed: number;
  delayed: number;
  avgDelay: number;
}

export class AnalyticsService {
  constructor(private readonly repo: Repository) {}

  async overview(): Promise<Overview> {
    const [buses, students, drivers, trips, openAlerts] = await Promise.all([
      this.repo.listBuses({ page: 1, pageSize: 200 }),
      this.repo.listStudents({ page: 1, pageSize: 500 }),
      this.repo.listDrivers({ page: 1, pageSize: 200 }),
      this.repo.allTrips({ from: new Date(Date.now() - 30 * 864e5).toISOString() }),
      this.repo.openAlertCount(),
    ]);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayTrips = trips.filter((t) => new Date(t.startedAt) >= today);
    const weekTrips = trips.filter((t) => Date.now() - new Date(t.startedAt).getTime() <= 7 * 864e5);

    const fleet = {
      total: buses.data.length,
      running: buses.data.filter((b) => b.status === 'running').length,
      idle: buses.data.filter((b) => b.status === 'idle').length,
      maintenance: buses.data.filter((b) => b.status === 'maintenance').length,
      delayed: buses.data.filter((b) => b.status === 'delayed').length,
    };

    const completed = trips.filter((t) => t.status === 'completed');
    const onTime = completed.filter((t) => t.delayMinutes === 0).length;

    return {
      fleet,
      students: students.data.length,
      drivers: drivers.data.length,
      driversOnDuty: drivers.data.filter((d) => d.status === 'on_duty').length,
      activeTrips: trips.filter((t) => t.status === 'active').length,
      tripsToday: todayTrips.length,
      delayedToday: todayTrips.filter((t) => t.delayMinutes > 0).length,
      openAlerts,
      onTimeRate: completed.length ? Math.round((onTime / completed.length) * 100) : 100,
      totalTrips30d: trips.length,
      totalDistance30d: Math.round(trips.reduce((s, t) => s + t.distanceKm, 0) * 10) / 10,
      avgPassengers: completed.length
        ? Math.round((completed.reduce((s, t) => s + t.passengerCount, 0) / completed.length) * 10) / 10
        : 0,
    };
  }

  async tripSeries(range: ReportRange): Promise<SeriesPoint[]> {
    const trips = await this.repo.allTrips({ from: new Date(Date.now() - 200 * 864e5).toISOString() });

    if (range === 'daily') {
      return buildSeries(trips, 14, 'day');
    }
    if (range === 'weekly') {
      return buildSeries(trips, 8, 'week');
    }
    return buildSeries(trips, 6, 'month');
  }

  async driverPerformance(): Promise<Array<Record<string, unknown>>> {
    const [drivers, users] = await Promise.all([
      this.repo.listDrivers({ page: 1, pageSize: 200 }),
      this.repo.listUsers({ page: 1, pageSize: 500 }),
    ]);
    const nameById = new Map(users.data.map((u) => [u.id, `${u.firstName} ${u.lastName}`]));
    const rows: Array<Record<string, unknown>> = [];
    for (const d of drivers.data) {
      const trips = await this.repo.allTrips({ driverId: d.id });
      const completed = trips.filter((t) => t.status === 'completed');
      const onTime = completed.filter((t) => t.delayMinutes === 0).length;
      const avgDelay = completed.length ? Math.round(completed.reduce((s, t) => s + t.delayMinutes, 0) / completed.length) : 0;
      rows.push({
        driverId: d.id,
        name: nameById.get(d.userId) ?? 'Unknown',
        licenseNo: d.licenseNo,
        status: d.status,
        trips: trips.length,
        completed: completed.length,
        onTimeRate: completed.length ? Math.round((onTime / completed.length) * 100) : 100,
        avgDelayMinutes: avgDelay,
        totalKm: Math.round(completed.reduce((s, t) => s + t.distanceKm, 0)),
        passengers: completed.reduce((s, t) => s + t.passengerCount, 0),
      });
    }
    return rows.sort((a, b) => Number(b.completed) - Number(a.completed));
  }

  async busUtilization(): Promise<Array<Record<string, unknown>>> {
    const [buses, routes] = await Promise.all([
      this.repo.listBuses({ page: 1, pageSize: 200 }),
      this.repo.listRoutes(),
    ]);
    const routeName = new Map(routes.map((r) => [r.id, r.name]));
    const rows: Array<Record<string, unknown>> = [];
    for (const bus of buses.data) {
      const trips = await this.repo.allTrips({ busId: bus.id });
      const completed = trips.filter((t) => t.status === 'completed');
      const hours = completed.reduce((s, t) => s + hoursBetween(t), 0);
      const fill = completed.length
        ? Math.round((completed.reduce((s, t) => s + t.passengerCount, 0) / completed.length / bus.capacity) * 100)
        : 0;
      rows.push({
        busId: bus.id,
        plateNumber: bus.plateNumber,
        model: bus.model,
        capacity: bus.capacity,
        route: bus.routeId ? routeName.get(bus.routeId) ?? '—' : 'Unassigned',
        status: bus.status,
        trips: trips.length,
        hours: Math.round(hours * 10) / 10,
        avgFillPct: fill,
        fuelLevel: bus.fuelLevel,
      });
    }
    return rows;
  }

  async studentUsage(): Promise<Array<Record<string, unknown>>> {
    const [routes, students, trips, busPage] = await Promise.all([
      this.repo.listRoutes(),
      this.repo.listStudents({ page: 1, pageSize: 500 }),
      this.repo.allTrips({}),
      this.repo.listBuses({ page: 1, pageSize: 200 }),
    ]);
    const busOfRoute = new Map<string, string>();
    for (const b of busPage.data) if (b.routeId) busOfRoute.set(b.routeId, b.id);

    const routeTrips = new Map<string, Trip[]>();
    for (const t of trips) {
      const arr = routeTrips.get(t.routeId) ?? [];
      arr.push(t);
      routeTrips.set(t.routeId, arr);
    }
    return routes.map((r) => {
      const rt = routeTrips.get(r.id) ?? [];
      const busId = busOfRoute.get(r.id);
      const routeStudents = busId ? students.data.filter((s) => s.busId === busId).length : 0;
      return {
        routeId: r.id,
        route: r.name,
        color: r.color,
        distanceKm: r.distanceKm,
        trips: rt.length,
        students: routeStudents,
        avgPassengers: rt.length ? Math.round(rt.reduce((s, t) => s + t.passengerCount, 0) / rt.length) : 0,
        onTimeRate: rt.filter((t) => t.delayMinutes === 0).length / Math.max(1, rt.length),
      };
    });
  }

  async routeReports(): Promise<Array<Record<string, unknown>>> {
    const [routes, trips] = await Promise.all([this.repo.listRoutes(), this.repo.allTrips({})]);
    const routeTrips = new Map<string, Trip[]>();
    for (const t of trips) {
      const arr = routeTrips.get(t.routeId) ?? [];
      arr.push(t);
      routeTrips.set(t.routeId, arr);
    }
    return routes.map((r) => {
      const rt = routeTrips.get(r.id) ?? [];
      const completed = rt.filter((t) => t.status === 'completed');
      const delayed = rt.filter((t) => t.delayMinutes > 0);
      const avgDuration = completed.length
        ? Math.round(completed.reduce((s, t) => s + hoursBetween(t), 0) / completed.length * 60)
        : 0;
      return {
        routeId: r.id,
        route: r.name,
        color: r.color,
        origin: r.origin,
        destination: r.destination,
        distanceKm: r.distanceKm,
        trips: rt.length,
        completed: completed.length,
        delayed: delayed.length,
        onTimeRate: completed.length ? Math.round((completed.filter((t) => t.delayMinutes === 0).length / completed.length) * 100) : 100,
        avgDurationMin: avgDuration,
        avgPassengers: completed.length ? Math.round(completed.reduce((s, t) => s + t.passengerCount, 0) / completed.length) : 0,
      };
    });
  }

  async emergencyReports(): Promise<Record<string, unknown>> {
    const alerts = (await this.repo.listAlerts({ page: 1, pageSize: 500 })).data;
    const byType: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    for (const a of alerts) {
      byType[a.type] = (byType[a.type] ?? 0) + 1;
      byStatus[a.status] = (byStatus[a.status] ?? 0) + 1;
    }
    const resolved = alerts.filter((a) => a.status === 'resolved' && a.resolvedAt).map((a) => {
      const duration = (new Date(a.resolvedAt!).getTime() - new Date(a.createdAt).getTime()) / 60000;
      return { type: a.type, responseMinutes: Math.round(duration) };
    });
    const avgResponse = resolved.length
      ? Math.round(resolved.reduce((s, r) => s + r.responseMinutes, 0) / resolved.length)
      : 0;
    return { total: alerts.length, byType, byStatus, avgResponseMinutes: avgResponse, recent: alerts.slice(0, 10) };
  }

  async exportCsv(report: string): Promise<string> {
    let rows: Array<Record<string, unknown>> = [];
    switch (report) {
      case 'trips':
        rows = await this.csvTrips();
        break;
      case 'drivers':
        rows = await this.driverPerformance();
        break;
      case 'buses':
        rows = await this.busUtilization();
        break;
      case 'routes':
        rows = await this.routeReports();
        break;
      case 'students':
        rows = await this.studentUsage();
        break;
      default:
        throw badRequest('Unknown report name');
    }
    return toCsv(rows);
  }

  private async csvTrips(): Promise<Array<Record<string, unknown>>> {
    const [trips, buses, routes] = await Promise.all([this.repo.allTrips({}), this.repo.listBuses({ page: 1, pageSize: 200 }), this.repo.listRoutes()]);
    const plate = new Map(buses.data.map((b) => [b.id, b.plateNumber]));
    const routeName = new Map(routes.map((r) => [r.id, r.name]));
    return trips.map((t) => ({
      id: t.id,
      bus: plate.get(t.busId) ?? t.busId,
      route: routeName.get(t.routeId) ?? t.routeId,
      startedAt: t.startedAt,
      completedAt: t.completedAt ?? '',
      status: t.status,
      passengers: t.passengerCount,
      delayMinutes: t.delayMinutes,
      distanceKm: t.distanceKm,
    }));
  }
}

function hoursBetween(t: Trip): number {
  if (!t.completedAt) return 0;
  return (new Date(t.completedAt).getTime() - new Date(t.startedAt).getTime()) / 3600000;
}

/** Build an aggregated series of points bucketed by day/week/month. */
function buildSeries(trips: Trip[], buckets: number, unit: 'day' | 'week' | 'month'): SeriesPoint[] {
  const now = new Date();
  const points: SeriesPoint[] = [];
  for (let i = buckets - 1; i >= 0; i--) {
    const start = bucketStart(now, i, unit);
    const end = bucketStart(now, i - 1, unit);
    const bucket = trips.filter((t) => {
      const d = new Date(t.startedAt).getTime();
      return d >= start.getTime() && d < end.getTime();
    });
    const label = formatBucket(start, unit);
    const completed = bucket.filter((t) => t.status === 'completed');
    points.push({
      label,
      trips: bucket.length,
      completed: completed.length,
      delayed: bucket.filter((t) => t.delayMinutes > 0).length,
      avgDelay: completed.length ? Math.round(completed.reduce((s, t) => s + t.delayMinutes, 0) / completed.length) : 0,
    });
  }
  return points;
}

function bucketStart(now: Date, offset: number, unit: 'day' | 'week' | 'month'): Date {
  const d = new Date(now);
  if (unit === 'day') d.setDate(d.getDate() - offset);
  if (unit === 'week') d.setDate(d.getDate() - offset * 7);
  if (unit === 'month') d.setMonth(d.getMonth() - offset);
  if (unit === 'day') d.setHours(0, 0, 0, 0);
  else if (unit === 'week') {
    const day = (d.getDay() + 6) % 7; // Monday start
    d.setDate(d.getDate() - day);
    d.setHours(0, 0, 0, 0);
  } else d.setDate(1), d.setHours(0, 0, 0, 0);
  return d;
}

function formatBucket(d: Date, unit: 'day' | 'week' | 'month'): string {
  if (unit === 'day') return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  if (unit === 'week') return `W${Math.ceil(d.getDate() / 7)} ${d.toLocaleDateString('en-IN', { month: 'short' })}`;
  return d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(',')];
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(','));
  return lines.join('\n');
}
