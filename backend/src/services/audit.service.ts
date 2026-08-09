import type { AuditLog } from '../models/types';
import type { Repository } from '../repositories';
import { nowIso, uuid } from '../utils/id';

export class AuditService {
  constructor(private readonly repo: Repository) {}

  async log(userId: string | undefined, action: string, entity?: string, entityId?: string, meta: Record<string, unknown> = {}): Promise<AuditLog> {
    const entry: AuditLog = {
      id: uuid(),
      userId,
      action,
      entity,
      entityId,
      meta,
      createdAt: nowIso(),
    };
    return this.repo.createAuditLog(entry);
  }

  list(limit = 100): Promise<AuditLog[]> {
    return this.repo.auditLogs(limit);
  }
}
