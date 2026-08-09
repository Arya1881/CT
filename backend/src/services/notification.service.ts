import type { Notification, NotificationType } from '../models/types';
import type { Repository } from '../repositories';
import { EVENTS } from '../realtime/events';
import type { RealtimeHub } from '../realtime';
import { nowIso, uuid } from '../utils/id';
import type { NotificationsQuery } from '../repositories';
import type { Page } from '../utils/pagination';

export interface NotificationMeta {
  busId?: string;
  tripId?: string;
}

export class NotificationService {
  constructor(
    private readonly repo: Repository,
    private readonly hub: RealtimeHub,
  ) {}

  /** Deliver to one user and push it over the realtime socket. */
  async notifyUser(userId: string, type: NotificationType, title: string, message: string, meta?: NotificationMeta): Promise<Notification> {
    const notification: Notification = {
      id: uuid(),
      userId,
      title,
      message,
      type,
      busId: meta?.busId,
      tripId: meta?.tripId,
      read: false,
      createdAt: nowIso(),
    };
    await this.repo.createNotification(notification);
    this.hub.emitToUser(userId, EVENTS.NOTIFICATION, notification);
    return notification;
  }

  /** Broadcast to every user (system announcements). */
  async broadcast(type: NotificationType, title: string, message: string, meta?: NotificationMeta): Promise<Notification> {
    const notification: Notification = {
      id: uuid(),
      title,
      message,
      type,
      busId: meta?.busId,
      tripId: meta?.tripId,
      read: false,
      createdAt: nowIso(),
    };
    await this.repo.createNotification(notification);
    this.hub.emit(EVENTS.NOTIFICATION, notification);
    return notification;
  }

  /** Notify every student on a bus plus their parents. */
  async notifyBusStakeholders(busId: string, type: NotificationType, title: string, message: string, meta?: NotificationMeta): Promise<void> {
    const riders = await this.repo.listStudents({ busId, page: 1, pageSize: 500 });
    for (const student of riders.data) {
      await this.notifyUser(student.userId, type, title, message, meta);
      if (student.parentId) {
        const parent = await this.repo.findParentById(student.parentId);
        if (parent) await this.notifyUser(parent.userId, type, title, message, meta);
      }
    }
  }

  async listForUser(userId: string, query: NotificationsQuery): Promise<Page<Notification>> {
    return this.repo.notificationsFor(userId, query);
  }

  async listAll(query: NotificationsQuery): Promise<Page<Notification>> {
    return this.repo.notificationsAll(query);
  }

  async markRead(id: string): Promise<void> {
    return this.repo.markNotificationRead(id);
  }

  async markAllRead(userId: string): Promise<void> {
    return this.repo.markAllNotificationsRead(userId);
  }

  async unread(userId: string): Promise<number> {
    return this.repo.unreadCount(userId);
  }
}
