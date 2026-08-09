/**
 * CampusTransit — shared domain types.
 * Single source of truth for all entities used by the backend.
 */

export type Role = 'student' | 'parent' | 'driver' | 'admin' | 'management';
export type BusStatus = 'idle' | 'running' | 'maintenance' | 'delayed';
export type TripStatus = 'scheduled' | 'active' | 'completed' | 'cancelled' | 'delayed';
export type DriverStatus = 'available' | 'on_duty' | 'off_duty';
export type NotificationType =
  | 'trip_started'
  | 'trip_completed'
  | 'bus_delayed'
  | 'bus_near_stop'
  | 'emergency'
  | 'system';
export type EmergencyType = 'panic' | 'accident' | 'medical' | 'safety' | 'breakdown' | 'other';
export type EmergencyStatus = 'open' | 'investigating' | 'resolved';

export interface LatLng {
  lat: number;
  lng: number;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  userId: string;
  rollNumber: string;
  department: string;
  year: number;
  busId?: string;
  stopId?: string;
  parentId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: string;
}

export interface Parent {
  id: string;
  userId: string;
  childrenCount: number;
}

export interface Driver {
  id: string;
  userId: string;
  licenseNo: string;
  phone?: string;
  busId?: string;
  status: DriverStatus;
  hireDate: string;
}

export interface Bus {
  id: string;
  plateNumber: string;
  model: string;
  capacity: number;
  status: BusStatus;
  routeId?: string;
  driverId?: string;
  fuelLevel: number;
  lastMaintenance: string;
  currentLat?: number;
  currentLng?: number;
  createdAt: string;
}

export interface Route {
  id: string;
  name: string;
  description?: string;
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedDurationMin: number;
  color: string;
  waypoints: LatLng[];
  active: boolean;
  createdAt: string;
}

export interface Stop {
  id: string;
  routeId: string;
  name: string;
  lat: number;
  lng: number;
  orderIndex: number;
  arrivalOffsetMin: number;
  createdAt: string;
}

export interface LiveLocation {
  id: string;
  busId: string;
  routeId?: string;
  tripId?: string;
  lat: number;
  lng: number;
  speedKmh: number;
  heading: number;
  timestamp: string;
}

export interface Trip {
  id: string;
  busId: string;
  routeId: string;
  driverId?: string;
  startedAt: string;
  completedAt?: string;
  status: TripStatus;
  passengerCount: number;
  delayMinutes: number;
  distanceKm: number;
  startLat?: number;
  startLng?: number;
  endLat?: number;
  endLng?: number;
}

export interface Notification {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: NotificationType;
  busId?: string;
  tripId?: string;
  read: boolean;
  createdAt: string;
}

export interface EmergencyAlert {
  id: string;
  userId: string;
  type: EmergencyType;
  lat?: number;
  lng?: number;
  busId?: string;
  tripId?: string;
  description?: string;
  status: EmergencyStatus;
  resolvedAt?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  entity?: string;
  entityId?: string;
  meta: Record<string, unknown>;
  createdAt: string;
}

/** Full dataset returned by the seed generator. */
export interface SeedData {
  users: User[];
  students: Student[];
  parents: Parent[];
  drivers: Driver[];
  buses: Bus[];
  routes: Route[];
  stops: Stop[];
  studentBus: { studentId: string; busId: string; routeId: string }[];
  trips: Trip[];
  liveLocations: LiveLocation[];
  notifications: Notification[];
  emergencyAlerts: EmergencyAlert[];
  auditLogs: AuditLog[];
}
