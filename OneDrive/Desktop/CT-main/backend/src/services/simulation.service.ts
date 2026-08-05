/**
 * GPS simulation engine.
 *
 * Moves buses along their routes in real time, publishing live locations over
 * the realtime hub, announcing stops, applying delays and completing trips —
 * exactly the contract a real GPS device feed will implement later. Swapping
 * this engine for a hardware ingestion pipeline requires no changes anywhere
 * else in the system.
 */
import type { Bus, LatLng, LiveLocation, Trip } from '../models/types';
import type { Repository } from '../repositories';
import type { RealtimeHub } from '../realtime';
import { EVENTS } from '../realtime/events';
import { badRequest, notFound } from '../utils/errors';
import { distanceAlongPolyline, pointAtDistance, polylineLength } from '../utils/geo';
import { nowIso, uuid } from '../utils/id';
import { logger } from '../utils/logger';
import type { NotificationService } from './notification.service';
import { clamp } from '../utils/id';

interface ActiveSim {
  tripId: string;
  busId: string;
  driverId: string;
  routeId: string;
  waypoints: LatLng[];
  travelled: number;
  totalLength: number;
  speedKmh: number;
  announcedStops: Set<string>;
  delayMinutes: number;
  automatic: boolean;
  startTick: number;
}

export interface SimState {
  running: boolean;
  activeSims: number;
  startedAt: number | null;
}

export class SimulationService {
  private sims = new Map<string, ActiveSim>();
  private gpsDisabled = new Set<string>();
  private timer: NodeJS.Timeout | null = null;
  private ticking = false;
  private startTickCount = 0;
  private startedAt: number | null = null;

  constructor(
    private readonly repo: Repository,
    private readonly hub: RealtimeHub,
    private readonly notifications: NotificationService,
  ) {}

  get state(): SimState {
    return { running: this.timer !== null, activeSims: this.sims.size, startedAt: this.startedAt };
  }

  /** Start the autonomous demo ticker (a few buses run forever). */
  async start(): Promise<void> {
    if (this.timer) return;
    this.startedAt = Date.now();
    const buses = (await this.repo.listBuses({ page: 1, pageSize: 200 })).data;
    const demoBuses = buses.slice(0, 3);
    for (const bus of demoBuses) {
      if (bus.status !== 'running') await this.beginTrip(bus, true);
    }
    this.timer = setInterval(() => void this.tick(), 3000);
    this.timer.unref?.();
    logger.info(`[sim] GPS simulation started with ${demoBuses.length} autonomous buses`);
  }

