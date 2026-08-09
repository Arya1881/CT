import { User, Bus, Driver, Route, Stop, Student, Parent, Trip, EmergencyAlert } from './types';

// Authentic Kerala Coordinates centered around Sahrdaya College of Engineering and Technology (Kodakara, Thrissur, Kerala)
export const STOPS: Stop[] = [
  { id: 'stop-1', name: 'Sahrdaya College Main Gate (Kodakara)', lat: 10.3637, lng: 76.3262, sequenceOrder: 1, estimatedTimeFromStart: 0 },
  { id: 'stop-2', name: 'Kodakara NH-544 Junction', lat: 10.3670, lng: 76.3310, sequenceOrder: 2, estimatedTimeFromStart: 5 },
  { id: 'stop-3', name: 'Puthukkad Town Bus Stand', lat: 10.4280, lng: 76.2710, sequenceOrder: 3, estimatedTimeFromStart: 12 },
  { id: 'stop-4', name: 'Irinjalakuda Private Bus Terminal', lat: 10.3420, lng: 76.2140, sequenceOrder: 4, estimatedTimeFromStart: 20 },
  { id: 'stop-5', name: 'Chalakudy KSRTC Station', lat: 10.3070, lng: 76.3330, sequenceOrder: 5, estimatedTimeFromStart: 30 }
];

export const ROUTES: Route[] = [
  {
    id: 'route-101',
    name: 'Sahrdaya - Kodakara - Irinjalakuda Express (Route A)',
    startLocation: 'Sahrdaya College Campus (Kodakara)',
    endLocation: 'Irinjalakuda Bus Terminal',
    distanceKm: 14.5,
    stops: STOPS
  },
  {
    id: 'route-102',
    name: 'Sahrdaya - Chalakudy KSRTC Shuttle (Route B)',
    startLocation: 'Sahrdaya College Campus',
    endLocation: 'Chalakudy KSRTC Station',
    distanceKm: 9.2,
    stops: [STOPS[0], STOPS[1], STOPS[4]]
  },
  {
    id: 'route-103',
    name: 'Sahrdaya - Thrissur Swaraj Round Corridor (Route C)',
    startLocation: 'Sahrdaya College Campus',
    endLocation: 'Thrissur Sakthan Thampuran Stand',
    distanceKm: 22.0,
    stops: [STOPS[0], STOPS[1], STOPS[2], STOPS[3]]
  },
  {
    id: 'route-104',
    name: 'Sahrdaya - Angamaly Highway Line (Route D)',
    startLocation: 'Sahrdaya College Campus',
    endLocation: 'Angamaly KSRTC Station',
    distanceKm: 18.8,
    stops: [STOPS[0], STOPS[1], STOPS[4]]
  },
  {
    id: 'route-105',
    name: 'Sahrdaya - Mala Coastal Express (Route E)',
    startLocation: 'Sahrdaya College Campus',
    endLocation: 'Mala Bus Terminal',
    distanceKm: 16.0,
    stops: [STOPS[0], STOPS[3], STOPS[4]]
  }
];

