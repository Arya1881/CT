import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import type { AppServices } from '../services/container';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { tripQuerySchema } from '../validation/schemas';
import { asyncHandler, ok } from '../utils/asyncHandler';
import { notFound } from '../utils/errors';

export function tripRoutes(svc: AppServices): Router {
  const router = expressRouter();

  router.get(
    '/',
    authenticate,
    authorize('admin', 'management', 'driver'),
    validate(tripQuerySchema, 'query'),
    asyncHandler(async (req, res) => {
      const q = req.query as Record<string, string>;
      const page = await svc.repo.listTrips({
        page: Number(q.page) || 1,
        pageSize: Number(q.pageSize) || 20,
        status: q.status || undefined,
        busId: q.busId || undefined,
        routeId: q.routeId || undefined,
        driverId: q.driverId || undefined,
        from: q.from || undefined,
        to: q.to || undefined,
      });
      const [buses, routes, drivers] = await Promise.all([
        svc.repo.listBuses({ page: 1, pageSize: 200 }),
        svc.repo.listRoutes(),
        svc.repo.listDrivers({ page: 1, pageSize: 200 }),
      ]);
      const busById = new Map(buses.data.map((b) => [b.id, b]));
      const routeById = new Map(routes.map((r) => [r.id, r]));
      const driverById = new Map(drivers.data.map((d) => [d.id, d]));
      ok(res, {
        ...page,
        data: page.data.map((t) => ({
          ...t,
          bus: busById.get(t.busId) ?? null,
          route: routeById.get(t.routeId) ?? null,
          driver: t.driverId ? driverById.get(t.driverId) ?? null : null,
        })),
      });
    }),
  );

  router.get(
    '/:id',
    authenticate,
    asyncHandler(async (req, res) => {
      const trip = await svc.repo.findTripById(req.params.id);
      if (!trip) throw notFound('Trip not found');
      const [bus, route, driver] = await Promise.all([
        svc.repo.findBusById(trip.busId),
        svc.repo.findRouteById(trip.routeId),
        trip.driverId ? svc.repo.findDriverById(trip.driverId) : Promise.resolve(null),
      ]);
      const positions = trip.busId ? await svc.repo.locationHistory(trip.busId, 60) : [];
      ok(res, { ...trip, bus, route, driver, positions });
    }),
  );

  return router;
}
