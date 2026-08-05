import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import type { AppServices } from '../services/container';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler, ok } from '../utils/asyncHandler';

export function auditRoutes(svc: AppServices): Router {
  const router = expressRouter();

  router.get(
    '/',
    authenticate,
    authorize('admin'),
    asyncHandler(async (req, res) => {
      const limit = Math.min(Number(req.query.limit) || 200, 500);
      const logs = await svc.audit.list(limit);
      const users = await svc.repo.listUsers({ page: 1, pageSize: 500 });
      const userById = new Map(users.data.map((u) => [u.id, u]));
      ok(
        res,
        logs.map((l) => ({
          ...l,
          user: l.userId
            ? userById.get(l.userId)
              ? `${userById.get(l.userId)!.firstName} ${userById.get(l.userId)!.lastName}`
              : null
            : null,
        })),
      );
    }),
  );

  return router;
}
