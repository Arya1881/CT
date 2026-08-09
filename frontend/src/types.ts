export type UserRole = 'ADMIN' | 'DRIVER' | 'STUDENT' | 'PARENT' | 'MANAGEMENT' | 'admin' | 'driver' | 'student' | 'parent' | 'management';
export type Role = UserRole;

export type BusStatus = 'IDLE' | 'IN_TRANSIT' | 'DELAYED' | 'MAINTENANCE' | string;
export type DriverStatus = 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY' | string;
export type EmergencyStatus = 'ACTIVE' | 'RESOLVED' | string;
export type NotificationType = 'DELAY' | 'DEPARTURE' | 'SOS' | 'GENERAL' | string;
export type TripStatus = 'SCHEDULED' | 'IN_TRANSIT' | 'COMPLETED' | 'DELAYED' | string;

export interface AuthSession {
  token: string;
  user: User;
  profile?: any;
}

export interface PublicUser {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
}

export interface LatLng {
  lat: number;
  lng: number;
  speedKmh?: number;
  heading?: number;
  timestamp?: string;
}

export interface User {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  role: UserRole;
  phone: string;
  avatarUrl?: string;
}

export interface Stop {
  id: string;
  name: string;
  lat: number;
  lng: number;
  sequenceOrder?: number;
  orderIndex?: number;
  arrivalOffsetMin?: number;
  estimatedTimeFromStart?: number;
  routeId?: string;
}

export interface Route {
  id: string;
  name: string;
  startLocation?: string;
  endLocation?: string;
  origin?: string;
  destination?: string;
  distanceKm?: number;
  estimatedDurationMin?: number;
  color?: string;
  active?: boolean;
  stopsCount?: number;
  busesCount?: number;
  waypoints?: Array<{ lat: number; lng: number }>;
  stops: Stop[];
}

export interface Bus {
  id: string;
  busNumber: string;
  capacity: number;
  regNumber: string;
  plateNumber?: string;
  model?: string;
  fuelLevel?: number;
  driverId: string;
  routeId: string;
  status: BusStatus;
  bus?: Bus;
}

export interface Driver {
  id: string;
  userId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseNo?: string;
  hireDate?: string;
  busId: string;
  status: DriverStatus;
}

export interface Student {
  id: string;
  userId: string;
  name: string;
  email?: string;
  rollNumber: string;
  gradeDepartment?: string;
  department?: string;
  year?: string;
  assignedBusId?: string;
  assignedStopId?: string;
  busId?: string;
  stopId?: string;
  parentUserId?: string;
  parentId?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  boardingStatus?: 'NOT_BOARDED' | 'ON_BOARD' | 'DROPPED_OFF' | string;
}

export interface Parent {
  id?: string;
  userId: string;
  name: string;
  phone: string;
  email: string;
  childrenIds: string[];
}

export interface ParentChild {
  id: string;
  studentId?: string;
  name: string;
  rollNumber?: string;
  department?: string;
  year?: string;
  busId?: string;
  stopId?: string;
  bus?: Bus;
  route?: Route;
  driver?: Driver;
  liveLocation?: LatLng;
  eta?: any;
}

export interface Trip {
  id: string;
  busId: string;
  driverId: string;
  routeId: string;
  status: TripStatus;
  startTime?: string;
  endTime?: string;
  startedAt?: string;
  completedAt?: string;
  delayReason?: string;
  delayMinutes?: number;
  passengerCount?: number;
  distanceKm?: number;
  currentLat: number;
  currentLng: number;
  speedKmh: number;
  currentStopIndex: number;
  nextStopName: string;
  etaMinutesToNextStop: number;
  positions?: Array<{ lat: number; lng: number; timestamp: string }>;
  route?: Route;
  bus?: Bus;
  driver?: Driver;
}

export type SOSType = 'STUDENT_SAFETY' | 'DRIVER_BREAKDOWN' | 'DRIVER_ACCIDENT' | 'DRIVER_MEDICAL' | 'GENERAL';

export interface EmergencyAlert {
  id: string;
  tripId?: string;
  busId?: string;
  triggeredByUserId: string;
  triggeredByName: string;
  role: UserRole;
  alertType: SOSType;
  type?: string;
  reporter?: any;
  createdAt?: string;
  message: string;
  lat: number;
  lng: number;
  status: EmergencyStatus;
  timestamp: string;
}

export interface LiveLocationEvent {
  busId: string;
  lat: number;
  lng: number;
  speed: number;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  timestamp: string;
  createdAt?: string;
  entity?: string;
  meta?: any;
}

export interface LiveBusView {
  busId: string;
  busNumber: string;
  driverName: string;
  routeName: string;
  currentLat: number;
  currentLng: number;
  speed: number;
  status: BusStatus;
  location?: LatLng;
  bus?: Bus;
  route?: Route;
  driver?: Driver;
  activeTrip?: Trip;
  color?: string;
}

export interface ChildTrackingData {
  student: Student;
  bus: Bus;
  driver: Driver;
  route: Route;
  trip: Trip;
}

export type BusEnriched = Bus & { route?: Route; driver?: Driver; bus?: Bus; stopsCount?: number };
export type DriverProfile = Driver & {
  user?: User;
  bus?: Bus;
  route?: Route;
  activeTrip?: Trip;
  gpsEnabled?: boolean;
  recentTrips?: Trip[];
  stops?: Stop[];
};
export type EmergencyStats = {
  total?: number;
  open?: number;
  investigating?: number;
  resolved?: number;
  activeCount: number;
  resolvedCount: number;
};
export type Overview = {
  totalBuses: number;
  totalStudents: number;
  activeTrips: number;
  openAlerts?: number;
  totalTrips30d?: number;
  totalDistance30d?: number;
  avgPassengers?: number;
  fleet?: any;
  students?: any;
  drivers?: any;
  driversOnDuty?: any;
  tripsToday?: any;
  onTimeRate?: any;
  delayedToday?: any;
};
export type Page<T> = { items: T[]; total: number; data: T[]; totalPages: number; pageSize: number };
export type ParentProfile = Parent & { user?: User; children?: Student[] };
export type SeriesPoint = { label: string; value: number };
export type StudentProfile = Student & {
  user?: User;
  bus?: Bus;
  parent?: Parent;
  route?: Route;
  liveLocation?: LatLng;
  eta?: any;
  stop?: Stop;
  driver?: Driver;
  activeTrip?: Trip;
};
export type ApiEnvelope<T> = { success: boolean; data: T; message?: string };
