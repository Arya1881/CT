import type { Repository } from '../repositories';
import type { RealtimeHub } from '../realtime';
import { AnalyticsService } from './analytics.service';
import { AuditService } from './audit.service';
import { AuthService } from './auth.service';
import { EmergencyService } from './emergency.service';
import { NotificationService } from './notification.service';
import { SimulationService } from './simulation.service';
import { TrackingService } from './tracking.service';

/** All application services, wired together. */
export interface AppServices {
  repo: Repository;
  hub: RealtimeHub;
  auth: AuthService;
  notifications: NotificationService;
  tracking: TrackingService;
  simulation: SimulationService;
  emergency: EmergencyService;
  audit: AuditService;
  analytics: AnalyticsService;
}

export function buildServices(repo: Repository, hub: RealtimeHub): AppServices {
  const auth = new AuthService(repo);
  const notifications = new NotificationService(repo, hub);
  const tracking = new TrackingService(repo);
  const emergency = new EmergencyService(repo, hub, notifications);
  const audit = new AuditService(repo);
  const analytics = new AnalyticsService(repo);
  const simulation = new SimulationService(repo, hub, notifications);
  return { repo, hub, auth, notifications, tracking, simulation, emergency, audit, analytics };
}