export const USERS: User[] = [
  { id: 'u-mgmt-1', name: 'Dr. Elizabeth Elias (Executive Director)', email: 'director@sahrdaya.ac.in', role: 'MANAGEMENT', phone: '+91 94470 12345', avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  { id: 'u-admin-1', name: 'Prof. Jenson Jose (Transport Officer)', email: 'transport@sahrdaya.ac.in', role: 'ADMIN', phone: '+91 98460 00001', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
  { id: 'u-driver-1', name: 'Unnikrishnan Nair', email: 'unni.driver@sahrdaya.ac.in', role: 'DRIVER', phone: '+91 98471 11101' },
  { id: 'u-driver-2', name: 'Sebastian Varghese', email: 'sebastian.driver@sahrdaya.ac.in', role: 'DRIVER', phone: '+91 98471 11102' },
  { id: 'u-driver-3', name: 'Abdul Rasheed', email: 'rasheed.driver@sahrdaya.ac.in', role: 'DRIVER', phone: '+91 98471 11103' },
  { id: 'u-driver-4', name: 'Joy Thomas', email: 'joy.driver@sahrdaya.ac.in', role: 'DRIVER', phone: '+91 98471 11104' },
  { id: 'u-driver-5', name: 'Vinod Kumar', email: 'vinod.driver@sahrdaya.ac.in', role: 'DRIVER', phone: '+91 98471 11105' },

  { id: 'u-parent-1', name: 'K. R. Menon & Family', email: 'menon.parent@gmail.com', role: 'PARENT', phone: '+91 98461 22201' },
  { id: 'u-parent-2', name: 'Georgekutty Joseph', email: 'george.parent@gmail.com', role: 'PARENT', phone: '+91 98461 22202' },

  { id: 'u-student-1', name: 'Adithya Menon', email: 'adithya.scet22@sahrdaya.ac.in', role: 'STUDENT', phone: '+91 99460 33301' },
  { id: 'u-student-2', name: 'Devika Menon', email: 'devika.scet24@sahrdaya.ac.in', role: 'STUDENT', phone: '+91 99460 33302' },
  { id: 'u-student-3', name: 'Alwin George', email: 'alwin.scet23@sahrdaya.ac.in', role: 'STUDENT', phone: '+91 99460 33303' }
];

export const BUSES: Bus[] = [
  { id: 'bus-101', busNumber: 'SCET Bus 01', capacity: 55, regNumber: 'KL-45-Q-1001', driverId: 'd-1', routeId: 'route-101', status: 'IN_TRANSIT' },
  { id: 'bus-102', busNumber: 'SCET Bus 02', capacity: 50, regNumber: 'KL-45-Q-1002', driverId: 'd-2', routeId: 'route-102', status: 'IN_TRANSIT' },
  { id: 'bus-103', busNumber: 'SCET Bus 03', capacity: 45, regNumber: 'KL-45-Q-1003', driverId: 'd-3', routeId: 'route-103', status: 'IDLE' },
  { id: 'bus-104', busNumber: 'SCET Bus 04', capacity: 60, regNumber: 'KL-45-Q-1004', driverId: 'd-4', routeId: 'route-104', status: 'IN_TRANSIT' },
  { id: 'bus-105', busNumber: 'SCET Bus 05', capacity: 50, regNumber: 'KL-45-Q-1005', driverId: 'd-5', routeId: 'route-105', status: 'MAINTENANCE' }
];

export const DRIVERS: Driver[] = [
  { id: 'd-1', userId: 'u-driver-1', name: 'Unnikrishnan Nair', phone: '+91 98471 11101', licenseNumber: 'KL-08-2021-99881', busId: 'bus-101', status: 'ON_TRIP' },
  { id: 'd-2', userId: 'u-driver-2', name: 'Sebastian Varghese', phone: '+91 98471 11102', licenseNumber: 'KL-45-2020-88772', busId: 'bus-102', status: 'ON_TRIP' },
  { id: 'd-3', userId: 'u-driver-3', name: 'Abdul Rasheed', phone: '+91 98471 11103', licenseNumber: 'KL-64-2019-77663', busId: 'bus-103', status: 'AVAILABLE' },
  { id: 'd-4', userId: 'u-driver-4', name: 'Joy Thomas', phone: '+91 98471 11104', licenseNumber: 'KL-13-2022-66554', busId: 'bus-104', status: 'ON_TRIP' },
  { id: 'd-5', userId: 'u-driver-5', name: 'Vinod Kumar', phone: '+91 98471 11105', licenseNumber: 'KL-07-2018-55445', busId: 'bus-105', status: 'OFF_DUTY' }
];

export const STUDENTS: Student[] = [
  { id: 's-1', userId: 'u-student-1', name: 'Adithya Menon', rollNumber: 'SH-CSE-2022-014', gradeDepartment: 'Computer Science & Engg (Yr 3)', assignedBusId: 'bus-101', assignedStopId: 'stop-3', parentUserId: 'u-parent-1', boardingStatus: 'ON_BOARD' },
  { id: 's-2', userId: 'u-student-2', name: 'Devika Menon', rollNumber: 'SH-ECE-2024-008', gradeDepartment: 'Electronics & Comm Engg (Yr 1)', assignedBusId: 'bus-101', assignedStopId: 'stop-3', parentUserId: 'u-parent-1', boardingStatus: 'ON_BOARD' },
  { id: 's-3', userId: 'u-student-3', name: 'Alwin George', rollNumber: 'SH-BME-2023-045', gradeDepartment: 'Biomedical Engg (Yr 2)', assignedBusId: 'bus-102', assignedStopId: 'stop-4', parentUserId: 'u-parent-2', boardingStatus: 'ON_BOARD' }
];

export const PARENTS: Parent[] = [
  { userId: 'u-parent-1', name: 'K. R. Menon & Family', phone: '+91 98461 22201', email: 'menon.parent@gmail.com', childrenIds: ['s-1', 's-2'] },
  { userId: 'u-parent-2', name: 'Georgekutty Joseph', phone: '+91 98461 22202', email: 'george.parent@gmail.com', childrenIds: ['s-3'] }
];

export const INITIAL_TRIPS: Trip[] = [
  {
    id: 'trip-101',
    busId: 'bus-101',
    driverId: 'd-1',
    routeId: 'route-101',
    status: 'IN_TRANSIT',
    startTime: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    currentLat: 10.3670,
    currentLng: 76.3310,
    speedKmh: 42.5,
    currentStopIndex: 1,
    nextStopName: 'Puthukkad Town Bus Stand',
    etaMinutesToNextStop: 7
  },
  {
    id: 'trip-102',
    busId: 'bus-102',
    driverId: 'd-2',
    routeId: 'route-102',
    status: 'IN_TRANSIT',
    startTime: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    currentLat: 10.3420,
    currentLng: 76.2140,
    speedKmh: 38.0,
    currentStopIndex: 1,
    nextStopName: 'Chalakudy KSRTC Station',
    etaMinutesToNextStop: 9
  }
];

export const INITIAL_ALERTS: EmergencyAlert[] = [
  {
    id: 'alert-1',
    tripId: 'trip-101',
    busId: 'bus-101',
    triggeredByUserId: 'u-student-1',
    triggeredByName: 'Adithya Menon',
    role: 'STUDENT',
    alertType: 'STUDENT_SAFETY',
    message: 'Medical assist requested near Kodakara Junction',
    lat: 10.3670,
    lng: 76.3310,
    status: 'ACTIVE',
    timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString()
  }
];
