/** Frontend domain + API types (mirrors the backend contract). */

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

export interface PublicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  phone?: string;
  avatarUrl?: string;
}

export interface User {
  id: string;
  email: string;
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
  name?: string;
  email?: string;
}

export interface Parent {
  id: string;
  userId: string;
  childrenCount: number;
  name?: string;
  email?: string;
  phone?: string;
}

export interface Driver {
  id: string;
  userId: string;
  licenseNo: string;
  phone?: string;
  busId?: string;
  status: DriverStatus;
  hireDate: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
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
  stopsCount?: number;
  busesCount?: number;
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
  bus?: Bus | null;
  route?: Route | null;
  driver?: Driver | null;
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
  reporter?: { name: string; email: string } | null;
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

/* ------------------------------ API DTOs ------------------------------ */

export interface Page<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  meta?: Record<string, unknown>;
}

export interface AuthSession {
  token: string;
  user: PublicUser;
  profile: Record<string, any> | null;
}

export interface DriverProfile {
  id: string;
  licenseNo: string;
  phone?: string;
  status: DriverStatus;
  name?: string;
  email?: string;
  avatarUrl?: string;
  bus: (Pick<Bus, 'id' | 'plateNumber' | 'model' | 'capacity' | 'status' | 'fuelLevel'> & { color?: string }) | null;
  route: Route | null;
  stops: Stop[];
  activeTrip: Trip | null;
  recentTrips: Trip[];
  gpsEnabled: boolean;
}

export interface StudentProfile {
  id: string;
  rollNumber: string;
  department: string;
  year: number;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  bus: (Pick<Bus, 'id' | 'plateNumber' | 'model' | 'status' | 'capacity' | 'fuelLevel'> & { color?: string }) | null;
  route: Route | null;
  stop: Stop | null;
  driver: { id: string; name: string; phone?: string; avatarUrl?: string } | null;
  liveLocation: LiveLocation | null;
  activeTrip: Trip | null;
  eta: EtaResult | null;
}

export interface ParentChild {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  year: number;
  avatarUrl?: string;
  bus: (Pick<Bus, 'id' | 'plateNumber' | 'model' | 'status'> & { color?: string }) | null;
  route: Route | null;
  liveLocation: LiveLocation | null;
  eta: EtaResult | null;
  driver: { id: string; name: string; phone?: string } | null;
}

export interface ParentProfile {
  id: string;
  childrenCount: number;
  children: ParentChild[];
}

export interface BusEnriched {
  bus: Bus;
  route: Route | null;
  driver: Driver | null;
  location: LiveLocation | null;
  activeTrip: Trip | null;
  stopsCount: number;
}

export interface LiveBusView {
  bus: Bus;
  route: Route | null;
  driver: Driver | null;
  location: LiveLocation | null;
  activeTrip: Trip | null;
  color: string;
}

export interface EtaResult {
  busId: string;
  stopName: string;
  destinationName: string;
  distanceKm: number;
  minutes: number;
  atStop: boolean;
}

export interface LiveLocationEvent {
  busId: string;
  tripId?: string;
  routeId?: string;
  lat: number;
  lng: number;
  speedKmh: number;
  heading: number;
  timestamp: string;
}

export interface Overview {
  fleet: { total: number; running: number; idle: number; maintenance: number; delayed: number };
  students: number;
  drivers: number;
  driversOnDuty: number;
  activeTrips: number;
  tripsToday: number;
  delayedToday: number;
  openAlerts: number;
  onTimeRate: number;
  totalTrips30d: number;
  totalDistance30d: number;
  avgPassengers: number;
}

export interface SeriesPoint {
  label: string;
  trips: number;
  completed: number;
  delayed: number;
  avgDelay: number;
}

export interface EmergencyStats {
  total: number;
  open: number;
  resolved: number;
  investigating: number;
  byType: Record<string, number>;
}
