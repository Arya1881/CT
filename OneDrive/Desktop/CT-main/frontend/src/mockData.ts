import type { User, Bus, Driver, Route, Stop, Student, Parent, Trip, EmergencyAlert } from './types';

export const STOPS: Stop[] = [
  { id: 'stop-1', name: 'Central Campus Terminal', lat: 12.9716, lng: 77.5946, sequenceOrder: 1, estimatedTimeFromStart: 0 },
  { id: 'stop-2', name: 'Science & Engineering Block', lat: 12.9750, lng: 77.5980, sequenceOrder: 2, estimatedTimeFromStart: 5 },
  { id: 'stop-3', name: 'North Student Hostel Circle', lat: 12.9800, lng: 77.6020, sequenceOrder: 3, estimatedTimeFromStart: 12 },
  { id: 'stop-4', name: 'Tech Park Metro Interchange', lat: 12.9850, lng: 77.6080, sequenceOrder: 4, estimatedTimeFromStart: 20 },
  { id: 'stop-5', name: 'Greenwood Suburban Residency', lat: 12.9900, lng: 77.6150, sequenceOrder: 5, estimatedTimeFromStart: 30 }
];

export const ROUTES: Route[] = [
  {
    id: 'route-101',
    name: 'City Express Corridor (Route A)',
    startLocation: 'Central Campus Terminal',
    endLocation: 'Greenwood Suburban Residency',
    distanceKm: 14.5,
    stops: STOPS
  },
  {
    id: 'route-102',
    name: 'North Campus Shuttle (Route B)',
    startLocation: 'Science & Engineering Block',
    endLocation: 'Tech Park Metro Interchange',
    distanceKm: 9.2,
    stops: [STOPS[1], STOPS[2], STOPS[3]]
  },
  {
    id: 'route-103',
    name: 'South Hostel & Medical Line (Route C)',
    startLocation: 'North Student Hostel Circle',
    endLocation: 'Central Campus Terminal',
    distanceKm: 11.0,
    stops: [STOPS[2], STOPS[1], STOPS[0]]
  },
  {
    id: 'route-104',
    name: 'West Tech Hub Express (Route D)',
    startLocation: 'Central Campus Terminal',
    endLocation: 'Tech Park Metro Interchange',
    distanceKm: 12.8,
    stops: [STOPS[0], STOPS[3], STOPS[4]]
  },
  {
    id: 'route-105',
    name: 'Ring Road Suburban Line (Route E)',
    startLocation: 'Greenwood Suburban Residency',
    endLocation: 'Science & Engineering Block',
    distanceKm: 16.0,
    stops: [STOPS[4], STOPS[3], STOPS[1]]
  }
];

