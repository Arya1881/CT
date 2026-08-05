/**
 * CampusTransit — deterministic seed data generator.
 *
 * Produces the full demo dataset (users, students, parents, drivers,
 * buses, routes, stops, trips, notifications, alerts) so that:
 *   - the in-memory repository can boot instantly with zero infra, and
 *   - the Postgres seed script can write the identical dataset.
 *
 * All ids are deterministic, valid UUIDs. All randomness uses a seeded
 * PRNG so the dataset is reproducible.
 */

import type {
  Bus,
  Driver,
  EmergencyAlert,
  LatLng,
  LiveLocation,
  Notification,
  Parent,
  Role,
  Route,
  SeedData,
  Stop,
  Student,
  Trip,
  User,
} from '../models/types';

/* ------------------------------------------------------------------ */
/* Seeded PRNG                                                         */
/* ------------------------------------------------------------------ */

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rng = mulberry32(20260803);

function pick<T>(arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)];
}

function int(min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

function chance(p: number): boolean {
  return rng() < p;
}

function round(n: number, dp = 2): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}

/* ------------------------------------------------------------------ */
/* Ids                                                                 */
/* ------------------------------------------------------------------ */

let idCounter = 1;
function uid(): string {
  return `00000000-0000-0000-0000-${String(idCounter++).padStart(12, '0')}`;
}

/* ------------------------------------------------------------------ */
/* Geospatial helpers                                                  */
/* ------------------------------------------------------------------ */

const CAMPUS_CENTER: LatLng = { lat: 28.6139, lng: 77.209 };
const CAMPUS_NAME = 'Northgate University';

function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function waypointsAlong(start: LatLng, end: LatLng, count: number): LatLng[] {
  const pts: LatLng[] = [];
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const lat = start.lat + (end.lat - start.lat) * t + (rng() - 0.5) * 0.0038;
    const lng = start.lng + (end.lng - start.lng) * t + (rng() - 0.5) * 0.0042;
    pts.push({ lat: round(lat, 5), lng: round(lng, 5) });
  }
  pts[0] = start;
  pts[count - 1] = end;
  return pts;
}

/* ------------------------------------------------------------------ */
/* Reference data                                                      */
/* ------------------------------------------------------------------ */

const ROUTE_DEFS: Array<{ name: string; dest: LatLng; destName: string; color: string }> = [
  { name: 'Route A', dest: { lat: 28.6519, lng: 77.1909 }, destName: 'Karol Bagh', color: '#2563EB' },
  { name: 'Route B', dest: { lat: 28.6523, lng: 77.1229 }, destName: 'Rajouri Garden', color: '#10B981' },
  { name: 'Route C', dest: { lat: 28.5921, lng: 77.046 }, destName: 'Dwarka', color: '#F59E0B' },
  { name: 'Route D', dest: { lat: 28.5245, lng: 77.2065 }, destName: 'Saket', color: '#EF4444' },
  { name: 'Route E', dest: { lat: 28.5677, lng: 77.2472 }, destName: 'Lajpat Nagar', color: '#8B5CF6' },
  { name: 'Route F', dest: { lat: 28.7387, lng: 77.0832 }, destName: 'Rohini', color: '#EC4899' },
  { name: 'Route G', dest: { lat: 28.6103, lng: 77.2913 }, destName: 'Mayur Vihar', color: '#14B8A6' },
  { name: 'Route H', dest: { lat: 28.5245, lng: 77.1576 }, destName: 'Vasant Kunj', color: '#F97316' },
  { name: 'Route I', dest: { lat: 28.667, lng: 77.2289 }, destName: 'Kashmere Gate', color: '#6366F1' },
  { name: 'Route J', dest: { lat: 28.4595, lng: 77.0266 }, destName: 'Gurugram', color: '#22C55E' },
];

const DRIVER_NAMES = [
  'Rajesh Kumar', 'Sunil Verma', 'Amit Singh', 'Vikram Yadav', 'Manoj Sharma',
  'Rakesh Gupta', 'Sanjay Mehta', 'Dinesh Nair', 'Prakash Joshi', 'Harpreet Singh',
];

const STUDENT_FIRST = [
  'Aarav', 'Vivaan', 'Aditya', 'Ananya', 'Diya', 'Ishaan', 'Kabir', 'Kavya', 'Laksh', 'Mira',
  'Nikhil', 'Priya', 'Rahul', 'Sanya', 'Tanvi', 'Uday', 'Vedant', 'Zara', 'Aisha', 'Dev',
  'Esha', 'Farhan', 'Gauri', 'Harsh', 'Ira', 'Jatin', 'Kiara', 'Lavanya', 'Mohit', 'Nisha',
  'Om', 'Pranav', 'Riya', 'Sahil', 'Tara', 'Umang', 'Vani', 'Yash', 'Anjali', 'Bhuvan',
];

