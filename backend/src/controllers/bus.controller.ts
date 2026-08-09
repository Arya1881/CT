import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import type { AppServices } from '../services/container';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { busCreateSchema, busUpdateSchema } from '../validation/schemas';
import { asyncHandler, ok } from '../utils/asyncHandler';
import { enrichBuses, paginationFrom } from './helpers';
import { notFound } from '../utils/errors';
import { nowIso, uuid } from '../utils/id';

export function busRoutes(svc: AppServices): Router {
  const router = expressRouter();

  // List buses (authenticated)
  router.get(
    '/',
    authenticate,
    asyncHandler(async (req, res) => {
      const query = paginationFrom(req.query as Record<string, unknown>);
      const page = await svc.repo.listBuses({
        page: query.page,
        pageSize: query.pageSize,
        q: (req.query.q as string) || undefined,
        status: (req.query.status as string) || undefined,
        routeId: (req.query.routeId as string) || undefined,
      });
      const enriched = await enrichBuses(svc.repo, page.data);
      ok(res, { ...page, data: enriched });
    }),
  );

  // Bus details (with route, driver, live location)
  router.get(
    '/:id',
    authenticate,
    asyncHandler(async (req, res) => {
      const bus = await svc.repo.findBusById(req.params.id);
      if (!bus) throw notFound('Bus not found');
      const [enriched] = await enrichBuses(svc.repo, [bus]);
      ok(res, enriched);
    }),
  );

  // Live view + ETA for a bus
  router.get(
    '/:id/live',
    authenticate,
    asyncHandler(async (req, res) => {
      const live = await svc.tracking.busLive(req.params.id);
      const eta = await svc.tracking.eta(req.params.id);
      ok(res, { ...live, eta });
    }),
  );

  // Admin CRUD
  router.post(
    '/',
    authenticate,
    authorize('admin'),
    validate(busCreateSchema),
    asyncHandler(async (req, res) => {
      const bus = await svc.repo.createBus({
        id: uuid(),
        plateNumber: req.body.plateNumber,
        model: req.body.model,
        capacity: req.body.capacity,
        status: req.body.status,
        routeId: req.body.routeId ?? undefined,
        driverId: req.body.driverId ?? undefined,
        fuelLevel: req.body.fuelLevel,
        lastMaintenance: nowIso(),
        currentLat: undefined,
        currentLng: undefined,
        createdAt: nowIso(),
      });
      if (bus.routeId) {
        const route = await svc.repo.findRouteById(bus.routeId);
        if (route) {
          bus.currentLat = route.waypoints[0].lat;
          bus.currentLng = route.waypoints[0].lng;
        }
      }
      if (bus.driverId) await svc.repo.updateDriver(bus.driverId, { busId: bus.id, status: 'available' });
      await svc.audit.log(req.user!.sub, 'bus.created', 'bus', bus.id, req.body);
      ok(res, bus, { created: true });
    }),
  );

  router.patch(
    '/:id',
    authenticate,
    authorize('admin'),
    validate(busUpdateSchema),
    asyncHandler(async (req, res) => {
      const existing = await svc.repo.findBusById(req.params.id);
      if (!existing) throw notFound('Bus not found');
      const bus = await svc.repo.updateBus(req.params.id, req.body);
      await svc.audit.log(req.user!.sub, 'bus.updated', 'bus', bus.id, req.body);
      ok(res, bus);
    }),
  );

  router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    asyncHandler(async (req, res) => {
      await svc.repo.deleteBus(req.params.id);
      await svc.audit.log(req.user!.sub, 'bus.deleted', 'bus', req.params.id);
      ok(res, { message: 'Bus deleted' });
    }),
  );

  return router;
}
