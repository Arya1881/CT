import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import type { AppServices } from '../services/container';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { stopCreateSchema, stopUpdateSchema } from '../validation/schemas';
import { asyncHandler, ok } from '../utils/asyncHandler';
import { notFound } from '../utils/errors';
import { nowIso, uuid } from '../utils/id';

export function stopRoutes(svc: AppServices): Router {
  const router = expressRouter();

  router.get(
    '/',
    authenticate,
    asyncHandler(async (req, res) => {
      const stops = await svc.repo.listStops((req.query.routeId as string) || undefined);
      ok(res, stops);
    }),
  );

  router.post(
    '/',
    authenticate,
    authorize('admin'),
    validate(stopCreateSchema),
    asyncHandler(async (req, res) => {
      const stop = await svc.repo.createStop({
        id: uuid(),
        routeId: req.body.routeId,
        name: req.body.name,
        lat: req.body.lat,
        lng: req.body.lng,
        orderIndex: req.body.orderIndex,
        arrivalOffsetMin: req.body.arrivalOffsetMin,
        createdAt: nowIso(),
      });
      await svc.audit.log(req.user!.sub, 'stop.created', 'stop', stop.id, req.body);
      ok(res, stop, { created: true });
    }),
  );

  router.patch(
    '/:id',
    authenticate,
    authorize('admin'),
    validate(stopUpdateSchema),
    asyncHandler(async (req, res) => {
      const existing = await svc.repo.findStopById(req.params.id);
      if (!existing) throw notFound('Stop not found');
      const stop = await svc.repo.updateStop(req.params.id, req.body);
      await svc.audit.log(req.user!.sub, 'stop.updated', 'stop', stop.id, req.body);
      ok(res, stop);
    }),
  );

  router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    asyncHandler(async (req, res) => {
      await svc.repo.deleteStop(req.params.id);
      await svc.audit.log(req.user!.sub, 'stop.deleted', 'stop', req.params.id);
      ok(res, { message: 'Stop deleted' });
    }),
  );

  return router;
}