const STUDENT_LAST = [
  'Sharma', 'Verma', 'Gupta', 'Singh', 'Patel', 'Kumar', 'Mehta', 'Nair', 'Reddy', 'Joshi',
  'Das', 'Bose', 'Kapoor', 'Malhotra', 'Chopra', 'Agarwal', 'Iyer', 'Menon', 'Bhat', 'Sen',
  'Pillai', 'Chawla', 'Saxena', 'Tandon', 'Bajaj', 'Sethi', 'Kohli', 'Gill', 'Bedi', 'Rao',
];

const PARENT_FIRST = [
  'Ramesh', 'Suresh', 'Rajiv', 'Anil', 'Neeraj', 'Ashok', 'Vivek', 'Gopal', 'Mahesh', 'Kiran',
  'Pooja', 'Sunita', 'Rekha', 'Meenakshi', 'Shalini', 'Deepa', 'Nandini', 'Kavita', 'Ritu', 'Geeta',
];

const DEPARTMENTS = [
  'Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Electrical',
  'Business Admin', 'MBA', 'BCA', 'Architecture', 'Biotechnology',
];

const BUS_MODELS = [
  'Tata Starbus', 'Ashok Leyland Viking', 'BharatBenz', 'Eicher Skyline', 'TATA Marcopolo',
  'Force Traveller', 'Volvo 9400', 'Swaraj Mazda', 'Mahindra Cruzio', 'Eicher Pro 3015',
];

/* ------------------------------------------------------------------ */
/* Demo credentials (documented on the login page)                     */
/* ------------------------------------------------------------------ */

export const DEMO_CREDENTIALS: Record<Role, { email: string; password: string }> = {
  student: { email: 'student1@campustransit.app', password: 'Student@123' },
  parent: { email: 'parent1@campustransit.app', password: 'Parent@123' },
  driver: { email: 'driver1@campustransit.app', password: 'Driver@123' },
  admin: { email: 'admin@campustransit.app', password: 'Admin@123' },
  management: { email: 'management@campustransit.app', password: 'Management@123' },
};

const DEFAULT_PASSWORD: Record<Role, string> = {
  student: 'Student@123',
  parent: 'Parent@123',
  driver: 'Driver@123',
  admin: 'Admin@123',
  management: 'Management@123',
};

/* ------------------------------------------------------------------ */
/* Generator                                                           */
/* ------------------------------------------------------------------ */

