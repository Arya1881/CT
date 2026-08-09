import type { Bus, Driver, LiveLocation, Route, Trip } from '../models/types';
import type { Repository } from '../repositories';
import { parsePagination } from '../utils/pagination';

export interface BusEnriched {
  bus: Bus;
  route: Route | null;
  driver: Driver | null;
  location: LiveLocation | null;
  activeTrip: Trip | null;
  stopsCount: number;
}

export async function enrichBuses(repo: Repository, buses: Bus[]): Promise<BusEnriched[]> {
  const [routes, drivers, locations, activeTrips, allStops] = await Promise.all([
    repo.listRoutes(),
    repo.listDrivers({ page: 1, pageSize: 200 }),
    repo.latestLocations(),
    repo.allTrips({ status: 'active' }),
    repo.listStops(),
  ]);
  const routeById = new Map(routes.map((r) => [r.id, r]));
  const driverById = new Map(drivers.data.map((d) => [d.id, d]));
  const locByBus = new Map(locations.map((l) => [l.busId, l]));
  const stopsByRoute = new Map<string, number>();
  for (const s of allStops) stopsByRoute.set(s.routeId, (stopsByRoute.get(s.routeId) ?? 0) + 1);
  const activeByBus = new Map<string, Trip>();
  for (const t of activeTrips) if (t.busId) activeByBus.set(t.busId, t);

  return buses.map((bus) => ({
    bus,
    route: bus.routeId ? routeById.get(bus.routeId) ?? null : null,
    driver: bus.driverId ? driverById.get(bus.driverId) ?? null : null,
    location: locByBus.get(bus.id) ?? null,
    activeTrip: activeByBus.get(bus.id) ?? null,
    stopsCount: bus.routeId ? stopsByRoute.get(bus.routeId) ?? 0 : 0,
  }));
}

export function paginationFrom(query: Record<string, unknown>) {
  return parsePagination(query);
}
