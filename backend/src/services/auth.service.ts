import type { Role, User } from '../models/types';
import type { Repository } from '../repositories';
import { badRequest, notFound, unauthorized } from '../utils/errors';
import { nowIso, uuid } from '../utils/id';
import { signToken, verifyToken } from '../utils/jwt';
import { logger } from '../utils/logger';
import { comparePassword, hashPassword } from '../utils/password';

/** Fields safe to return to the client. */
export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
}

export interface AuthSession {
  token: string;
  user: PublicUser;
  profile: Record<string, unknown> | null;
}

export interface PasswordResetToken {
  purpose: 'password-reset';
  email: string;
}

export class AuthService {
  constructor(private readonly repo: Repository) {}

  static toPublic(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
      avatarUrl: user.avatarUrl,
    };
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const user = await this.repo.findUserByEmail(email);
    if (!user) throw unauthorized('Invalid email or password');
    if (!user.isActive) throw unauthorized('Your account has been deactivated');
    const valid = await comparePassword(password, user.passwordHash);
    if (!valid) throw unauthorized('Invalid email or password');

    const token = signToken({ sub: user.id, email: user.email, role: user.role });
    const profile = await this.roleProfile(user);
    logger.info(`[auth] login ok role=${user.role} user=${user.id}`);
    return { token, user: AuthService.toPublic(user), profile };
  }

  /** Demo flow: returns the reset token directly (a real system would email it). */
  async forgotPassword(email: string): Promise<{ message: string; resetToken?: string }> {
    const user = await this.repo.findUserByEmail(email);
    if (!user) throw notFound('No account found with that email');
    const resetToken = signToken({ sub: user.id, email: user.email, role: user.role, purpose: 'password-reset' });
    return { message: 'Password reset instructions sent (demo: token returned in response).', resetToken };
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    let payload: PasswordResetToken;
    try {
      const decoded = verifyToken(token);
      if (decoded.purpose !== 'password-reset') throw new Error();
      payload = { purpose: 'password-reset', email: decoded.email };
    } catch {
      throw badRequest('Invalid or expired reset token');
    }
    const user = await this.repo.findUserByEmail(payload.email);
    if (!user) throw notFound('No account found');
    const passwordHash = await hashPassword(newPassword);
    await this.repo.updateUser(user.id, { passwordHash });
    logger.info(`[auth] password reset user=${user.id}`);
  }

  async me(userId: string): Promise<AuthSession> {
    const user = await this.repo.findUserById(userId);
    if (!user) throw notFound('User not found');
    const profile = await this.roleProfile(user);
    return { token: '', user: AuthService.toPublic(user), profile };
  }

  async updateProfile(userId: string, patch: { firstName?: string; lastName?: string; phone?: string; avatarUrl?: string }): Promise<PublicUser> {
    const updated = await this.repo.updateUser(userId, {
      ...patch,
      phone: patch.phone ?? undefined,
      avatarUrl: patch.avatarUrl ?? undefined,
    });
    return AuthService.toPublic(updated);
  }

  async updatePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await this.repo.findUserById(userId);
    if (!user) throw notFound('User not found');
    const valid = await comparePassword(currentPassword, user.passwordHash);
    if (!valid) throw badRequest('Current password is incorrect');
    await this.repo.updateUser(userId, { passwordHash: await hashPassword(newPassword) });
  }

  /** Role-specific profile payload attached to the auth session. */
  async roleProfile(user: User): Promise<Record<string, unknown> | null> {
    switch (user.role) {
      case 'student': {
        const student = await this.repo.findStudentByUserId(user.id);
        if (!student) return null;
        const bus = student.busId ? await this.repo.findBusById(student.busId) : null;
        const route = bus?.routeId ? await this.repo.findRouteById(bus.routeId) : null;
        const driver = bus?.driverId ? await this.repo.findDriverById(bus.driverId) : null;
        const stop = student.stopId ? await this.repo.findStopById(student.stopId) : null;
        return {
          id: student.id,
          rollNumber: student.rollNumber,
          department: student.department,
          year: student.year,
          emergencyContactName: student.emergencyContactName,
          emergencyContactPhone: student.emergencyContactPhone,
          bus: bus
            ? {
                id: bus.id,
                plateNumber: bus.plateNumber,
                model: bus.model,
                status: bus.status,
                color: route?.color,
              }
            : null,
          route: route
            ? { id: route.id, name: route.name, origin: route.origin, destination: route.destination, color: route.color }
            : null,
          stop: stop ? { id: stop.id, name: stop.name, orderIndex: stop.orderIndex } : null,
          driver: driver
            ? {
                id: driver.id,
                name: await this.userName(driver.userId),
                phone: driver.phone,
              }
            : null,
        };
      }
      case 'parent': {
        const parent = await this.repo.findParentByUserId(user.id);
        if (!parent) return null;
        const children = await this.repo.childrenOfParent(parent.id);
        const childrenWithBus = await Promise.all(
          children.map(async (c) => {
            const bus = c.busId ? await this.repo.findBusById(c.busId) : null;
            const route = bus?.routeId ? await this.repo.findRouteById(bus.routeId) : null;
            return {
              id: c.id,
              name: await this.userName(c.userId),
              rollNumber: c.rollNumber,
              department: c.department,
              year: c.year,
              busId: c.busId,
              bus: bus ? { id: bus.id, plateNumber: bus.plateNumber, model: bus.model, status: bus.status, color: route?.color } : null,
              route: route ? { id: route.id, name: route.name, origin: route.origin, destination: route.destination, color: route.color } : null,
            };
          }),
        );
        return { id: parent.id, childrenCount: parent.childrenCount, children: childrenWithBus };
      }
      case 'driver': {
        const driver = await this.repo.findDriverByUserId(user.id);
        if (!driver) return null;
        const bus = driver.busId ? await this.repo.findBusById(driver.busId) : null;
        const route = bus?.routeId ? await this.repo.findRouteById(bus.routeId) : null;
        return {
          id: driver.id,
          licenseNo: driver.licenseNo,
          phone: driver.phone,
          status: driver.status,
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
          route: route ? { id: route.id, name: route.name, origin: route.origin, destination: route.destination, color: route.color, distanceKm: route.distanceKm, estimatedDurationMin: route.estimatedDurationMin } : null,
        };
      }
      default:
        return null;
    }
  }

  private async userName(userId: string): Promise<string> {
    const u = await this.repo.findUserById(userId);
    return u ? `${u.firstName} ${u.lastName}` : 'Unknown';
  }

  async createUserWithRole(
    input: { email: string; password: string; firstName: string; lastName: string; role: Role; phone?: string; avatarUrl?: string },
  ): Promise<User> {
    const existing = await this.repo.findUserByEmail(input.email);
    if (existing) throw badRequest('A user with that email already exists');
    const user: User = {
      id: uuid(),
      email: input.email.toLowerCase(),
      passwordHash: await hashPassword(input.password),
      firstName: input.firstName,
      lastName: input.lastName,
      role: input.role,
      phone: input.phone,
      avatarUrl: input.avatarUrl,
      isActive: true,
      createdAt: nowIso(),
    };
    return this.repo.createUser(user);
  }
}
