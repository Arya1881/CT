import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import type { AppServices } from '../services/container';
import { authenticate } from '../middleware/auth';
import { asyncHandler, ok } from '../utils/asyncHandler';
import { notFound } from '../utils/errors';

export function trackingRoutes(svc: AppServices): Router {
  const router = expressRouter();

  // Live snapshot of every bus (admin/management see all; students/parents/drivers also allowed)
  router.get(
    '/live',
    authenticate,
    asyncHandler(async (req, res) => {
      const snapshot = await svc.tracking.snapshot();
      ok(res, snapshot);
    }),
  );

  router.get(
    '/bus/:busId',
    authenticate,
    asyncHandler(async (req, res) => {
      const live = await svc.tracking.busLive(req.params.busId);
      ok(res, live);
    }),
  );

  router.get(
    '/bus/:busId/eta',
    authenticate,
    asyncHandler(async (req, res) => {
      const stopId = (req.query.stopId as string) || undefined;
      const eta = await svc.tracking.eta(req.params.busId, stopId);
      ok(res, eta);
    }),
  );

  router.get(
    '/bus/:busId/trail',
    authenticate,
    asyncHandler(async (req, res) => {
      const trail = await svc.repo.locationHistory(req.params.busId, Number(req.query.limit) || 60);
      ok(res, trail);
    }),
  );

  return router;
}
