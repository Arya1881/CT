import { useState } from 'react';
import { useBuses, useRoutes, useTrip, useTrips } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Select as SelectBox } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '@/components/ui/table';
import { Pagination } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { TripStatusBadge } from '@/components/shared/StatusBadge';
import { DetailRow } from '@/components/shared/Detail';
import { SchematicMap } from '@/components/maps/SchematicMap';
import { formatDateTime, km, minutesToLabel } from '@/lib/format';

export function AdminTripsPage() {
  const [status, setStatus] = useState('');
  const [busId, setBusId] = useState('');
  const [routeId, setRouteId] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useTrips({ status: status || undefined, busId: busId || undefined, routeId: routeId || undefined, page });
  const { data: buses } = useBuses({});
  const { data: routes } = useRoutes();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Trips"
        description={`${data?.total ?? 0} trips logged across the fleet.`}
      />

      <div className="flex flex-wrap items-center gap-3">
        <SelectBox value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-40">
          <option value="">All statuses</option>
          <option value="scheduled">Scheduled</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="delayed">Delayed</option>
          <option value="cancelled">Cancelled</option>
        </SelectBox>
        <SelectBox value={busId} onChange={(e) => { setBusId(e.target.value); setPage(1); }} className="w-44">
          <option value="">All buses</option>
          {(buses?.data ?? []).map((b) => (
            <option key={b.bus.id} value={b.bus.id}>{b.bus.plateNumber}</option>
          ))}
        </SelectBox>
        <SelectBox value={routeId} onChange={(e) => { setRouteId(e.target.value); setPage(1); }} className="w-56">
          <option value="">All routes</option>
          {(routes ?? []).map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </SelectBox>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !data || data.data.length === 0 ? (
            <EmptyState title="No trips found" message="Adjust filters or wait for trips to be recorded." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Passengers</TableHead>
                  <TableHead className="text-right">Distance</TableHead>
                  <TableHead className="text-right">Delay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((t) => (
                  <TableRow key={t.id} className="cursor-pointer" onClick={() => setSelectedId(t.id)}>
                    <TableCell>{formatDateTime(t.startedAt)}</TableCell>
                    <TableCell className="font-medium">{t.route?.name ?? '—'}</TableCell>
                    <TableCell>{t.bus?.plateNumber ?? '—'}</TableCell>
                    <TableCell>{t.driver?.name ?? '—'}</TableCell>
                    <TableCell><TripStatusBadge status={t.status} /></TableCell>
                    <TableCell className="text-right">{t.passengerCount}</TableCell>
                    <TableCell className="text-right">{km(t.distanceKm)}</TableCell>
                    <TableCell className="text-right">
                      {t.delayMinutes > 0 ? <Badge tone="warning">{t.delayMinutes} min</Badge> : 'On time'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {data && data.totalPages > 1 && (
        <Pagination page={page} pageSize={data.pageSize} total={data.total} onPageChange={setPage} />
      )}

      {selectedId && <TripDetailDialog tripId={selectedId} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function TripDetailDialog({ tripId, onClose }: { tripId: string; onClose: () => void }) {
  const { data: trip, isLoading } = useTrip(tripId);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title="Trip details" size="md">
      {isLoading || !trip ? (
        <div className="space-y-3">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Started {formatDateTime(trip.startedAt)}</p>
            <TripStatusBadge status={trip.status} />
          </div>

          {trip.route && (
            <SchematicMap
              routes={[trip.route]}
              stops={[]}
              buses={trip.positions?.length ? [{ id: 'trip-bus', color: trip.route.color, position: trip.positions[trip.positions.length - 1] }] : []}
              trail={trip.positions ?? []}
              height={220}
            />
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Route</p>
              <p className="mt-0.5 text-sm font-medium">{trip.route?.name ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Bus</p>
              <p className="mt-0.5 text-sm font-medium">{trip.bus?.plateNumber ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Driver</p>
              <p className="mt-0.5 text-sm font-medium">{trip.driver?.name ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-muted p-3">
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="mt-0.5 text-sm font-medium">
                {trip.startedAt && trip.completedAt ? minutesToLabel(Math.round((new Date(trip.completedAt).getTime() - new Date(trip.startedAt).getTime()) / 60000)) : '—'}
              </p>
            </div>
          </div>

          <DetailRow label="Passengers" value={trip.passengerCount} />
          <DetailRow label="Distance" value={km(trip.distanceKm)} />
          <DetailRow label="Delay" value={trip.delayMinutes > 0 ? `${trip.delayMinutes} min` : 'On time'} />
          {trip.completedAt && <DetailRow label="Completed" value={formatDateTime(trip.completedAt)} />}
        </div>
      )}
    </Dialog>
  );
}
