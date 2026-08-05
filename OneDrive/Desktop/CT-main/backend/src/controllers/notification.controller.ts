import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import type { AppServices } from '../services/container';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { broadcastSchema } from '../validation/schemas';
import { asyncHandler, ok } from '../utils/asyncHandler';
import { notFound } from '../utils/errors';
import { paginationFrom } from './helpers';

export function notificationRoutes(svc: AppServices): Router {
  const router = expressRouter();

  router.get(
    '/',
    authenticate,
    asyncHandler(async (req, res) => {
      const query = paginationFrom(req.query as Record<string, unknown>);
      const page = await svc.notifications.listForUser(req.user!.sub, {
        page: query.page,
        pageSize: query.pageSize,
        unreadOnly: (req.query.unreadOnly as string) === 'true' || undefined,
        type: (req.query.type as string) || undefined,
      });
      ok(res, page);
    }),
  );

  router.get(
    '/unread-count',
    authenticate,
    asyncHandler(async (req, res) => {
      const count = await svc.notifications.unread(req.user!.sub);
      ok(res, { count });
    }),
  );

  router.get(
    '/all',
    authenticate,
    authorize('admin', 'management'),
    asyncHandler(async (req, res) => {
      const query = paginationFrom(req.query as Record<string, unknown>);
      const page = await svc.notifications.listAll({
        page: query.page,
        pageSize: query.pageSize,
        unreadOnly: (req.query.unreadOnly as string) === 'true' || undefined,
        type: (req.query.type as string) || undefined,
      });
      ok(res, page);
    }),
  );

  router.post(
    '/broadcast',
    authenticate,
    authorize('admin'),
    validate(broadcastSchema),
    asyncHandler(async (req, res) => {
      const n = await svc.notifications.broadcast(req.body.type, req.body.title, req.body.message);
      await svc.audit.log(req.user!.sub, 'notification.broadcast', 'notification', n.id, req.body);
      ok(res, n, { broadcast: true });
    }),
  );

  router.patch(
    '/:id/read',
    authenticate,
    asyncHandler(async (req, res) => {
      await svc.notifications.markRead(req.params.id);
      ok(res, { message: 'Marked as read' });
    }),
  );

  router.post(
    '/read-all',
    authenticate,
    asyncHandler(async (req, res) => {
      await svc.notifications.markAllRead(req.user!.sub);
      ok(res, { message: 'All notifications marked as read' });
    }),
  );

  return router;
}
