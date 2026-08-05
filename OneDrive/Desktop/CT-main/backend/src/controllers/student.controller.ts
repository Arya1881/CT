import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import type { AppServices } from '../services/container';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { studentCreateSchema, studentUpdateSchema } from '../validation/schemas';
import { asyncHandler, ok } from '../utils/asyncHandler';
import { notFound } from '../utils/errors';
import { nowIso, uuid } from '../utils/id';
import { paginationFrom } from './helpers';

export function studentRoutes(svc: AppServices): Router {
  const router = expressRouter();

  router.get(
    '/',
    authenticate,
    authorize('admin', 'management'),
    asyncHandler(async (req, res) => {
      const query = paginationFrom(req.query as Record<string, unknown>);
      const page = await svc.repo.listStudents({
        page: query.page,
        pageSize: query.pageSize,
        q: (req.query.q as string) || undefined,
        department: (req.query.department as string) || undefined,
        busId: (req.query.busId as string) || undefined,
      });
      const users = await svc.repo.listUsers({ page: 1, pageSize: 500 });
      const userById = new Map(users.data.map((u) => [u.id, u]));
      ok(res, {
        ...page,
        data: page.data.map((s) => ({
          ...s,
          name: userById.get(s.userId) ? `${userById.get(s.userId)!.firstName} ${userById.get(s.userId)!.lastName}` : 'Unknown',
          email: userById.get(s.userId)?.email,
        })),
      });
    }),
  );

  // Student self profile with live tracking + ETA
  router.get(
    '/me',
    authenticate,
    authorize('student'),
    asyncHandler(async (req, res) => {
      const student = await svc.repo.findStudentByUserId(req.user!.sub);
      if (!student) throw notFound('Student profile not found');
      const bus = student.busId ? await svc.repo.findBusById(student.busId) : null;
      const route = bus?.routeId ? await svc.repo.findRouteById(bus.routeId) : null;
      const driver = bus?.driverId ? await svc.repo.findDriverById(bus.driverId) : null;
      const stop = student.stopId ? await svc.repo.findStopById(student.stopId) : null;
      const driverUser = driver ? await svc.repo.findUserById(driver.userId) : null;
      const location = student.busId ? await svc.repo.busLocation(student.busId) : null;
      const activeTrips = student.busId ? await svc.repo.allTrips({ busId: student.busId, status: 'active' }) : [];
      const eta = student.busId ? await svc.tracking.eta(student.busId, student.stopId) : null;
      const stopEta = eta;
      ok(res, {
        ...student,
        name: req.user!.email,
        bus: bus
          ? {
              id: bus.id,
              plateNumber: bus.plateNumber,
              model: bus.model,
              status: bus.status,
              capacity: bus.capacity,
              fuelLevel: bus.fuelLevel,
            }
          : null,
        route,
        stop,
        driver: driver
          ? {
              id: driver.id,
              name: driverUser ? `${driverUser.firstName} ${driverUser.lastName}` : 'Unknown',
              phone: driver.phone,
              avatarUrl: driverUser?.avatarUrl,
            }
          : null,
        liveLocation: location,
        activeTrip: activeTrips[0] ?? null,
        eta: stopEta,
      });
    }),
  );

  // Student trip history (their assigned bus)
  router.get(
    '/me/trips',
    authenticate,
    authorize('student'),
    asyncHandler(async (req, res) => {
      const student = await svc.repo.findStudentByUserId(req.user!.sub);
      if (!student) throw notFound('Student profile not found');
      if (!student.busId) return ok(res, []);
      const trips = await svc.repo.listTrips({ busId: student.busId, page: 1, pageSize: 50 });
      const [buses, routes] = await Promise.all([svc.repo.listBuses({ page: 1, pageSize: 200 }), svc.repo.listRoutes()]);
      const busById = new Map(buses.data.map((b) => [b.id, b]));
      const routeById = new Map(routes.map((r) => [r.id, r]));
      ok(
        res,
        trips.data.map((t) => ({ ...t, bus: busById.get(t.busId) ?? null, route: routeById.get(t.routeId) ?? null })),
      );
    }),
  );

  router.get(
    '/:id',
    authenticate,
    authorize('admin', 'management'),
    asyncHandler(async (req, res) => {
      const student = await svc.repo.findStudentById(req.params.id);
      if (!student) throw notFound('Student not found');
      const user = await svc.repo.findUserById(student.userId);
      ok(res, {
        ...student,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        email: user?.email,
        phone: user?.phone,
        bus: student.busId ? await svc.repo.findBusById(student.busId) : null,
        stop: student.stopId ? await svc.repo.findStopById(student.stopId) : null,
        parent: student.parentId ? await svc.repo.findParentById(student.parentId) : null,
      });
    }),
  );

  router.post(
    '/',
    authenticate,
    authorize('admin'),
    validate(studentCreateSchema),
    asyncHandler(async (req, res) => {
      const user = await svc.auth.createUserWithRole({
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: 'student',
        phone: req.body.phone,
      });
      const student = await svc.repo.createStudent({
        id: uuid(),
        userId: user.id,
        rollNumber: req.body.rollNumber,
        department: req.body.department,
        year: req.body.year,
        busId: req.body.busId ?? undefined,
        stopId: req.body.stopId ?? undefined,
        parentId: req.body.parentId ?? undefined,
        emergencyContactName: req.body.emergencyContactName,
        emergencyContactPhone: req.body.emergencyContactPhone,
        createdAt: nowIso(),
      });
      if (req.body.parentId) {
        const parent = await svc.repo.findParentById(req.body.parentId);
        if (parent) await svc.repo.updateParent(parent.id, { childrenCount: parent.childrenCount + 1 });
      }
      await svc.audit.log(req.user!.sub, 'student.created', 'student', student.id, { email: req.body.email });
      ok(res, student, { created: true });
    }),
  );

  router.patch(
    '/:id',
    authenticate,
    authorize('admin'),
    validate(studentUpdateSchema),
    asyncHandler(async (req, res) => {
      const existing = await svc.repo.findStudentById(req.params.id);
      if (!existing) throw notFound('Student not found');
      const student = await svc.repo.updateStudent(req.params.id, req.body);
      if (req.body.firstName || req.body.lastName || req.body.phone) {
        await svc.repo.updateUser(existing.userId, {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          phone: req.body.phone,
        });
      }
      await svc.audit.log(req.user!.sub, 'student.updated', 'student', student.id, req.body);
      ok(res, student);
    }),
  );

  router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    asyncHandler(async (req, res) => {
      await svc.repo.deleteStudent(req.params.id);
      await svc.audit.log(req.user!.sub, 'student.deleted', 'student', req.params.id);
      ok(res, { message: 'Student deleted' });
    }),
  );

  return router;
}
