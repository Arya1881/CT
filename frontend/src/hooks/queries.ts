import { useMutation, useQuery, useQueryClient, type UseQueryOptions } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type {
  AuthSession,
  Bus,
  BusEnriched,
  Driver,
  DriverProfile,
  EmergencyAlert,
  EmergencyStats,
  LiveBusView,
  Notification,
  Overview,
  Page,
  Parent,
  ParentProfile,
  Route,
  SeriesPoint,
  Stop,
  Student,
  StudentProfile,
  Trip,
} from '@/types';

/* -------------------------------- auth -------------------------------- */

export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: () => api<AuthSession>('/auth/me'), staleTime: 60_000 });
}

export function useProfile() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => api<AuthSession>('/auth/me'),
    staleTime: 30_000,
  });
}

/* ------------------------------- tracking ------------------------------- */

export function useLiveBuses() {
  return useQuery({ queryKey: ['tracking', 'live'], queryFn: () => api<LiveBusView[]>('/tracking/live'), refetchInterval: 5000 });
}

export function useBusLive(busId: string | undefined) {
  return useQuery({
    queryKey: ['tracking', 'bus', busId],
    queryFn: () => api<LiveBusView & { eta?: unknown }>(`/tracking/bus/${busId}`),
    enabled: !!busId,
    refetchInterval: 5000,
  });
}

export function useBusEta(busId: string | undefined, stopId?: string) {
  return useQuery({
    queryKey: ['tracking', 'bus', busId, 'eta', stopId],
    queryFn: () =>
      api<unknown>(`/tracking/bus/${busId}/eta`, { query: { stopId: stopId || '' } }),
    enabled: !!busId,
    refetchInterval: 10_000,
  });
}

export function useBusTrail(busId: string | undefined, limit = 60) {
  return useQuery({
    queryKey: ['tracking', 'bus', busId, 'trail'],
    queryFn: () => api<Array<{ lat: number; lng: number; timestamp: string; speedKmh: number }>>(`/tracking/bus/${busId}/trail?limit=${limit}`),
    enabled: !!busId,
    refetchInterval: 10_000,
  });
}

/* -------------------------------- buses -------------------------------- */

export function useBuses(params: { q?: string; status?: string; routeId?: string; page?: number } = {}) {
  return useQuery({
    queryKey: ['buses', params],
    queryFn: () => api<Page<BusEnriched>>('/buses', { query: { q: params.q, status: params.status, routeId: params.routeId, page: params.page ?? 1 } }),
  });
}

export function useBus(id: string | undefined) {
  return useQuery({ queryKey: ['buses', id], queryFn: () => api<BusEnriched>(`/buses/${id}`), enabled: !!id });
}

