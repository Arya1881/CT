import express, { Request, Response } from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { gpsSimulator } from './gpsSimulator';
import { USERS, BUSES, DRIVERS, STUDENTS, PARENTS, ROUTES } from './seedData';
import { EmergencyAlert } from './types';

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = 'campustransit-super-secret-key-2026';

app.use(cors({ origin: '*' }));
app.use(express.json());

// Root welcome & health route
app.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    message: '🚀 CampusTransit API & Real-Time SSE Engine is Running!',
    frontendUrl: 'http://localhost:3000',
    availableEndpoints: {
      authUsers: '/api/auth/users',
      adminStats: '/api/admin/stats',
      buses: '/api/admin/buses',
      drivers: '/api/admin/drivers',
      students: '/api/admin/students',
      routes: '/api/admin/routes',
      sseLiveTracking: '/api/tracking/live'
    }
  });
});

app.post('/api/auth/login', (req: Request, res: Response) => {
  const { email, role } = req.body;
  const user = USERS.find(u => u.email.toLowerCase() === email?.toLowerCase() || u.role === role);

  if (!user) {
    return res.status(401).json({ error: 'User not found' });
  }

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '24h' });
  res.json({ token, user });
});

app.get('/api/auth/users', (req: Request, res: Response) => {
  res.json(USERS);
});

app.get('/api/admin/stats', (req: Request, res: Response) => {
  const activeTrips = gpsSimulator.getTrips().filter(t => t.status === 'IN_TRANSIT').length;
  const totalBuses = BUSES.length;
  const totalStudents = STUDENTS.length;
  const totalDrivers = DRIVERS.length;
  const activeAlerts = gpsSimulator.getAlerts().filter(a => a.status === 'ACTIVE').length;

  res.json({
    activeTrips,
    totalBuses,
    totalStudents,
    totalDrivers,
    activeAlerts,
    onTimeRate: '96.4%'
  });
});

app.get('/api/admin/buses', (req: Request, res: Response) => res.json(BUSES));
app.get('/api/admin/drivers', (req: Request, res: Response) => res.json(DRIVERS));
app.get('/api/admin/students', (req: Request, res: Response) => res.json(STUDENTS));
app.get('/api/admin/routes', (req: Request, res: Response) => res.json(ROUTES));

app.post('/api/driver/trip/start', (req: Request, res: Response) => {
  const { busId, driverId, routeId } = req.body;
  const trip = gpsSimulator.startTrip(busId, driverId, routeId);
  res.json({ success: true, trip });
});

app.post('/api/driver/trip/end', (req: Request, res: Response) => {
  const { busId } = req.body;
  const trip = gpsSimulator.endTrip(busId);
  res.json({ success: true, trip });
});

app.post('/api/driver/trip/delay', (req: Request, res: Response) => {
  const { busId, reason } = req.body;
  const trip = gpsSimulator.reportDelay(busId, reason);
  res.json({ success: true, trip });
});

app.post('/api/driver/sos', (req: Request, res: Response) => {
  const { busId, driverId, driverName, alertType, message, lat, lng } = req.body;
  const newAlert: EmergencyAlert = {
    id: `alert-${Date.now()}`,
    busId,
    triggeredByUserId: driverId,
    triggeredByName: driverName || 'Driver',
    role: 'DRIVER',
    alertType: alertType || 'DRIVER_BREAKDOWN',
    message: message || 'DRIVER SOS: Emergency on bus corridor!',
    lat: lat || 12.9750,
    lng: lng || 77.5980,
    status: 'ACTIVE',
    timestamp: new Date().toISOString()
  };

  gpsSimulator.addAlert(newAlert);
  res.json({ success: true, alert: newAlert });
});

app.get('/api/student/assigned-bus', (req: Request, res: Response) => {
  const { studentUserId } = req.query;
  const student = STUDENTS.find(s => s.userId === studentUserId) || STUDENTS[0];
  const bus = BUSES.find(b => b.id === student.assignedBusId);
  const driver = DRIVERS.find(d => d.id === bus?.driverId);
  const route = ROUTES.find(r => r.id === bus?.routeId);
  const trip = gpsSimulator.getTripByBusId(student.assignedBusId);

  res.json({
    student,
    bus,
    driver,
    route,
    trip
  });
});

app.post('/api/student/sos', (req: Request, res: Response) => {
  const { studentUserId, studentName, lat, lng, message } = req.body;
  const student = STUDENTS.find(s => s.userId === studentUserId);
  const newAlert: EmergencyAlert = {
    id: `alert-${Date.now()}`,
    busId: student?.assignedBusId || 'bus-101',
    triggeredByUserId: studentUserId || 'u-student-1',
    triggeredByName: studentName || student?.name || 'Student',
    role: 'STUDENT',
    alertType: 'STUDENT_SAFETY',
    message: message || 'STUDENT SOS: Immediate medical / safety request!',
    lat: lat || 12.9800,
    lng: lng || 77.6020,
    status: 'ACTIVE',
    timestamp: new Date().toISOString()
  };

  gpsSimulator.addAlert(newAlert);
  res.json({ success: true, alert: newAlert });
});

app.get('/api/parent/children', (req: Request, res: Response) => {
  const { parentUserId } = req.query;
  const parent = PARENTS.find(p => p.userId === parentUserId) || PARENTS[0];

  const childrenData = parent.childrenIds.map(childId => {
    const student = STUDENTS.find(s => s.id === childId)!;
    const bus = BUSES.find(b => b.id === student.assignedBusId)!;
    const driver = DRIVERS.find(d => d.id === bus?.driverId)!;
    const route = ROUTES.find(r => r.id === bus?.routeId)!;
    const trip = gpsSimulator.getTripByBusId(student.assignedBusId)!;

    return {
      student,
      bus,
      driver,
      route,
      trip
    };
  });

  res.json({
    parent,
    children: childrenData
  });
});

app.get('/api/tracking/live', (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  gpsSimulator.registerClient(res);

  req.on('close', () => {
    gpsSimulator.unregisterClient(res);
  });
});

app.get('/api/emergency/alerts', (req: Request, res: Response) => {
  res.json(gpsSimulator.getAlerts());
});

app.post('/api/emergency/resolve', (req: Request, res: Response) => {
  const { alertId } = req.body;
  const alert = gpsSimulator.resolveAlert(alertId);
  res.json({ success: true, alert });
});

app.listen(PORT, () => {
  console.log(`🚀 CampusTransit Backend API & SSE Engine running on http://localhost:${PORT}`);
});
