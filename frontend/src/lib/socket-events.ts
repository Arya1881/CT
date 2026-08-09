/** Realtime event names — must match the backend (`backend/src/realtime/events.ts`). */
export const EVENTS = {
  LIVE_LOCATION: 'live-location',
  TRIP_STARTED: 'trip:started',
  TRIP_COMPLETED: 'trip:completed',
  TRIP_DELAYED: 'trip:delayed',
  BUS_NEAR_STOP: 'bus:near-stop',
  NOTIFICATION: 'notification',
  EMERGENCY_ALERT: 'emergency:alert',
} as const;
