import type { Router } from 'express';
import { Router as expressRouter } from 'express';
import type { AppServices } from '../services/container';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  changePasswordSchema,
  forgotSchema,
  loginSchema,
  resetSchema,
  updateProfileSchema,
} from '../validation/schemas';
import { asyncHandler, ok } from '../utils/asyncHandler';

export function authRoutes(svc: AppServices): Router {
  const router = expressRouter();

  router.post(
    '/login',
    validate(loginSchema),
    asyncHandler(async (req, res) => {
      const { email, password } = req.body;
      const session = await svc.auth.login(email, password);
      ok(res, session);
    }),
  );

  router.post(
    '/forgot-password',
    validate(forgotSchema),
    asyncHandler(async (req, res) => {
      const result = await svc.auth.forgotPassword(req.body.email);
      ok(res, result);
    }),
  );

  router.post(
    '/reset-password',
    validate(resetSchema),
    asyncHandler(async (req, res) => {
      await svc.auth.resetPassword(req.body.token, req.body.newPassword);
      ok(res, { message: 'Password reset successfully. You can now log in.' });
    }),
  );

  router.get(
    '/me',
    authenticate,
    asyncHandler(async (req, res) => {
      const session = await svc.auth.me(req.user!.sub);
      ok(res, session);
    }),
  );

  router.patch(
    '/me/profile',
    authenticate,
    validate(updateProfileSchema),
    asyncHandler(async (req, res) => {
      const user = await svc.auth.updateProfile(req.user!.sub, req.body);
      ok(res, user);
    }),
  );

  router.post(
    '/me/change-password',
    authenticate,
    validate(changePasswordSchema),
    asyncHandler(async (req, res) => {
      await svc.auth.updatePassword(req.user!.sub, req.body.currentPassword, req.body.newPassword);
      ok(res, { message: 'Password changed successfully.' });
    }),
  );

  return router;
}