  async stop(): Promise<void> {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Toggle GPS broadcast for a driver's bus (demo "Share GPS" switch). */
  async setGpsSharing(driverId: string, enabled: boolean): Promise<boolean> {
    const bus = await this.repo.findBusByDriverId(driverId);
    if (!bus) throw notFound('No bus assigned to this driver');
    if (enabled) this.gpsDisabled.delete(bus.id);
    else this.gpsDisabled.add(bus.id);
    return enabled;
  }

  isGpsEnabled(busId: string): boolean {
    return !this.gpsDisabled.has(busId);
  }

  /* --------------------------- driver actions --------------------------- */

  async startTrip(driverId: string): Promise<Trip> {
    const driver = await this.repo.findDriverById(driverId);
    if (!driver) throw notFound('Driver not found');
    const bus = driver.busId ? await this.repo.findBusById(driver.busId) : null;
    if (!bus) throw badRequest('No bus assigned to this driver');
    if (!bus.routeId) throw badRequest('Assigned bus has no route');

    const existing = this.sims.get(bus.id);
    if (existing) await this.completeSim(existing);

    const trip = await this.beginTrip(bus, false);
    logger.info(`[sim] trip started by driver ${driverId} on bus ${bus.id}`);
    return trip;
  }

  async stopTrip(driverId: string): Promise<Trip> {
    const driver = await this.repo.findDriverById(driverId);
    if (!driver) throw notFound('Driver not found');
    const bus = driver.busId ? await this.repo.findBusById(driver.busId) : null;
    if (!bus) throw badRequest('No bus assigned to this driver');
    const sim = this.sims.get(bus.id);
    if (!sim) throw badRequest('No active trip to stop');
    return this.completeSim(sim);
  }

  async reportDelay(driverId: string, minutes: number): Promise<Trip> {
    const driver = await this.repo.findDriverById(driverId);
    if (!driver) throw notFound('Driver not found');
    const bus = driver.busId ? await this.repo.findBusById(driver.busId) : null;
    if (!bus) throw badRequest('No bus assigned to this driver');
    const sim = this.sims.get(bus.id);
    if (!sim) throw badRequest('No active trip to delay');

    sim.delayMinutes = minutes;
    await this.repo.updateTrip(sim.tripId, { delayMinutes: minutes, status: 'delayed' });

    const busRow = await this.repo.findBusById(bus.id);
    this.hub.emit(EVENTS.TRIP_DELAYED, { tripId: sim.tripId, busId: bus.id, delayMinutes: minutes, bus: busRow });
    await this.notifications.notifyBusStakeholders(
      bus.id,
      'bus_delayed',
      'Bus Delayed',
      `Bus ${bus.plateNumber} is delayed by approximately ${minutes} minutes.`,
      { busId: bus.id, tripId: sim.tripId },
    );
    logger.info(`[sim] delay reported bus=${bus.id} minutes=${minutes}`);
    return this.repo.findTripById(sim.tripId) as Promise<Trip>;
  }

  /* ------------------------------ internals ----------------------------- */

  private async beginTrip(bus: Bus, automatic: boolean): Promise<Trip> {
    const route = bus.routeId ? await this.repo.findRouteById(bus.routeId) : null;
    if (!route) throw badRequest('Bus has no assigned route');

    const trip: Trip = {
      id: uuid(),
      busId: bus.id,
      routeId: route.id,
      driverId: bus.driverId,
      startedAt: nowIso(),
      status: 'active',
      passengerCount: Math.round(bus.capacity * (0.6 + Math.random() * 0.3)),
      delayMinutes: 0,
      distanceKm: 0,
      startLat: route.waypoints[0].lat,
      startLng: route.waypoints[0].lng,
    };
    await this.repo.createTrip(trip);
    await this.repo.updateBus(bus.id, { status: 'running' });
    if (bus.driverId) await this.repo.updateDriver(bus.driverId, { status: 'on_duty' });

    this.sims.set(bus.id, {
      tripId: trip.id,
      busId: bus.id,
      driverId: bus.driverId ?? '',
      routeId: route.id,
      waypoints: route.waypoints,
      travelled: 0,
      totalLength: polylineLength(route.waypoints),
      speedKmh: this.baseSpeed(route),
      announcedStops: new Set(),
      delayMinutes: 0,
      automatic,
      startTick: this.startTickCount++,
    });

    const busRow = await this.repo.findBusById(bus.id);
    this.hub.emit(EVENTS.TRIP_STARTED, { tripId: trip.id, busId: bus.id, routeId: route.id, bus: busRow });
    await this.notifications.notifyBusStakeholders(
      bus.id,
      'trip_started',
      'Trip Started',
      `Bus ${bus.plateNumber} (${route.name}) has started its trip.`,
      { busId: bus.id, tripId: trip.id },
    );
    return trip;
  }

  private async completeSim(sim: ActiveSim): Promise<Trip> {
    this.sims.delete(sim.busId);
    const bus = await this.repo.findBusById(sim.busId);
    const route = sim.routeId ? await this.repo.findRouteById(sim.routeId) : null;
    const last = sim.waypoints[sim.waypoints.length - 1];
    const trip = await this.repo.updateTrip(sim.tripId, {
      status: 'completed',
      completedAt: nowIso(),
      distanceKm: route ? Math.round(route.distanceKm * 100) / 100 : 0,
      delayMinutes: sim.delayMinutes,
      endLat: last.lat,
      endLng: last.lng,
    });

    if (bus) {
      await this.repo.updateBus(bus.id, { status: 'idle' });
      if (bus.driverId) await this.repo.updateDriver(bus.driverId, { status: 'available' });
    }

    const busRow = bus ?? (await this.repo.findBusById(sim.busId));
    this.hub.emit(EVENTS.TRIP_COMPLETED, { trip, bus: busRow });
    await this.notifications.notifyBusStakeholders(
      sim.busId,
      'trip_completed',
      'Trip Completed',
      busRow ? `Bus ${busRow.plateNumber} has completed its trip.` : 'A bus trip has completed.',
      { busId: sim.busId, tripId: trip.id },
    );

    // Autonomous demo buses automatically start the return leg.
    if (sim.automatic && busRow && busRow.routeId) {
      const reverseBus = await this.repo.findBusById(busRow.id);
      if (reverseBus) {
        void this.beginTrip(reverseBus, true);
      }
    }
    return trip;
  }

  private baseSpeed(route: { distanceKm: number; estimatedDurationMin: number }): number {
    const avg = route.distanceKm / (route.estimatedDurationMin / 60);
    return clamp(avg, 22, 38);
  }

  private async tick(): Promise<void> {
    if (this.ticking || this.sims.size === 0) return;
    this.ticking = true;
    const dtSec = 3;
    const now = new Date();

    for (const sim of this.sims.values()) {
      try {
        // slight speed variation for realistic movement
        const wave = Math.sin(now.getTime() / 30000 + sim.startTick) * 3;
        const speed = clamp(sim.speedKmh + wave, 12, 45);
        const moved = (speed / 3.6) * dtSec;
        sim.travelled = Math.min(sim.travelled + moved, sim.totalLength);
        sim.speedKmh = speed;

        const { point, heading } = pointAtDistance(sim.waypoints, sim.travelled);
        const location: LiveLocation = {
          id: uuid(),
          busId: sim.busId,
          routeId: sim.routeId,
          tripId: sim.tripId,
          lat: point.lat,
          lng: point.lng,
          speedKmh: Math.round(speed * 10) / 10,
          heading: Math.round(heading),
          timestamp: nowIso(),
        };
        await this.repo.upsertLiveLocation(location);
        await this.repo.updateBus(sim.busId, { currentLat: point.lat, currentLng: point.lng });

        if (this.isGpsEnabled(sim.busId)) {
          this.hub.emit(EVENTS.LIVE_LOCATION, {
            busId: sim.busId,
            tripId: sim.tripId,
            routeId: sim.routeId,
            lat: point.lat,
            lng: point.lng,
            speedKmh: location.speedKmh,
            heading: location.heading,
            timestamp: location.timestamp,
          });
        }

        await this.checkStops(sim);

        if (sim.travelled >= sim.totalLength) {
          await this.completeSim(sim);
        }
      } catch (err) {
        logger.error('[sim] tick error', err);
      }
    }
    this.ticking = false;
  }

  /** 1.0 far from next stop, ~0.0 right at it. */
  private async checkStops(sim: ActiveSim): Promise<void> {
    const stops = await this.repo.listStops(sim.routeId);
    const bus = await this.repo.findBusById(sim.busId);
    if (!bus) return;
    for (const stop of stops) {
      if (sim.announcedStops.has(stop.id)) continue;
      const stopDist = distanceAlongPolyline(sim.waypoints, { lat: stop.lat, lng: stop.lng });
      const ahead = stopDist - sim.travelled;
      if (ahead > -30 && ahead < 300) {
        sim.announcedStops.add(stop.id);
        const etaMin = Math.max(1, Math.round((ahead / 1000 / Math.max(sim.speedKmh, 10)) * 60));
        this.hub.emit(EVENTS.BUS_NEAR_STOP, {
          busId: sim.busId,
          tripId: sim.tripId,
          stopId: stop.id,
          stopName: stop.name,
          etaMinutes: etaMin,
          bus: bus,
        });
        await this.notifications.notifyBusStakeholders(
          sim.busId,
          'bus_near_stop',
          'Bus Near Your Stop',
          `Bus ${bus.plateNumber} is about ${etaMin} min from ${stop.name}.`,
          { busId: sim.busId, tripId: sim.tripId },
        );
      }
    }
  }
}
