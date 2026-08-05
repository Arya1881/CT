import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import type { AppServices } from '../services/container';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { alertStatusSchema, emergencyCreateSchema } from '../validation/schemas';
import { asyncHandler, ok } from '../utils/asyncHandler';
import { notFound } from '../utils/errors';
import { paginationFrom } from './helpers';

export function emergencyRoutes(svc: AppServices): Router {
  const router = expressRouter();

  // Raise an alert (any authenticated user)
  router.post(
    '/',
    authenticate,
    validate(emergencyCreateSchema),
    asyncHandler(async (req, res) => {
      const alert = await svc.emergency.raise(req.user!.sub, req.body);
      await svc.audit.log(req.user!.sub, 'emergency.raised', 'emergency_alert', alert.id, req.body);
      ok(res, alert, { raised: true });
    }),
  );

  router.get(
    '/',
    authenticate,
    authorize('admin', 'management'),
    asyncHandler(async (req, res) => {
      const query = paginationFrom(req.query as Record<string, unknown>);
      const page = await svc.emergency.list({
        page: query.page,
        pageSize: query.pageSize,
        status: (req.query.status as string) || undefined,
        type: (req.query.type as string) || undefined,
      });
      const users = await svc.repo.listUsers({ page: 1, pageSize: 500 });
      const userById = new Map(users.data.map((u) => [u.id, u]));
      ok(res, {
        ...page,
        data: page.data.map((a) => ({
          ...a,
          reporter: userById.get(a.userId)
            ? { name: `${userById.get(a.userId)!.firstName} ${userById.get(a.userId)!.lastName}`, email: userById.get(a.userId)!.email }
            : null,
        })),
      });
    }),
  );

  router.get(
    '/stats',
    authenticate,
    authorize('admin', 'management'),
    asyncHandler(async (req, res) => {
      ok(res, await svc.emergency.stats());
    }),
  );

  router.patch(
    '/:id/status',
    authenticate,
    authorize('admin', 'management'),
    validate(alertStatusSchema),
    asyncHandler(async (req, res) => {
      const alert = await svc.emergency.updateStatus(req.params.id, req.body.status);
      if (req.body.status === 'resolved') {
        await svc.audit.log(req.user!.sub, 'emergency.resolved', 'emergency_alert', alert.id);
      }
      ok(res, alert);
    }),
  );

  return router;
}
