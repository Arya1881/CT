/**
 * Socket.IO realtime hub.
 *
 * All services emit through this small interface rather than socket.io
 * directly, so the transport can be swapped (e.g. Kafka/MQTT fan-out) later
 * without touching business logic.
 */
import type { Server as HttpServer } from 'node:http';
import { Server as SocketServer } from 'socket.io';
import { config } from '../config';
import { logger } from '../utils/logger';
import { verifyToken } from '../utils/jwt';

export interface RealtimeHub {
  /** Broadcast to every connected client. */
  emit(event: string, payload: unknown): void;
  /** Send to a specific user's private room. */
  emitToUser(userId: string, event: string, payload: unknown): void;
}

export function createRealtime(httpServer: HttpServer): RealtimeHub {
  const io = new SocketServer(httpServer, {
    cors: { origin: config.corsOrigin, methods: ['GET', 'POST'], credentials: true },
    pingInterval: 25000,
    pingTimeout: 20000,
  });

  io.use((socket, next) => {
    try {
      const token = (socket.handshake.auth as { token?: string } | undefined)?.token;
      if (!token) return next(new Error('auth token required'));
      const payload = verifyToken(token);
      socket.data.userId = payload.sub;
      socket.data.role = payload.role;
      next();
    } catch {
      next(new Error('unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    socket.join(`user:${socket.data.userId}`);
    socket.join(`role:${socket.data.role}`);
    logger.debug(`[socket] connected user=${socket.data.userId} role=${socket.data.role}`);
  });

  return {
    emit: (event, payload) => {
      io.emit(event, payload);
    },
    emitToUser: (userId, event, payload) => {
      io.to(`user:${userId}`).emit(event, payload);
    },
  };
}