export const USERS: User[] = [
  { id: 'u-admin-1', name: 'Dr. Robert Vance', email: 'admin@campustransit.edu', role: 'ADMIN', phone: '+91 98765 00001', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  { id: 'u-driver-1', name: 'Rajesh Kumar', email: 'rajesh.driver@campustransit.edu', role: 'DRIVER', phone: '+91 98765 11101', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
  { id: 'u-driver-2', name: 'Suresh Patel', email: 'suresh.driver@campustransit.edu', role: 'DRIVER', phone: '+91 98765 11102' },
  { id: 'u-driver-3', name: 'Amitabh Singh', email: 'amitabh.driver@campustransit.edu', role: 'DRIVER', phone: '+91 98765 11103' },
  { id: 'u-driver-4', name: 'Mohammad Ali', email: 'ali.driver@campustransit.edu', role: 'DRIVER', phone: '+91 98765 11104' },
  { id: 'u-driver-5', name: 'Vikram Reddy', email: 'vikram.driver@campustransit.edu', role: 'DRIVER', phone: '+91 98765 11105' },

  { id: 'u-parent-1', name: 'Sunita & Ramesh Sharma', email: 'sharma.parent@gmail.com', role: 'PARENT', phone: '+91 98111 22201', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
  { id: 'u-parent-2', name: 'Vikash Verma', email: 'verma.parent@gmail.com', role: 'PARENT', phone: '+91 98111 22202' },

  { id: 'u-student-1', name: 'Aarav Sharma', email: 'aarav.sharma@student.edu', role: 'STUDENT', phone: '+91 99000 33301', avatarUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150' },
  { id: 'u-student-2', name: 'Ananya Sharma', email: 'ananya.sharma@student.edu', role: 'STUDENT', phone: '+91 99000 33302', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150' },
  { id: 'u-student-3', name: 'Rohan Verma', email: 'rohan.verma@student.edu', role: 'STUDENT', phone: '+91 99000 33303' }
];

export const BUSES: Bus[] = [
  { id: 'bus-101', busNumber: 'Bus 101', capacity: 45, regNumber: 'KA-01-EQ-1001', driverId: 'd-1', routeId: 'route-101', status: 'IN_TRANSIT' },
  { id: 'bus-102', busNumber: 'Bus 102', capacity: 50, regNumber: 'KA-01-EQ-1002', driverId: 'd-2', routeId: 'route-102', status: 'IN_TRANSIT' },
  { id: 'bus-103', busNumber: 'Bus 103', capacity: 40, regNumber: 'KA-01-EQ-1003', driverId: 'd-3', routeId: 'route-103', status: 'IDLE' },
  { id: 'bus-104', busNumber: 'Bus 104', capacity: 55, regNumber: 'KA-01-EQ-1004', driverId: 'd-4', routeId: 'route-104', status: 'IN_TRANSIT' },
  { id: 'bus-105', busNumber: 'Bus 105', capacity: 45, regNumber: 'KA-01-EQ-1005', driverId: 'd-5', routeId: 'route-105', status: 'MAINTENANCE' }
];

export const DRIVERS: Driver[] = [
  { id: 'd-1', userId: 'u-driver-1', name: 'Rajesh Kumar', phone: '+91 98765 11101', licenseNumber: 'DL-2021-99881', busId: 'bus-101', status: 'ON_TRIP' },
  { id: 'd-2', userId: 'u-driver-2', name: 'Suresh Patel', phone: '+91 98765 11102', licenseNumber: 'DL-2020-88772', busId: 'bus-102', status: 'ON_TRIP' },
  { id: 'd-3', userId: 'u-driver-3', name: 'Amitabh Singh', phone: '+91 98765 11103', licenseNumber: 'DL-2019-77663', busId: 'bus-103', status: 'AVAILABLE' },
  { id: 'd-4', userId: 'u-driver-4', name: 'Mohammad Ali', phone: '+91 98765 11104', licenseNumber: 'DL-2022-66554', busId: 'bus-104', status: 'ON_TRIP' },
  { id: 'd-5', userId: 'u-driver-5', name: 'Vikram Reddy', phone: '+91 98765 11105', licenseNumber: 'DL-2018-55445', busId: 'bus-105', status: 'OFF_DUTY' }
];

export const STUDENTS: Student[] = [
  { id: 's-1', userId: 'u-student-1', name: 'Aarav Sharma', rollNumber: 'CS-2024-042', gradeDepartment: 'Computer Science (Yr 2)', assignedBusId: 'bus-101', assignedStopId: 'stop-3', parentUserId: 'u-parent-1', boardingStatus: 'ON_BOARD' },
  { id: 's-2', userId: 'u-student-2', name: 'Ananya Sharma', rollNumber: 'EC-2025-018', gradeDepartment: 'Electronics (Yr 1)', assignedBusId: 'bus-101', assignedStopId: 'stop-3', parentUserId: 'u-parent-1', boardingStatus: 'ON_BOARD' },
  { id: 's-3', userId: 'u-student-3', name: 'Rohan Verma', rollNumber: 'ME-2023-099', gradeDepartment: 'Mechanical Engg (Yr 3)', assignedBusId: 'bus-102', assignedStopId: 'stop-4', parentUserId: 'u-parent-2', boardingStatus: 'ON_BOARD' }
];

export const PARENTS: Parent[] = [
  { userId: 'u-parent-1', name: 'Sunita & Ramesh Sharma', phone: '+91 98111 22201', email: 'sharma.parent@gmail.com', childrenIds: ['s-1', 's-2'] },
  { userId: 'u-parent-2', name: 'Vikash Verma', phone: '+91 98111 22202', email: 'verma.parent@gmail.com', childrenIds: ['s-3'] }
];

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip-101',
    busId: 'bus-101',
    driverId: 'd-1',
    routeId: 'route-101',
    status: 'IN_TRANSIT',
    startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    currentLat: 12.9750,
    currentLng: 77.5980,
    speedKmh: 38.5,
    currentStopIndex: 1,
    nextStopName: 'North Student Hostel Circle',
    etaMinutesToNextStop: 6
  },
  {
    id: 'trip-102',
    busId: 'bus-102',
    driverId: 'd-2',
    routeId: 'route-102',
    status: 'IN_TRANSIT',
    startTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    currentLat: 12.9800,
    currentLng: 77.6020,
    speedKmh: 42.0,
    currentStopIndex: 1,
    nextStopName: 'Tech Park Metro Interchange',
    etaMinutesToNextStop: 8
  }
];

export const INITIAL_ALERTS: EmergencyAlert[] = [
  {
    id: 'alert-1',
    tripId: 'trip-101',
    busId: 'bus-101',
    triggeredByUserId: 'u-student-1',
    triggeredByName: 'Aarav Sharma',
    role: 'STUDENT',
    alertType: 'STUDENT_SAFETY',
    message: 'Medical assist requested near Hostel Stop',
    lat: 12.9780,
    lng: 77.6000,
    status: 'ACTIVE',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  }
];
