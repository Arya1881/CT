export type UserRole = 'ADMIN' | 'DRIVER' | 'STUDENT' | 'PARENT';

export interface User {
  id: string;
  name: string;
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
  sequenceOrder: number;
  estimatedTimeFromStart: number;
}

export interface Route {
  id: string;
  name: string;
  startLocation: string;
  endLocation: string;
  distanceKm: number;
  stops: Stop[];
}

export interface Bus {
  id: string;
  busNumber: string;
  capacity: number;
  regNumber: string;
  driverId: string;
  routeId: string;
  status: 'IDLE' | 'IN_TRANSIT' | 'DELAYED' | 'MAINTENANCE';
}

export interface Driver {
  id: string;
  userId: string;
  name: string;
  phone: string;
  licenseNumber: string;
  busId: string;
  status: 'AVAILABLE' | 'ON_TRIP' | 'OFF_DUTY';
}

export interface Student {
  id: string;
  userId: string;
  name: string;
  rollNumber: string;
  gradeDepartment: string;
  assignedBusId: string;
  assignedStopId: string;
  parentUserId: string;
  boardingStatus: 'NOT_BOARDED' | 'ON_BOARD' | 'DROPPED_OFF';
}

export interface Parent {
  userId: string;
  name: string;
  phone: string;
  email: string;
  childrenIds: string[];
}

export interface Trip {
  id: string;
  busId: string;
  driverId: string;
  routeId: string;
  status: 'SCHEDULED' | 'IN_TRANSIT' | 'COMPLETED' | 'DELAYED';
  startTime?: string;
  endTime?: string;
  delayReason?: string;
  currentLat: number;
  currentLng: number;
  speedKmh: number;
  currentStopIndex: number;
  nextStopName: string;
  etaMinutesToNextStop: number;
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
  message: string;
  lat: number;
  lng: number;
  status: 'ACTIVE' | 'RESOLVED';
  timestamp: string;
}
