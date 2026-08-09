import { Badge } from '@/components/ui/badge';
import { BUS_STATUS, DRIVER_STATUS, EMERGENCY_STATUS, NOTIFICATION_TYPE, TRIP_STATUS } from '@/lib/format';
import type { BusStatus, DriverStatus, EmergencyStatus, NotificationType, TripStatus } from '@/types';

const toneMap: Record<string, any> = {
  default: 'default',
  success: 'success',
  warning: 'warning',
  destructive: 'destructive',
  info: 'info',
};

export function BusStatusBadge({ status }: { status: BusStatus }) {
  const s = BUS_STATUS[status];
  return <Badge tone={toneMap[s.tone]}>{s.label}</Badge>;
}

export function TripStatusBadge({ status }: { status: TripStatus }) {
  const s = TRIP_STATUS[status];
  return <Badge tone={toneMap[s.tone]}>{s.label}</Badge>;
}

export function DriverStatusBadge({ status }: { status: DriverStatus }) {
  const s = DRIVER_STATUS[status];
  return <Badge tone={toneMap[s.tone]}>{s.label}</Badge>;
}

export function NotificationTypeBadge({ type }: { type: NotificationType }) {
  const s = NOTIFICATION_TYPE[type];
  return <Badge tone={toneMap[s.tone]}>{s.label}</Badge>;
}

export function EmergencyStatusBadge({ status }: { status: EmergencyStatus }) {
  const s = EMERGENCY_STATUS[status];
  return <Badge tone={toneMap[s.tone]}>{s.label}</Badge>;
}
