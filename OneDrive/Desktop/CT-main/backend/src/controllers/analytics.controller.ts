import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import type { AppServices } from '../services/container';
import { authenticate, authorize } from '../middleware/auth';
import { asyncHandler, ok } from '../utils/asyncHandler';
import type { ReportRange } from '../services/analytics.service';

export function analyticsRoutes(svc: AppServices): Router {
  const router = expressRouter();
  const guard = [authenticate, authorize('admin', 'management')];

  router.get(
    '/overview',
    ...guard,
    asyncHandler(async (_req, res) => {
      ok(res, await svc.analytics.overview());
    }),
  );

  router.get(
    '/trips',
    ...guard,
    asyncHandler(async (req, res) => {
      const range = (req.query.range as ReportRange) || 'daily';
      ok(res, { range, series: await svc.analytics.tripSeries(range) });
    }),
  );

  router.get(
    '/driver-performance',
    ...guard,
    asyncHandler(async (_req, res) => {
      ok(res, await svc.analytics.driverPerformance());
    }),
  );

  router.get(
    '/bus-utilization',
    ...guard,
    asyncHandler(async (_req, res) => {
      ok(res, await svc.analytics.busUtilization());
    }),
  );

  router.get(
    '/student-usage',
    ...guard,
    asyncHandler(async (_req, res) => {
      ok(res, await svc.analytics.studentUsage());
    }),
  );

  router.get(
    '/route-reports',
    ...guard,
    asyncHandler(async (_req, res) => {
      ok(res, await svc.analytics.routeReports());
    }),
  );

  router.get(
    '/emergency-reports',
    ...guard,
    asyncHandler(async (_req, res) => {
      ok(res, await svc.analytics.emergencyReports());
    }),
  );

  router.get(
    '/export',
    ...guard,
    asyncHandler(async (req, res) => {
      const report = (req.query.report as string) || 'trips';
      const csv = await svc.analytics.exportCsv(report);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${report}.csv"`);
      res.send(csv);
    }),
  );

  return router;
}
