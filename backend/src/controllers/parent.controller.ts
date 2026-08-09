import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import type { AppServices } from '../services/container';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { parentCreateSchema, parentUpdateSchema } from '../validation/schemas';
import { asyncHandler, ok } from '../utils/asyncHandler';
import { notFound } from '../utils/errors';
import { nowIso, uuid } from '../utils/id';
import { paginationFrom } from './helpers';

export function parentRoutes(svc: AppServices): Router {
  const router = expressRouter();

  router.get(
    '/',
    authenticate,
    authorize('admin', 'management'),
    asyncHandler(async (req, res) => {
      const query = paginationFrom(req.query as Record<string, unknown>);
      const parents = await svc.repo.listParents();
      const users = await svc.repo.listUsers({ page: 1, pageSize: 500 });
      const userById = new Map(users.data.map((u) => [u.id, u]));
      const withName = parents.map((p) => {
        const u = userById.get(p.userId);
        return {
          ...p,
          name: u ? `${u.firstName} ${u.lastName}` : 'Unknown',
          email: u?.email,
          phone: u?.phone,
        };
      });
      const start = (query.page - 1) * query.pageSize;
      ok(res, {
        data: withName.slice(start, start + query.pageSize),
        total: withName.length,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.max(1, Math.ceil(withName.length / query.pageSize)),
      });
    }),
  );

  // Parent self view with children + live tracking
  router.get(
    '/me',
    authenticate,
    authorize('parent'),
    asyncHandler(async (req, res) => {
      const parent = await svc.repo.findParentByUserId(req.user!.sub);
      if (!parent) throw notFound('Parent profile not found');
      const children = await svc.repo.childrenOfParent(parent.id);
      const detailed = await Promise.all(
        children.map(async (c) => {
          const user = await svc.repo.findUserById(c.userId);
          const bus = c.busId ? await svc.repo.findBusById(c.busId) : null;
          const route = bus?.routeId ? await svc.repo.findRouteById(bus.routeId) : null;
          const driver = bus?.driverId ? await svc.repo.findDriverById(bus.driverId) : null;
          const driverUser = driver ? await svc.repo.findUserById(driver.userId) : null;
          const location = c.busId ? await svc.repo.busLocation(c.busId) : null;
          const eta = c.busId ? await svc.tracking.eta(c.busId, c.stopId) : null;
          return {
            ...c,
            name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
            avatarUrl: user?.avatarUrl,
            bus: bus
              ? {
                  id: bus.id,
                  plateNumber: bus.plateNumber,
                  model: bus.model,
                  status: bus.status,
                  color: route?.color,
                }
              : null,
            route,
            liveLocation: location,
            eta,
            driver: driver
              ? {
                  id: driver.id,
                  name: driverUser ? `${driverUser.firstName} ${driverUser.lastName}` : 'Unknown',
                  phone: driver.phone,
                }
              : null,
          };
        }),
      );
      ok(res, { ...parent, children: detailed });
    }),
  );

  router.get(
    '/:id',
    authenticate,
    authorize('admin', 'management'),
    asyncHandler(async (req, res) => {
      const parent = await svc.repo.findParentById(req.params.id);
      if (!parent) throw notFound('Parent not found');
      const user = await svc.repo.findUserById(parent.userId);
      ok(res, {
        ...parent,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        email: user?.email,
        phone: user?.phone,
      });
    }),
  );

  router.post(
    '/',
    authenticate,
    authorize('admin'),
    validate(parentCreateSchema),
    asyncHandler(async (req, res) => {
      const user = await svc.auth.createUserWithRole({
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: 'parent',
        phone: req.body.phone,
      });
      const parent = await svc.repo.createParent({
        id: uuid(),
        userId: user.id,
        childrenCount: 0,
      });
      await svc.audit.log(req.user!.sub, 'parent.created', 'parent', parent.id, { email: req.body.email });
      ok(res, parent, { created: true });
    }),
  );

  router.patch(
    '/:id',
    authenticate,
    authorize('admin'),
    validate(parentUpdateSchema),
    asyncHandler(async (req, res) => {
      const existing = await svc.repo.findParentById(req.params.id);
      if (!existing) throw notFound('Parent not found');
      const parent = await svc.repo.updateParent(req.params.id, req.body);
      if (req.body.firstName || req.body.lastName || req.body.phone) {
        await svc.repo.updateUser(existing.userId, {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          phone: req.body.phone,
        });
      }
      await svc.audit.log(req.user!.sub, 'parent.updated', 'parent', parent.id, req.body);
      ok(res, parent);
    }),
  );

  router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    asyncHandler(async (req, res) => {
      await svc.repo.deleteParent(req.params.id);
      await svc.audit.log(req.user!.sub, 'parent.deleted', 'parent', req.params.id);
      ok(res, { message: 'Parent deleted' });
    }),
  );

  return router;
}
