import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import type { AppServices } from '../services/container';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { delaySchema, driverCreateSchema, driverUpdateSchema } from '../validation/schemas';
import { z } from 'zod';
import { asyncHandler, ok } from '../utils/asyncHandler';
import { notFound } from '../utils/errors';
import { nowIso, uuid } from '../utils/id';
import { paginationFrom } from './helpers';

const gpsSchema = z.object({ enabled: z.boolean() });

export function driverRoutes(svc: AppServices): Router {
  const router = expressRouter();

  router.get(
    '/',
    authenticate,
    authorize('admin', 'management'),
    asyncHandler(async (req, res) => {
      const query = paginationFrom(req.query as Record<string, unknown>);
      const page = await svc.repo.listDrivers({
        page: query.page,
        pageSize: query.pageSize,
        q: (req.query.q as string) || undefined,
        status: (req.query.status as string) || undefined,
      });
      const users = await svc.repo.listUsers({ page: 1, pageSize: 500 });
      const userById = new Map(users.data.map((u) => [u.id, u]));
      const buses = (await svc.repo.listBuses({ page: 1, pageSize: 200 })).data;
      const busById = new Map(buses.map((b) => [b.id, b]));
      ok(res, {
        ...page,
        data: page.data.map((d) => ({
          ...d,
          name: userById.get(d.userId) ? `${userById.get(d.userId)!.firstName} ${userById.get(d.userId)!.lastName}` : 'Unknown',
          email: userById.get(d.userId)?.email,
          bus: d.busId ? busById.get(d.busId) ?? null : null,
        })),
      });
    }),
  );

  // Driver self view
  router.get(
    '/me',
    authenticate,
    authorize('driver'),
    asyncHandler(async (req, res) => {
      const driver = await svc.repo.findDriverByUserId(req.user!.sub);
      if (!driver) throw notFound('Driver profile not found');
      const user = await svc.repo.findUserById(driver.userId);
      const bus = driver.busId ? await svc.repo.findBusById(driver.busId) : null;
      const route = bus?.routeId ? await svc.repo.findRouteById(bus.routeId) : null;
      const stops = bus?.routeId ? await svc.repo.listStops(bus.routeId) : [];
      const activeTrips = bus ? await svc.repo.allTrips({ busId: bus.id, status: 'active' }) : [];
      const recentTrips = driver ? await svc.repo.driverTrips(driver.id, 10) : [];
      const gpsEnabled = bus ? svc.simulation.isGpsEnabled(bus.id) : false;
      ok(res, {
        ...driver,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        email: user?.email,
        avatarUrl: user?.avatarUrl,
        bus: bus
          ? {
              id: bus.id,
              plateNumber: bus.plateNumber,
              model: bus.model,
              capacity: bus.capacity,
              status: bus.status,
              fuelLevel: bus.fuelLevel,
              color: route?.color,
            }
          : null,
        route,
        stops,
        activeTrip: activeTrips[0] ?? null,
        recentTrips,
        gpsEnabled,
      });
    }),
  );

  // Trip control
  router.post(
    '/me/start-trip',
    authenticate,
    authorize('driver'),
    asyncHandler(async (req, res) => {
      const driver = await svc.repo.findDriverByUserId(req.user!.sub);
      if (!driver) throw notFound('Driver profile not found');
      const trip = await svc.simulation.startTrip(driver.id);
      ok(res, trip, { started: true });
    }),
  );

  router.post(
    '/me/stop-trip',
    authenticate,
    authorize('driver'),
    asyncHandler(async (req, res) => {
      const driver = await svc.repo.findDriverByUserId(req.user!.sub);
      if (!driver) throw notFound('Driver profile not found');
      const trip = await svc.simulation.stopTrip(driver.id);
      ok(res, trip, { stopped: true });
    }),
  );

  router.post(
    '/me/delay',
    authenticate,
    authorize('driver'),
    validate(delaySchema),
    asyncHandler(async (req, res) => {
      const driver = await svc.repo.findDriverByUserId(req.user!.sub);
      if (!driver) throw notFound('Driver profile not found');
      const trip = await svc.simulation.reportDelay(driver.id, req.body.minutes);
      ok(res, trip, { delayed: true });
    }),
  );

  router.post(
    '/me/gps',
    authenticate,
    authorize('driver'),
    validate(gpsSchema),
    asyncHandler(async (req, res) => {
      const driver = await svc.repo.findDriverByUserId(req.user!.sub);
      if (!driver) throw notFound('Driver profile not found');
      const enabled = await svc.simulation.setGpsSharing(driver.id, req.body.enabled);
      ok(res, { enabled });
    }),
  );

  router.get(
    '/me/trips',
    authenticate,
    authorize('driver'),
    asyncHandler(async (req, res) => {
      const driver = await svc.repo.findDriverByUserId(req.user!.sub);
      if (!driver) throw notFound('Driver profile not found');
      const trips = await svc.repo.driverTrips(driver.id, 50);
      const buses = (await svc.repo.listBuses({ page: 1, pageSize: 200 })).data;
      const routes = await svc.repo.listRoutes();
      const busById = new Map(buses.map((b) => [b.id, b]));
      const routeById = new Map(routes.map((r) => [r.id, r]));
      ok(res, trips.map((t) => ({ ...t, bus: busById.get(t.busId) ?? null, route: routeById.get(t.routeId) ?? null })));
    }),
  );

  router.get(
    '/:id',
    authenticate,
    authorize('admin', 'management'),
    asyncHandler(async (req, res) => {
      const driver = await svc.repo.findDriverById(req.params.id);
      if (!driver) throw notFound('Driver not found');
      const user = await svc.repo.findUserById(driver.userId);
      const bus = driver.busId ? await svc.repo.findBusById(driver.busId) : null;
      const trips = await svc.repo.driverTrips(driver.id, 20);
      ok(res, {
        ...driver,
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown',
        email: user?.email,
        phone: user?.phone,
        bus,
        recentTrips: trips,
      });
    }),
  );

  router.post(
    '/',
    authenticate,
    authorize('admin'),
    validate(driverCreateSchema),
    asyncHandler(async (req, res) => {
      const user = await svc.auth.createUserWithRole({
        email: req.body.email,
        password: req.body.password,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: 'driver',
        phone: req.body.phone,
      });
      const driver = await svc.repo.createDriver({
        id: uuid(),
        userId: user.id,
        licenseNo: req.body.licenseNo,
        phone: req.body.phone,
        busId: req.body.busId ?? undefined,
        status: 'available',
        hireDate: nowIso().slice(0, 10),
      });
      if (req.body.busId) await svc.repo.updateBus(req.body.busId, { driverId: driver.id });
      await svc.audit.log(req.user!.sub, 'driver.created', 'driver', driver.id, { email: req.body.email });
      ok(res, driver, { created: true });
    }),
  );

  router.patch(
    '/:id',
    authenticate,
    authorize('admin'),
    validate(driverUpdateSchema),
    asyncHandler(async (req, res) => {
      const existing = await svc.repo.findDriverById(req.params.id);
      if (!existing) throw notFound('Driver not found');
      const driver = await svc.repo.updateDriver(req.params.id, req.body);
      if (req.body.firstName || req.body.lastName || req.body.phone) {
        await svc.repo.updateUser(existing.userId, {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          phone: req.body.phone,
        });
      }
      await svc.audit.log(req.user!.sub, 'driver.updated', 'driver', driver.id, req.body);
      ok(res, driver);
    }),
  );

  router.delete(
    '/:id',
    authenticate,
    authorize('admin'),
    asyncHandler(async (req, res) => {
      await svc.repo.deleteDriver(req.params.id);
      await svc.audit.log(req.user!.sub, 'driver.deleted', 'driver', req.params.id);
      ok(res, { message: 'Driver deleted' });
    }),
  );

  return router;
}
