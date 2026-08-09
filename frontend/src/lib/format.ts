import type { BusStatus, DriverStatus, EmergencyStatus, NotificationType, TripStatus } from '@/types';

/** Format an ISO timestamp as a local date-time string. */
export function formatDateTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTime(iso: string | undefined | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(iso: string | undefined | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Relative time like "5 min ago". */
export function timeAgo(iso: string | undefined | null): string {
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '—';
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

/** "12.4 km" */
export function km(value: number | undefined | null): string {
  if (value === undefined || value === null || Number.isNaN(value)) return '—';
  return `${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 1 })} km`;
}

export function minutesToLabel(minutes: number | undefined | null): string {
  if (minutes === undefined || minutes === null) return '—';
  if (minutes === 0) return 'Arrived';
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}

export function durationMin(minutes: number | undefined | null): string {
  return minutesToLabel(minutes);
}

export function initials(first: string | undefined, last: string | undefined): string {
  return `${(first?.[0] ?? '').toUpperCase()}${(last?.[0] ?? '').toUpperCase()}` || '?';
}

/* ------------------------------- status maps ------------------------------- */

export const BUS_STATUS: Record<BusStatus, { label: string; tone: 'default' | 'success' | 'warning' | 'destructive' | 'info' }> = {
  idle: { label: 'Idle', tone: 'default' },
  running: { label: 'Running', tone: 'success' },
  maintenance: { label: 'Maintenance', tone: 'warning' },
  delayed: { label: 'Delayed', tone: 'destructive' },
};

export const TRIP_STATUS: Record<TripStatus, { label: string; tone: 'default' | 'success' | 'warning' | 'destructive' | 'info' }> = {
  scheduled: { label: 'Scheduled', tone: 'default' },
  active: { label: 'Active', tone: 'success' },
  completed: { label: 'Completed', tone: 'info' },
  cancelled: { label: 'Cancelled', tone: 'destructive' },
  delayed: { label: 'Delayed', tone: 'warning' },
};

export const DRIVER_STATUS: Record<DriverStatus, { label: string; tone: 'default' | 'success' | 'warning' }> = {
  available: { label: 'Available', tone: 'success' },
  on_duty: { label: 'On Duty', tone: 'info' as any },
  off_duty: { label: 'Off Duty', tone: 'default' },
};

export const NOTIFICATION_TYPE: Record<NotificationType, { label: string; tone: 'default' | 'success' | 'warning' | 'destructive' | 'info' }> = {
  trip_started: { label: 'Trip Started', tone: 'success' },
  trip_completed: { label: 'Trip Completed', tone: 'info' },
  bus_delayed: { label: 'Bus Delayed', tone: 'warning' },
  bus_near_stop: { label: 'Near Stop', tone: 'info' },
  emergency: { label: 'Emergency', tone: 'destructive' },
  system: { label: 'System', tone: 'default' },
};

export const EMERGENCY_STATUS: Record<EmergencyStatus, { label: string; tone: 'default' | 'success' | 'warning' | 'destructive' }> = {
  open: { label: 'Open', tone: 'destructive' },
  investigating: { label: 'Investigating', tone: 'warning' },
  resolved: { label: 'Resolved', tone: 'success' },
};
