/**
 * Realtime event names shared between server engine and clients.
 * Kept as constants so future streaming backends (Kafka / MQTT) can
 * emit the identical event contract.
 */
export const EVENTS = {
  LIVE_LOCATION: 'live-location',
  TRIP_STARTED: 'trip:started',
  TRIP_COMPLETED: 'trip:completed',
  TRIP_DELAYED: 'trip:delayed',
  BUS_NEAR_STOP: 'bus:near-stop',
  NOTIFICATION: 'notification',
  EMERGENCY_ALERT: 'emergency:alert',
} as const;
