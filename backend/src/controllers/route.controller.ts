import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import type { AppServices } from '../services/container';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { routeCreateSchema, routeUpdateSchema } from '../validation/schemas';
import { asyncHandler, ok } from '../utils/asyncHandler';
import { notFound } from '../utils/errors';
import { nowIso, uuid } from '../utils/id';

export function routeRoutes(svc: AppServices): Router {
  const router = expressRouter();

  router.get(
    '/',
    authenticate,
    asyncHandler(async (req, res) => {
      const activeOnly = req.query.active === 'true';
      const routes = await svc.repo.listRoutes(activeOnly || undefined);
      const stops = await svc.repo.listStops();
      const buses = (await svc.repo.listBuses({ page: 1, pageSize: 200 })).data;
      ok(
        res,
        routes.map((r) => ({
          ...r,
          stopsCount: stops.filter((s) => s.routeId === r.id).length,
          busesCount: buses.filter((b) => b.routeId === r.id).length,
        })),
      );
    }),
  );

  router.get(
    '/:id',
    authenticate,
    asyncHandler(async (req, res) => {
      const route = await svc.repo.findRouteById(req.params.id);
      if (!route) throw notFound('Route not found');
      const stops = await svc.repo.listStops(route.id);
      const buses = (await svc.repo.listBuses({ page: 1, pageSize: 200 })).data.filter((b) => b.routeId === route.id);
      ok(res, { ...route, stops, buses });
    }),
  );

  router.post(
    '/',
    authenticate,
    authorize('admin'),
    validate(routeCreateSchema),
    asyncHandler(async (req, res) => {
      const route = await svc.repo.createRoute({
        id: uuid(),
        name: req.body.name,
        description: req.body.description,
        origin: req.body.origin,
        destination: req.body.destination,
        distanceKm: req.body.distanceKm,
        estimatedDurationMin: req.body.estimatedDurationMin,
        color: req.body.color,
        waypoints: req.body.waypoints,
        active: req.body.active,
        createdAt: nowIso(),
      });
      await svc.audit.log(req.user!.sub, 'route.created', 'route', route.id, req.body);
      ok(res, route, { created: true });
    }),
  );

  router.patch(
    '/:id',
    authenticate,
    authorize('admin'),
    validate(routeUpdateSchema),
    asyncHandler(async (req, res) => {
      const existing = await svc.repo.findRouteById(req.params.id);
      if (!existing) throw notFound('Route not found');
      const route = await svc.repo.updateRoute(req.params.id, req.body);
      await svc.audit.log(req.user!.sub, 'route.updated', 'route', route.id, req.body);
      ok(res, route);
    }),
  );

  router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    asyncHandler(async (req, res) => {
      await svc.repo.deleteRoute(req.params.id);
      await svc.audit.log(req.user!.sub, 'route.deleted', 'route', req.params.id);
      ok(res, { message: 'Route deleted' });
    }),
  );

  return router;
}
