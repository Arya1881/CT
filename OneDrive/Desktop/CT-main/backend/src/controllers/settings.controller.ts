import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import type { AppServices } from '../services/container';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { settingsSchema } from '../validation/schemas';
import { asyncHandler, ok } from '../utils/asyncHandler';

const DEFAULT_SETTINGS: Record<string, string> = {
  transportServiceName: 'CampusTransit',
  universityName: 'Northgate University',
  operatingHours: '06:00 - 22:00',
  morningTripTime: '06:40',
  eveningTripTime: '15:50',
  monthlyTransportFee: '1250',
  emergencyPhone: '+91 1800-000-000',
  securityPhone: '+91 1800-000-111',
  notificationsEnabled: 'true',
  gpsSimulationEnabled: 'true',
  contactEmail: 'transport@northgate.edu',
};

export async function ensureDefaultSettings(svc: AppServices): Promise<void> {
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    const existing = await svc.repo.getSetting(key);
    if (existing === null) await svc.repo.setSetting(key, value);
  }
}

export function settingsRoutes(svc: AppServices): Router {
  const router = expressRouter();

  router.get(
    '/',
    authenticate,
    authorize('admin', 'management'),
    asyncHandler(async (req, res) => {
      const keys = await Promise.all(
        Object.keys(DEFAULT_SETTINGS).map(async (k) => [k, (await svc.repo.getSetting(k)) ?? DEFAULT_SETTINGS[k]] as const),
      );
      ok(res, Object.fromEntries(keys));
    }),
  );

  router.put(
    '/',
    authenticate,
    authorize('admin'),
    validate(settingsSchema),
    asyncHandler(async (req, res) => {
      for (const [key, value] of Object.entries(req.body)) {
        await svc.repo.setSetting(key, String(value));
      }
      await svc.audit.log(req.user!.sub, 'settings.updated', 'settings');
      ok(res, { message: 'Settings saved' });
    }),
  );

  return router;
}
