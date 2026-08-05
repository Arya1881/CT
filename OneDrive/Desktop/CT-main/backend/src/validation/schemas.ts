import { z } from 'zod';

const latLng = z.object({ lat: z.number().min(-90).max(90), lng: z.number().min(-180).max(180) });
const optionalString = z.string().trim().optional();

/* Auth ------------------------------------------------------------------ */
export const loginSchema = z.object({
  email: z.string().email('A valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const forgotSchema = z.object({ email: z.string().email('A valid email is required') });

export const resetSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const updateProfileSchema = z.object({
  firstName: optionalString,
  lastName: optionalString,
  phone: optionalString,
  avatarUrl: optionalString,
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

/* Buses ------------------------------------------------------------------ */
export const busCreateSchema = z.object({
  plateNumber: z.string().min(3, 'Plate number is required'),
  model: z.string().min(1, 'Model is required'),
  capacity: z.number().int().min(5).max(200),
  status: z.enum(['idle', 'running', 'maintenance', 'delayed']).default('idle'),
  routeId: z.string().uuid().nullable().optional(),
  driverId: z.string().uuid().nullable().optional(),
  fuelLevel: z.number().int().min(0).max(100).default(100),
});

export const busUpdateSchema = busCreateSchema.partial().extend({
  currentLat: z.number().optional(),
  currentLng: z.number().optional(),
});

/* Routes ------------------------------------------------------------------ */
export const routeCreateSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: optionalString,
  origin: z.string().min(1),
  destination: z.string().min(1),
  distanceKm: z.number().positive(),
  estimatedDurationMin: z.number().int().positive(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a hex value'),
  waypoints: z.array(latLng).min(2, 'At least 2 waypoints required'),
  active: z.boolean().default(true),
});

export const routeUpdateSchema = routeCreateSchema.partial();

/* Stops ------------------------------------------------------------------- */
export const stopCreateSchema = z.object({
  routeId: z.string().uuid(),
  name: z.string().min(1),
  lat: z.number(),
  lng: z.number(),
  orderIndex: z.number().int().min(0),
  arrivalOffsetMin: z.number().int().min(0).default(0),
});
export const stopUpdateSchema = stopCreateSchema.partial();

/* People ------------------------------------------------------------------ */
const person = {
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  email: z.string().email('A valid email is required'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  phone: optionalString,
};

export const studentCreateSchema = z.object({
  ...person,
  rollNumber: z.string().min(1),
  department: z.string().min(1),
  year: z.number().int().min(1).max(6),
  busId: z.string().uuid().nullable().optional(),
  stopId: z.string().uuid().nullable().optional(),
  parentId: z.string().uuid().nullable().optional(),
  emergencyContactName: optionalString,
  emergencyContactPhone: optionalString,
});
export const studentUpdateSchema = studentCreateSchema.omit({ password: true }).partial();

export const parentCreateSchema = z.object({ ...person });
export const parentUpdateSchema = parentCreateSchema.omit({ password: true }).partial();

export const driverCreateSchema = z.object({
  ...person,
  licenseNo: z.string().min(1),
  busId: z.string().uuid().nullable().optional(),
});
export const driverUpdateSchema = driverCreateSchema.omit({ password: true }).partial();

/* Trips ------------------------------------------------------------------- */
export const tripQuerySchema = z.object({
  status: z.string().optional(),
  busId: z.string().optional(),
  routeId: z.string().optional(),
  driverId: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().positive().max(200).default(20),
});

export const delaySchema = z.object({ minutes: z.number().int().min(1).max(240) });

/* Notifications ------------------------------------------------------------- */
export const broadcastSchema = z.object({
  title: z.string().min(1),
  message: z.string().min(1),
  type: z.enum(['trip_started', 'trip_completed', 'bus_delayed', 'bus_near_stop', 'emergency', 'system']).default('system'),
});

/* Emergency ----------------------------------------------------------------- */
export const emergencyCreateSchema = z.object({
  type: z.enum(['panic', 'accident', 'medical', 'safety', 'breakdown', 'other']),
  description: z.string().max(500).optional(),
  lat: z.number().optional(),
  lng: z.number().optional(),
  busId: z.string().uuid().optional(),
  tripId: z.string().uuid().optional(),
});

export const alertStatusSchema = z.object({ status: z.enum(['open', 'investigating', 'resolved']) });

/* Settings ------------------------------------------------------------------- */
export const settingsSchema = z.record(z.string(), z.union([z.string(), z.number(), z.boolean()]));
