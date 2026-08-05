import path from 'node:path';
import { existsSync } from 'node:fs';
import compression from 'compression';
import cors from 'cors';
import express, { type Express } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { config } from './config';
import { analyticsRoutes } from './controllers/analytics.controller';
import { auditRoutes } from './controllers/audit.controller';
import { authRoutes } from './controllers/auth.controller';
import { busRoutes } from './controllers/bus.controller';
import { driverRoutes } from './controllers/driver.controller';
import { emergencyRoutes } from './controllers/emergency.controller';
import { notificationRoutes } from './controllers/notification.controller';
import { parentRoutes } from './controllers/parent.controller';
import { routeRoutes } from './controllers/route.controller';
import { settingsRoutes } from './controllers/settings.controller';
import { stopRoutes } from './controllers/stop.controller';
import { studentRoutes } from './controllers/student.controller';
import { trackingRoutes } from './controllers/tracking.controller';
import { tripRoutes } from './controllers/trip.controller';
import { errorHandler, notFoundHandler } from './middleware/error';
import type { AppServices } from './services/container';
import { logger } from './utils/logger';

export function createApp(svc: AppServices): Express {
  const app = express();

  app.disable('x-powered-by');
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(compression());
  if (config.isDev) app.use(morgan('dev'));
  app.use(express.json({ limit: '1mb' }));

  // Health check
  app.get('/api/health', (_req, res) => {
    res.json({ success: true, service: 'campustransit-api', uptime: process.uptime(), sim: svc.simulation.state });
  });

  // Public + auth
  app.use('/api/auth', authRoutes(svc));

  // Domain resources
  app.use('/api/buses', busRoutes(svc));
  app.use('/api/routes', routeRoutes(svc));
  app.use('/api/stops', stopRoutes(svc));
  app.use('/api/students', studentRoutes(svc));
  app.use('/api/parents', parentRoutes(svc));
  app.use('/api/drivers', driverRoutes(svc));
  app.use('/api/trips', tripRoutes(svc));
  app.use('/api/tracking', trackingRoutes(svc));
  app.use('/api/notifications', notificationRoutes(svc));
  app.use('/api/emergency', emergencyRoutes(svc));
  app.use('/api/analytics', analyticsRoutes(svc));
  app.use('/api/audit', auditRoutes(svc));
  app.use('/api/settings', settingsRoutes(svc));

  // Serve the built frontend (production / docker) with SPA fallback
  const distPath = path.resolve(__dirname, '../../frontend/dist');
  if (existsSync(path.join(distPath, 'index.html'))) {
    app.use(express.static(distPath));
    app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
    logger.info(`[http] serving frontend build from ${distPath}`);
  }

  // Error handling (must be last)
  app.use(notFoundHandler);
  app.use(errorHandler);

  logger.info('[http] routes mounted');
  return app;
}
