import type { EmergencyAlert, EmergencyType } from '../models/types';
import type { Page } from '../utils/pagination';
import type { Repository, ListAlertsQuery } from '../repositories';
import type { RealtimeHub } from '../realtime';
import { EVENTS } from '../realtime/events';
import { badRequest, notFound } from '../utils/errors';
import { nowIso, uuid } from '../utils/id';
import { logger } from '../utils/logger';
import type { NotificationService } from './notification.service';

export class EmergencyService {
  constructor(
    private readonly repo: Repository,
    private readonly hub: RealtimeHub,
    private readonly notifications: NotificationService,
  ) {}

  async raise(
    userId: string,
    input: { type: EmergencyType; description?: string; lat?: number; lng?: number; busId?: string; tripId?: string },
  ): Promise<EmergencyAlert> {
    const alert: EmergencyAlert = {
      id: uuid(),
      userId,
      type: input.type,
      lat: input.lat,
      lng: input.lng,
      busId: input.busId,
      tripId: input.tripId,
      description: input.description,
      status: 'open',
      createdAt: nowIso(),
    };
    const created = await this.repo.createAlert(alert);

    // Broadcast to admin + management rooms and raise a notification.
    this.hub.emit(EVENTS.EMERGENCY_ALERT, created);
    await this.notifications.broadcast('emergency', 'Emergency Alert Raised', this.summary(created), {
      busId: created.busId,
      tripId: created.tripId,
    });
    logger.warn(`[emergency] ${created.type} raised by user=${userId}`);
    return created;
  }

  async list(query: ListAlertsQuery): Promise<Page<EmergencyAlert>> {
    return this.repo.listAlerts(query);
  }

  async updateStatus(id: string, status: EmergencyAlert['status']): Promise<EmergencyAlert> {
    if (!['open', 'investigating', 'resolved'].includes(status)) throw badRequest('Invalid status');
    const existing = await this.repo.findAlertById(id);
    if (!existing) throw notFound('Alert not found');
    const updated = await this.repo.updateAlert(id, {
      status,
      ...(status === 'resolved' ? { resolvedAt: nowIso() } : {}),
    });
    this.hub.emit(EVENTS.EMERGENCY_ALERT, updated);
    return updated;
  }

  async stats(): Promise<{ total: number; open: number; resolved: number; investigating: number; byType: Record<string, number> }> {
    const alerts = (await this.repo.listAlerts({ page: 1, pageSize: 500 })).data;
    const byType: Record<string, number> = {};
    let open = 0, resolved = 0, investigating = 0;
    for (const a of alerts) {
      byType[a.type] = (byType[a.type] ?? 0) + 1;
      if (a.status === 'open') open++;
      else if (a.status === 'resolved') resolved++;
      else investigating++;
    }
    return { total: alerts.length, open, resolved, investigating, byType };
  }

  private summary(a: EmergencyAlert): string {
    const label = a.type.replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());
    return `${label} alert${a.description ? ` — ${a.description}` : ''}.`;
  }
}
