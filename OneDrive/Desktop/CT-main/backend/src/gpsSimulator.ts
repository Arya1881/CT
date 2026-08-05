import { Response } from 'express';
import { INITIAL_TRIPS, ROUTES } from './seedData';
import { Trip, EmergencyAlert } from './types';

class GpsSimulator {
  private trips: Map<string, Trip> = new Map();
  private sseClients: Set<Response> = new Set();
  private alerts: EmergencyAlert[] = [];
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    INITIAL_TRIPS.forEach(trip => this.trips.set(trip.busId, { ...trip }));
    this.startSimulation();
  }

  public registerClient(res: Response) {
    this.sseClients.add(res);
    res.write(`data: ${JSON.stringify({ type: 'INITIAL_STATE', trips: Array.from(this.trips.values()), alerts: this.alerts })}\n\n`);
  }

  public unregisterClient(res: Response) {
    this.sseClients.delete(res);
  }

  public getTrips(): Trip[] {
    return Array.from(this.trips.values());
  }

  public getTripByBusId(busId: string): Trip | undefined {
    return this.trips.get(busId);
  }

  public startTrip(busId: string, driverId: string, routeId: string): Trip {
    const route = ROUTES.find(r => r.id === routeId) || ROUTES[0];
    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      busId,
      driverId,
      routeId,
      status: 'IN_TRANSIT',
      startTime: new Date().toISOString(),
      currentLat: route.stops[0].lat,
      currentLng: route.stops[0].lng,
      speedKmh: 35.0,
      currentStopIndex: 0,
      nextStopName: route.stops[1]?.name || route.stops[0].name,
      etaMinutesToNextStop: 5
    };
    this.trips.set(busId, newTrip);
    this.broadcastUpdate('TRIP_STARTED', { trip: newTrip });
    return newTrip;
  }

  public endTrip(busId: string): Trip | null {
    const trip = this.trips.get(busId);
    if (!trip) return null;

    trip.status = 'COMPLETED';
    trip.endTime = new Date().toISOString();
    trip.speedKmh = 0;
    this.broadcastUpdate('TRIP_COMPLETED', { trip });
    return trip;
  }

  public reportDelay(busId: string, reason: string): Trip | null {
    const trip = this.trips.get(busId);
    if (!trip) return null;

    trip.status = 'DELAYED';
    trip.delayReason = reason;
    trip.etaMinutesToNextStop += 10;
    this.broadcastUpdate('TRIP_DELAYED', { trip, reason });
    return trip;
  }

  public addAlert(alert: EmergencyAlert) {
    this.alerts.unshift(alert);
    this.broadcastUpdate('SOS_TRIGGERED', { alert });
  }

  public getAlerts(): EmergencyAlert[] {
    return this.alerts;
  }

  public resolveAlert(alertId: string): EmergencyAlert | null {
    const alert = this.alerts.find(a => a.id === alertId);
    if (alert) {
      alert.status = 'RESOLVED';
      this.broadcastUpdate('SOS_RESOLVED', { alertId });
    }
    return alert || null;
  }

  private startSimulation() {
    if (this.intervalId) return;

    this.intervalId = setInterval(() => {
      this.trips.forEach((trip) => {
        if (trip.status !== 'IN_TRANSIT') return;

        const route = ROUTES.find(r => r.id === trip.routeId);
        if (!route || route.stops.length === 0) return;

        const nextIndex = (trip.currentStopIndex + 1) % route.stops.length;
        const targetStop = route.stops[nextIndex];

        const deltaLat = (targetStop.lat - trip.currentLat) * 0.08;
        const deltaLng = (targetStop.lng - trip.currentLng) * 0.08;

        trip.currentLat += deltaLat;
        trip.currentLng += deltaLng;

        trip.speedKmh = Math.floor(25 + Math.random() * 20);

        const distToStop = Math.hypot(targetStop.lat - trip.currentLat, targetStop.lng - trip.currentLng);
        if (distToStop < 0.001) {
          trip.currentStopIndex = nextIndex;
          const futureStop = route.stops[(nextIndex + 1) % route.stops.length];
          trip.nextStopName = futureStop.name;
          trip.etaMinutesToNextStop = Math.floor(3 + Math.random() * 5);
        } else {
          trip.etaMinutesToNextStop = Math.max(1, Math.round(distToStop * 500));
        }
      });

      this.broadcastUpdate('GPS_UPDATE', { trips: Array.from(this.trips.values()) });
    }, 3000);
  }

  private broadcastUpdate(event: string, payload: any) {
    const message = `data: ${JSON.stringify({ type: event, ...payload })}\n\n`;
    this.sseClients.forEach(client => {
      client.write(message);
    });
  }
}

export const gpsSimulator = new GpsSimulator();
