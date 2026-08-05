import type { Bus, Driver, LatLng, LiveLocation, Route, Trip } from '../models/types';
import type { Repository } from '../repositories';
import { distanceAlongPolyline, haversineKm, polylineLength } from '../utils/geo';
import { notFound } from '../utils/errors';

export interface LiveBusView {
  bus: Bus;
  route: Route | null;
  driver: Driver | null;
  location: LiveLocation | null;
  activeTrip: Trip | null;
  color: string;
}

export interface EtaResult {
  busId: string;
  stopName: string;
  destinationName: string;
  distanceKm: number;
  minutes: number;
  atStop: boolean;
}

export class TrackingService {
  constructor(private readonly repo: Repository) {}

  async snapshot(): Promise<LiveBusView[]> {
    const [locations, buses, routes, drivers, trips] = await Promise.all([
      this.repo.latestLocations(),
      this.repo.listBuses({ page: 1, pageSize: 200 }),
      this.repo.listRoutes(),
      this.repo.listDrivers({ page: 1, pageSize: 200 }),
      this.repo.allTrips({ status: 'active' }),
    ]);
    const routeById = new Map(routes.map((r) => [r.id, r]));
    const driverById = new Map(drivers.data.map((d) => [d.id, d]));
    const locByBus = new Map(locations.map((l) => [l.busId, l]));
    const tripByBus = new Map<string, Trip>();
    for (const t of trips) if (t.busId) tripByBus.set(t.busId, t);

    return buses.data.map((bus) => {
      const route = bus.routeId ? routeById.get(bus.routeId) ?? null : null;
      return {
        bus,
        route,
        driver: bus.driverId ? driverById.get(bus.driverId) ?? null : null,
        location: locByBus.get(bus.id) ?? null,
        activeTrip: tripByBus.get(bus.id) ?? null,
        color: route?.color ?? '#2563EB',
      };
    });
  }

  async busLive(busId: string): Promise<LiveBusView> {
    const bus = await this.repo.findBusById(busId);
    if (!bus) throw notFound('Bus not found');
    const [route, driver, location, trips] = await Promise.all([
      bus.routeId ? this.repo.findRouteById(bus.routeId) : Promise.resolve(null),
      bus.driverId ? this.repo.findDriverById(bus.driverId) : Promise.resolve(null),
      this.repo.busLocation(busId),
      this.repo.allTrips({ busId, status: 'active' }),
    ]);
    return {
      bus,
      route,
      driver,
      location,
      activeTrip: trips[0] ?? null,
      color: route?.color ?? '#2563EB',
    };
  }

  /**
   * ETA of a bus to one of its route stops (or route end). Computed by
   * projecting the current GPS position onto the route polyline and using
   * live speed (falling back to the route's average).
   */
  async eta(busId: string, stopId?: string): Promise<EtaResult> {
    const bus = await this.repo.findBusById(busId);
    if (!bus) throw notFound('Bus not found');
    const route = bus.routeId ? await this.repo.findRouteById(bus.routeId) : null;
    if (!route) throw notFound('Bus has no assigned route');
    const location = await this.repo.busLocation(busId);
    if (!location) throw notFound('No live location yet for this bus');

    const points: LatLng[] = route.waypoints;
    const speedKmh = location.speedKmh > 5 ? location.speedKmh : route.distanceKm / (route.estimatedDurationMin / 60);

    let target: LatLng = points[points.length - 1];
    let targetName = route.destination;
    if (stopId) {
      const stop = await this.repo.findStopById(stopId);
      if (stop && stop.routeId === route.id) {
        target = { lat: stop.lat, lng: stop.lng };
        targetName = stop.name;
      }
    }

    const sBus = distanceAlongPolyline(points, location);
    const sTarget = distanceAlongPolyline(points, target);
    const remainingKm = Math.max(0, sTarget - sBus) / 1000;

    return {
      busId,
      stopName: targetName,
      destinationName: route.destination,
      distanceKm: Math.round(remainingKm * 10) / 10,
      minutes: remainingKm <= 0.02 ? 0 : Math.round((remainingKm / speedKmh) * 60),
      atStop: remainingKm <= 0.02,
    };
  }

  async routeLengthMeters(route: Route): Promise<number> {
    return polylineLength(route.waypoints);
  }

  static distanceToStopKm(location: LiveLocation, stop: LatLng): number {
    return haversineKm(location, stop);
  }
}