export async function buildSeed(hash: (password: string) => Promise<string>): Promise<SeedData> {
  idCounter = 1;

  const users: User[] = [];
  const students: Student[] = [];
  const parents: Parent[] = [];
  const drivers: Driver[] = [];
  const buses: Bus[] = [];
  const routes: Route[] = [];
  const stops: Stop[] = [];
  const studentBus: { studentId: string; busId: string; routeId: string }[] = [];
  const trips: Trip[] = [];
  const liveLocations: LiveLocation[] = [];
  const notifications: Notification[] = [];
  const emergencyAlerts: EmergencyAlert[] = [];

  const now = new Date();
  const iso = (d: Date) => d.toISOString();

  const roleHash: Partial<Record<Role, string>> = {};
  async function hashFor(role: Role): Promise<string> {
    if (!roleHash[role]) roleHash[role] = await hash(DEFAULT_PASSWORD[role]);
    return roleHash[role];
  }

  function makeUser(role: Role, email: string, firstName: string, lastName: string, phone: string, extra?: Partial<User>): User {
    const u: User = {
      id: uid(),
      email,
      passwordHash: '', // filled below
      firstName,
      lastName,
      role,
      phone,
      isActive: true,
      createdAt: iso(new Date(now.getTime() - int(5, 90) * 864e5)),
      ...extra,
    };
    users.push(u);
    return u;
  }

  /* --- Routes + stops ------------------------------------------------ */
  const routeWaypoints: LatLng[][] = [];
  for (const def of ROUTE_DEFS) {
    const wp = waypointsAlong(CAMPUS_CENTER, def.dest, 7);
    routeWaypoints.push(wp);
    const straight = haversineKm(CAMPUS_CENTER, def.dest);
    const distanceKm = round(straight * 1.35, 2);
    const estimatedDurationMin = Math.round((distanceKm / 28) * 60) + int(2, 8);

    routes.push({
      id: uid(),
      name: def.name,
      description: `Shuttle from ${CAMPUS_NAME} to ${def.destName} and back.`,
      origin: `${CAMPUS_NAME} Main Gate`,
      destination: `${def.destName} Terminal`,
      distanceKm,
      estimatedDurationMin,
      color: def.color,
      waypoints: wp,
      active: true,
      createdAt: iso(now),
    });
  }

  // 5 stops per route: campus gate, 3 mid stops, destination
  for (const route of routes) {
    const wp = route.waypoints;
    const stopNames = [`${route.name} — Campus Gate`, `Mid 1 · ${route.destination.split(' ')[0]} Rd`, `Mid 2 · Sector Plaza`, `Mid 3 · Metro Junction`, route.destination];
    const count = stopNames.length;
    for (let s = 0; s < count; s++) {
      const t = s / (count - 1);
      const idx = Math.min(wp.length - 1, Math.round(t * (wp.length - 1)));
      stops.push({
        id: uid(),
        routeId: route.id,
        name: stopNames[s],
        lat: wp[idx].lat,
        lng: wp[idx].lng,
        orderIndex: s,
        arrivalOffsetMin: Math.round((route.estimatedDurationMin * t) / 5) * 5,
        createdAt: iso(now),
      });
    }
  }

  /* --- Drivers + buses ------------------------------------------------ */
  for (let i = 0; i < ROUTE_DEFS.length; i++) {
    const [first, last] = DRIVER_NAMES[i].split(' ');
    const driverUser = makeUser('driver', `driver${i + 1}@campustransit.app`, first, last, `+91 98${String(int(10000000, 99999999))}`, {
      avatarUrl: `https://i.pravatar.cc/150?img=${i + 12}`,
    });
    const driver: Driver = {
      id: uid(),
      userId: driverUser.id,
      licenseNo: `DL2024-${String(1000 + i)}`,
      phone: driverUser.phone,
      status: 'available',
      hireDate: iso(new Date(now.getTime() - int(120, 900) * 864e5)),
    };
    drivers.push(driver);

    const bus: Bus = {
      id: uid(),
      plateNumber: `DL-01-${String.fromCharCode(65 + i)}A-${String(1001 + i * 37)}`,
      model: BUS_MODELS[i],
      capacity: int(40, 60),
      status: 'idle',
      routeId: routes[i].id,
      driverId: driver.id,
      fuelLevel: int(45, 100),
      lastMaintenance: iso(new Date(now.getTime() - int(3, 40) * 864e5)),
      currentLat: routes[i].waypoints[0].lat,
      currentLng: routes[i].waypoints[0].lng,
      createdAt: iso(now),
    };
    buses.push(bus);
    driver.busId = bus.id;

    liveLocations.push({
      id: uid(),
      busId: bus.id,
      routeId: routes[i].id,
      lat: bus.currentLat!,
      lng: bus.currentLng!,
      speedKmh: 0,
      heading: 0,
      timestamp: iso(now),
    });
  }

  /* --- Parents -------------------------------------------------------- */
  for (let p = 0; p < 20; p++) {
    const parentUser = makeUser('parent', `parent${p + 1}@campustransit.app`, PARENT_FIRST[p], STUDENT_LAST[int(0, STUDENT_LAST.length - 1)], `+91 91${String(int(10000000, 99999999))}`);
    parents.push({ id: uid(), userId: parentUser.id, childrenCount: 0 });
  }

  /* --- Students ------------------------------------------------------- */
  for (let s = 0; s < 100; s++) {
    const firstName = STUDENT_FIRST[s % STUDENT_FIRST.length];
    const lastName = STUDENT_LAST[int(0, STUDENT_LAST.length - 1)];
    const dept = DEPARTMENTS[s % DEPARTMENTS.length];
    const year = (s % 4) + 1;
    const busIdx = s % buses.length;
    const bus = buses[busIdx];
    const parent = s < 95 ? parents[Math.floor(s / 5)] : undefined;

    const studentUser = makeUser('student', `student${s + 1}@campustransit.app`, firstName, lastName, `+91 99${String(int(10000000, 99999999))}`, {
      avatarUrl: `https://i.pravatar.cc/150?img=${s % 70}`,
    });

    const student: Student = {
      id: uid(),
      userId: studentUser.id,
      rollNumber: `APU${new Date().getFullYear() - 1}${dept.slice(0, 3).toUpperCase()}${String(101 + s).padStart(3, '0')}`,
      department: dept,
      year,
      busId: bus.id,
      stopId: stops.filter((st) => st.routeId === bus.routeId)[s % 5].id,
      parentId: parent?.id,
      emergencyContactName: parent ? `${parent.userId ? PARENT_FIRST[parents.indexOf(parent)] : ''}` : undefined,
      emergencyContactPhone: parent ? parent.userId : undefined,
      createdAt: iso(new Date(now.getTime() - int(20, 180) * 864e5)),
    };
    students.push(student);
    studentBus.push({ studentId: student.id, busId: bus.id, routeId: bus.routeId! });
    if (parent) parent.childrenCount += 1;
  }

  // emergency contact names on students (set to their parent's name)
  students.forEach((st, i) => {
    if (st.parentId) {
      const parentIdx = parents.findIndex((p) => p.id === st.parentId);
      if (parentIdx >= 0) {
        const pu = users.find((u) => u.id === parents[parentIdx].userId)!;
        st.emergencyContactName = `${pu.firstName} ${pu.lastName}`;
        st.emergencyContactPhone = pu.phone;
      }
    }
  });

  /* --- Admin + Management --------------------------------------------- */
  makeUser('admin', DEMO_CREDENTIALS.admin.email, 'Arjun', 'Nambiar', '+91 9810010001', {
    avatarUrl: 'https://i.pravatar.cc/150?img=68',
  });
  makeUser('management', DEMO_CREDENTIALS.management.email, 'Meera', 'Kulkarni', '+91 9810010002', {
    avatarUrl: 'https://i.pravatar.cc/150?img=47',
  });

  /* --- Trip history (30 days) ----------------------------------------- */
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tripStart = (day: Date, hour: number, minute: number) =>
    new Date(day.getFullYear(), day.getMonth(), day.getDate(), hour, minute + int(0, 15), 0, 0);

  for (let d = 1; d <= 30; d++) {
    const day = new Date(todayMidnight.getTime() - d * 864e5);
    const dow = day.getDay();
    if (dow === 0 || dow === 6) continue; // weekend
    if (chance(0.04)) continue; // a cancelled-ish gap

    for (const bus of buses) {
      const route = routes.find((r) => r.id === bus.routeId)!;
      const driver = drivers.find((dr) => dr.id === bus.driverId)!;
      const delay = chance(0.18) ? int(5, 28) : 0;

      for (const slot of ['morning', 'evening'] as const) {
        if (chance(0.06)) continue;
        const start = tripStart(day, slot === 'morning' ? 6 : 15, slot === 'morning' ? 40 : 50);
        const duration = route.estimatedDurationMin + delay + int(-2, 6);
        const end = new Date(start.getTime() + duration * 60000);

        trips.push({
          id: uid(),
          busId: bus.id,
          routeId: route.id,
          driverId: driver.id,
          startedAt: iso(start),
          completedAt: iso(end),
          status: 'completed',
          passengerCount: Math.round(bus.capacity * (0.55 + rng() * 0.4)),
          delayMinutes: delay,
          distanceKm: round(route.distanceKm * (0.97 + rng() * 0.06), 2),
          startLat: route.waypoints[0].lat,
          startLng: route.waypoints[0].lng,
          endLat: route.waypoints[route.waypoints.length - 1].lat,
          endLng: route.waypoints[route.waypoints.length - 1].lng,
        });
      }
    }
  }

  /* --- Notifications ---------------------------------------------------- */
  const recentTrips = trips.filter((t) => Date.now() - new Date(t.startedAt).getTime() < 7 * 864e5);
  for (const t of recentTrips) {
    const bus = buses.find((b) => b.id === t.busId)!;
    const route = routes.find((r) => r.id === t.routeId)!;
    const rider = students.find((st) => st.busId === t.busId);
    if (rider) {
      const riderUser = users.find((u) => u.id === rider.userId)!;
      notifications.push({
        id: uid(),
        userId: riderUser.id,
        title: 'Trip Started',
        message: `Bus ${bus.plateNumber} (${route.name}) has started its trip.`,
        type: 'trip_started',
        busId: bus.id,
        tripId: t.id,
        read: chance(0.4),
        createdAt: iso(new Date(new Date(t.startedAt).getTime() - 5 * 60000)),
      });
      notifications.push({
        id: uid(),
        userId: riderUser.id,
        title: 'Trip Completed',
        message: `Bus ${bus.plateNumber} (${route.name}) has completed its trip.`,
        type: 'trip_completed',
        busId: bus.id,
        tripId: t.id,
        read: chance(0.4),
        createdAt: iso(new Date(t.completedAt || t.startedAt)),
      });
      if (t.delayMinutes > 0) {
        notifications.push({
          id: uid(),
          userId: riderUser.id,
          title: 'Bus Delayed',
          message: `Your bus (${bus.plateNumber}) is delayed by ~${t.delayMinutes} minutes.`,
          type: 'bus_delayed',
          busId: bus.id,
          tripId: t.id,
          read: chance(0.3),
          createdAt: iso(new Date(new Date(t.startedAt).getTime() - 5 * 60000)),
        });
      }
    }
  }

  // system announcements
  notifications.push(
    {
      id: uid(),
      title: 'System Announcement',
      message: 'CampusTransit is now live. Welcome aboard!',
      type: 'system',
      read: false,
      createdAt: iso(new Date(now.getTime() - 2 * 864e5)),
    },
    {
      id: uid(),
      title: 'Holiday Notice',
      message: 'Transport will operate on a reduced schedule this weekend.',
      type: 'system',
      read: false,
      createdAt: iso(new Date(now.getTime() - 6 * 864e5)),
    },
  );

  /* --- Emergency alerts -------------------------------------------------- */
  const alertDefs: Array<{ type: EmergencyAlert['type']; daysAgo: number; status: EmergencyAlert['status']; desc: string }> = [
    { type: 'panic', daysAgo: 1, status: 'open', desc: 'Student pressed panic button near Sector 15 stop.' },
    { type: 'breakdown', daysAgo: 3, status: 'resolved', desc: 'Bus DL-01-AA-1001 reported engine trouble.' },
    { type: 'medical', daysAgo: 5, status: 'resolved', desc: 'Passenger felt unwell; attended by crew.' },
    { type: 'accident', daysAgo: 9, status: 'resolved', desc: 'Minor side-swipe near Metro Junction; no injuries.' },
    { type: 'safety', daysAgo: 12, status: 'resolved', desc: 'Unattended bag reported; cleared by security.' },
    { type: 'breakdown', daysAgo: 16, status: 'resolved', desc: 'Flat tyre on Route F shuttle.' },
    { type: 'medical', daysAgo: 22, status: 'resolved', desc: 'Driver reported fatigue; relief arranged.' },
    { type: 'other', daysAgo: 27, status: 'resolved', desc: 'Route deviation reported by passenger.' },
  ];
  for (let i = 0; i < alertDefs.length; i++) {
    const def = alertDefs[i];
    const reporter = users.filter((u) => u.role === 'student')[i * 7 % 95];
    const bus = buses[i % buses.length];
    const created = new Date(now.getTime() - def.daysAgo * 864e5 - int(1, 5) * 3600e3);
    emergencyAlerts.push({
      id: uid(),
      userId: reporter.id,
      type: def.type,
      lat: round(bus.currentLat! + (rng() - 0.5) * 0.01, 5),
      lng: round(bus.currentLng! + (rng() - 0.5) * 0.01, 5),
      busId: bus.id,
      description: def.desc,
      status: def.status,
      resolvedAt: def.status === 'resolved' ? iso(new Date(created.getTime() + int(20, 240) * 60000)) : undefined,
      createdAt: iso(created),
    });
    if (def.type === 'panic') {
      notifications.push({
        id: uid(),
        title: 'Emergency Alert',
        message: def.desc,
        type: 'emergency',
        busId: bus.id,
        read: false,
        createdAt: iso(created),
      });
    }
  }

  /* --- Audit logs --------------------------------------------------------- */
  const auditSamples: Array<{ action: string; entity?: string }> = [
    { action: 'auth.login', entity: 'user' },
    { action: 'trip.started', entity: 'trip' },
    { action: 'trip.completed', entity: 'trip' },
    { action: 'student.updated', entity: 'student' },
    { action: 'bus.assigned', entity: 'bus' },
    { action: 'emergency.resolved', entity: 'emergency_alert' },
    { action: 'notification.broadcast', entity: 'notification' },
    { action: 'report.exported', entity: 'report' },
  ];
  const auditLogs = auditSamples.map((s, i) => ({
    id: uid(),
    userId: users.find((u) => u.role === 'admin')?.id,
    action: s.action,
    entity: s.entity,
    entityId: uid(),
    meta: { source: 'seed' },
    createdAt: iso(new Date(now.getTime() - int(1, 20) * 864e5 - i * 3600e3)),
  }));

  // fill password hashes (async)
  for (const u of users) {
    u.passwordHash = await hashFor(u.role);
  }

  return {
    users,
    students,
    parents,
    drivers,
    buses,
    routes,
    stops,
    studentBus,
    trips,
    liveLocations,
    notifications,
    emergencyAlerts,
    auditLogs,
  };
}

/** Re-exported count summary for docs/UI. */
export const SEED_STATS = {
  students: 100,
  parents: 20,
  drivers: 10,
  buses: 10,
  routes: 10,
  stops: 50,
  daysOfHistory: 30,
};