export function useBusMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['buses'] });

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api<Bus>('/buses', { method: 'POST', body }),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api<Bus>(`/buses/${id}`, { method: 'PATCH', body }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api<{ message: string }>(`/buses/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
  return { create, update, remove };
}

/* -------------------------------- routes -------------------------------- */

export function useRoutes(activeOnly = false) {
  return useQuery({
    queryKey: ['routes', activeOnly],
    queryFn: () => api<Route[]>('/routes', { query: { active: activeOnly ? 'true' : '' } }),
  });
}

export function useRoute(id: string | undefined) {
  return useQuery({
    queryKey: ['routes', id],
    queryFn: () => api<Route & { stops: Stop[]; buses: Bus[] }>(`/routes/${id}`),
    enabled: !!id,
  });
}

export function useRouteMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['routes'] });

  const create = useMutation({
    mutationFn: (body: Record<string, unknown>) => api<Route>('/routes', { method: 'POST', body }),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api<Route>(`/routes/${id}`, { method: 'PATCH', body }),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => api<{ message: string }>(`/routes/${id}`, { method: 'DELETE' }),
    onSuccess: invalidate,
  });
  return { create, update, remove };
}

/* --------------------------------- stops -------------------------------- */

export function useStops(routeId?: string) {
  return useQuery({ queryKey: ['stops', routeId], queryFn: () => api<Stop[]>('/stops', { query: { routeId: routeId || '' } }) });
}

export function useStopMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['stops'] });
    qc.invalidateQueries({ queryKey: ['routes'] });
  };
  return {
    create: useMutation({
      mutationFn: (body: Record<string, unknown>) => api<Stop>('/stops', { method: 'POST', body }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api<Stop>(`/stops/${id}`, { method: 'PATCH', body }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<{ message: string }>(`/stops/${id}`, { method: 'DELETE' }),
      onSuccess: invalidate,
    }),
  };
}

/* ------------------------------- students ------------------------------- */

export function useStudents(params: { q?: string; department?: string; busId?: string; page?: number } = {}) {
  return useQuery({
    queryKey: ['students', params],
    queryFn: () =>
      api<Page<Student>>('/students', {
        query: { q: params.q, department: params.department, busId: params.busId, page: params.page ?? 1 },
      }),
  });
}

export function useStudentMe() {
  return useQuery({ queryKey: ['students', 'me'], queryFn: () => api<StudentProfile>('/students/me'), refetchInterval: 8000 });
}

export function useStudentTripsMe() {
  return useQuery({ queryKey: ['students', 'me', 'trips'], queryFn: () => api<Trip[]>('/students/me/trips') });
}

export function useStudentCrud() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['students'] });
  return {
    create: useMutation({
      mutationFn: (body: Record<string, unknown>) => api<Student>('/students', { method: 'POST', body }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api<Student>(`/students/${id}`, { method: 'PATCH', body }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<{ message: string }>(`/students/${id}`, { method: 'DELETE' }),
      onSuccess: invalidate,
    }),
  };
}

/* -------------------------------- parents ------------------------------- */

export function useParents(params: { q?: string; page?: number } = {}) {
  return useQuery({
    queryKey: ['parents', params],
    queryFn: () => api<Page<Parent>>('/parents', { query: { q: params.q, page: params.page ?? 1 } }),
  });
}

export function useParentMe() {
  return useQuery({ queryKey: ['parents', 'me'], queryFn: () => api<ParentProfile>('/parents/me'), refetchInterval: 8000 });
}

/* -------------------------------- drivers ------------------------------- */

export function useDrivers(params: { q?: string; status?: string; page?: number } = {}) {
  return useQuery({
    queryKey: ['drivers', params],
    queryFn: () => api<Page<Driver>>('/drivers', { query: { q: params.q, status: params.status, page: params.page ?? 1 } }),
  });
}

export function useDriverMe() {
  return useQuery({ queryKey: ['drivers', 'me'], queryFn: () => api<DriverProfile>('/drivers/me'), refetchInterval: 8000 });
}

export function useDriverTripsMe() {
  return useQuery({ queryKey: ['drivers', 'me', 'trips'], queryFn: () => api<Trip[]>('/drivers/me/trips') });
}

export function useDriverCrud() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['drivers'] });
    qc.invalidateQueries({ queryKey: ['buses'] });
  };
  return {
    create: useMutation({
      mutationFn: (body: Record<string, unknown>) => api<Driver>('/drivers', { method: 'POST', body }),
      onSuccess: invalidate,
    }),
    update: useMutation({
      mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) => api<Driver>(`/drivers/${id}`, { method: 'PATCH', body }),
      onSuccess: invalidate,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api<{ message: string }>(`/drivers/${id}`, { method: 'DELETE' }),
      onSuccess: invalidate,
    }),
  };
}

export function useDriverMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['drivers'] });
    qc.invalidateQueries({ queryKey: ['buses'] });
    qc.invalidateQueries({ queryKey: ['trips'] });
  };
  return {
    startTrip: useMutation({ mutationFn: () => api<Trip>('/drivers/me/start-trip', { method: 'POST' }), onSuccess: invalidate }),
    stopTrip: useMutation({ mutationFn: () => api<Trip>('/drivers/me/stop-trip', { method: 'POST' }), onSuccess: invalidate }),
    delay: useMutation({ mutationFn: (minutes: number) => api<Trip>('/drivers/me/delay', { method: 'POST', body: { minutes } }), onSuccess: invalidate }),
    gps: useMutation({
      mutationFn: (enabled: boolean) => api<{ enabled: boolean }>('/drivers/me/gps', { method: 'POST', body: { enabled } }),
      onSuccess: () => qc.invalidateQueries({ queryKey: ['drivers', 'me'] }),
    }),
  };
}

/* -------------------------------- trips -------------------------------- */

export function useTrips(params: {
  status?: string;
  busId?: string;
  routeId?: string;
  driverId?: string;
  from?: string;
  to?: string;
  page?: number;
} = {}) {
  return useQuery({
    queryKey: ['trips', params],
    queryFn: () =>
      api<Page<Trip>>('/trips', {
        query: { status: params.status, busId: params.busId, routeId: params.routeId, driverId: params.driverId, from: params.from, to: params.to, page: params.page ?? 1 },
      }),
  });
}

export function useTrip(id: string | undefined) {
  return useQuery({
    queryKey: ['trips', id],
    queryFn: () => api<Trip & { positions: Array<{ lat: number; lng: number; timestamp: string }> }>(`/trips/${id}`),
    enabled: !!id,
  });
}

/* ----------------------------- notifications ---------------------------- */

export function useNotifications(params: { unreadOnly?: boolean; page?: number } = {}) {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => api<Page<Notification>>('/notifications', { query: { unreadOnly: params.unreadOnly ? 'true' : '', page: params.page ?? 1 } }),
  });
}

export function useUnreadCount() {
  return useQuery({ queryKey: ['notifications', 'unread-count'], queryFn: () => api<{ count: number }>('/notifications/unread-count'), refetchInterval: 15_000 });
}

export function useNotificationMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['notifications'] });
  return {
    markRead: useMutation({
      mutationFn: (id: string) => api<{ message: string }>(`/notifications/${id}/read`, { method: 'PATCH' }),
      onSuccess: invalidate,
    }),
    markAllRead: useMutation({ mutationFn: () => api<{ message: string }>('/notifications/read-all', { method: 'POST' }), onSuccess: invalidate }),
    broadcast: useMutation({
      mutationFn: (body: { type: string; title: string; message: string }) => api<Notification>('/notifications/broadcast', { method: 'POST', body }),
      onSuccess: invalidate,
    }),
  };
}

/* ------------------------------ emergency ------------------------------ */

export function useAlerts(params: { status?: string; type?: string; page?: number } = {}) {
  return useQuery({
    queryKey: ['emergency', params],
    queryFn: () => api<Page<EmergencyAlert>>('/emergency', { query: { status: params.status, type: params.type, page: params.page ?? 1 } }),
  });
}

export function useAlertStats() {
  return useQuery({ queryKey: ['emergency', 'stats'], queryFn: () => api<EmergencyStats>('/emergency/stats') });
}

export function useEmergencyMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['emergency'] });
  return {
    raise: useMutation({
      mutationFn: (body: Record<string, unknown>) => api<EmergencyAlert>('/emergency', { method: 'POST', body }),
      onSuccess: invalidate,
    }),
    setStatus: useMutation({
      mutationFn: ({ id, status }: { id: string; status: string }) => api<EmergencyAlert>(`/emergency/${id}/status`, { method: 'PATCH', body: { status } }),
      onSuccess: invalidate,
    }),
  };
}

/* ------------------------------- analytics ------------------------------ */

export function useAnalyticsOverview() {
  return useQuery<Overview>({ queryKey: ['analytics', 'overview'], queryFn: () => api('/analytics/overview'), refetchInterval: 20_000 });
}

export function useTripSeries(range: 'daily' | 'weekly' | 'monthly' = 'daily') {
  return useQuery<{ range: string; series: SeriesPoint[] }>({
    queryKey: ['analytics', 'trips', range],
    queryFn: () => api(`/analytics/trips`, { query: { range } }),
  });
}

export function useDriverPerformance() {
  return useQuery<Array<Record<string, unknown>>>({ queryKey: ['analytics', 'driver-performance'], queryFn: () => api('/analytics/driver-performance') });
}

export function useBusUtilization() {
  return useQuery<Array<Record<string, unknown>>>({ queryKey: ['analytics', 'bus-utilization'], queryFn: () => api('/analytics/bus-utilization') });
}

export function useStudentUsage() {
  return useQuery<Array<Record<string, unknown>>>({ queryKey: ['analytics', 'student-usage'], queryFn: () => api('/analytics/student-usage') });
}

export function useRouteReports() {
  return useQuery<Array<Record<string, unknown>>>({ queryKey: ['analytics', 'route-reports'], queryFn: () => api('/analytics/route-reports') });
}

export function useEmergencyReports() {
  return useQuery<Record<string, unknown>>({ queryKey: ['analytics', 'emergency-reports'], queryFn: () => api('/analytics/emergency-reports') });
}

/* -------------------------------- settings ------------------------------ */

export function useSettings() {
  return useQuery<Record<string, string>>({ queryKey: ['settings'], queryFn: () => api('/settings') });
}

export function useSettingsMutation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, string>) => api<{ message: string }>('/settings', { method: 'PUT', body }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['settings'] }),
  });
}
