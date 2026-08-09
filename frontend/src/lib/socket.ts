import { io, type Socket } from 'socket.io-client';
import type { LiveLocationEvent, Notification, EmergencyAlert, Trip } from '@/types';
import { EVENTS } from './socket-events';

const URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:4000';

export { EVENTS };

let socket: Socket | null = null;
let connectedToken: string | null = null;

const liveMap = new Map<string, LiveLocationEvent>();
const liveListeners = new Set<() => void>();
const eventListeners = new Set<(event: string, payload: unknown) => void>();

function notifyLive(): void {
  for (const cb of liveListeners) cb();
}

function notifyEvent(event: string, payload: unknown): void {
  for (const cb of eventListeners) cb(event, payload);
}

export function connectSocket(token: string): void {
  if (socket?.connected && connectedToken === token) return;
  disconnectSocket();
  connectedToken = token;
  socket = io(URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 5,
  });

  socket.on(EVENTS.LIVE_LOCATION, (payload: LiveLocationEvent) => {
    liveMap.set(payload.busId, payload);
    notifyLive();
  });
  socket.on(EVENTS.NOTIFICATION, (payload: Notification) => notifyEvent(EVENTS.NOTIFICATION, payload));
  socket.on(EVENTS.TRIP_STARTED, (payload: { trip: Trip }) => notifyEvent(EVENTS.TRIP_STARTED, payload));
  socket.on(EVENTS.TRIP_COMPLETED, (payload: { trip: Trip }) => notifyEvent(EVENTS.TRIP_COMPLETED, payload));
  socket.on(EVENTS.TRIP_DELAYED, (payload: { delayMinutes: number }) => notifyEvent(EVENTS.TRIP_DELAYED, payload));
  socket.on(EVENTS.BUS_NEAR_STOP, (payload: { stopName: string }) => notifyEvent(EVENTS.BUS_NEAR_STOP, payload));
  socket.on(EVENTS.EMERGENCY_ALERT, (payload: EmergencyAlert) => notifyEvent(EVENTS.EMERGENCY_ALERT, payload));
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
  connectedToken = null;
  liveMap.clear();
  notifyLive();
}

export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}

/** Latest live location per bus (from socket stream). */
export function getLiveMap(): Map<string, LiveLocationEvent> {
  return new Map(liveMap);
}

export function subscribeLive(cb: () => void): () => void {
  liveListeners.add(cb);
  return () => liveListeners.delete(cb);
}

export function subscribeEvents(cb: (event: string, payload: unknown) => void): () => void {
  eventListeners.add(cb);
  return () => eventListeners.delete(cb);
}
