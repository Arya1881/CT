import { useMemo } from 'react';
import { AlertCircle, Bus as BusIcon, Clock, MapPin, Phone, ShieldCheck, UserRound } from 'lucide-react';
import { useStudentMe, useStops } from '@/hooks/queries';
import { useLiveLocations } from '@/hooks/useLiveLocations';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { BusStatusBadge } from '@/components/shared/StatusBadge';
import { DetailRow, StatPill } from '@/components/shared/Detail';
import { SchematicMap } from '@/components/maps/SchematicMap';
import { minutesToLabel } from '@/lib/format';
import { useAuth } from '@/lib/auth';

export function StudentHomePage() {
  const { user } = useAuth();
  const { data: p, isLoading, isError } = useStudentMe();
  const live = useLiveLocations();
  const { data: stops } = useStops(p?.route?.id);

  const busPosition = useMemo(() => {
    if (!p?.bus) return null;
    if (p.bus.id && live[p.bus.id]) return live[p.bus.id];
    return p.liveLocation;
  }, [p, live]);

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-80 lg:col-span-2" />
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-52" />
        </div>
      </div>
    );
  }

  if (isError || !p) {
    return <EmptyState title="Could not load your profile" message="Refresh the page and try again." />;
  }

  if (!p.bus || !p.route) {
    return (
      <div>
        <PageHeader title={`Hi, ${user?.firstName ?? 'there'}`} description="Your transport profile" />
        <EmptyState
          title="No bus assigned"
          message="You are not assigned to a bus route yet. Please contact the transport office."
        />
      </div>
    );
  }

  const eta = p.eta;
  const atStop = eta?.atStop;
  const busRunning = p.bus.status === 'running';

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi, ${user?.firstName ?? 'there'}`}
        description="Track your bus, view your ETA and stay updated in real time."
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>Your route · {p.route.name}</CardTitle>
            <Badge tone={busRunning ? 'success' : p.bus.status === 'delayed' ? 'destructive' : 'default'}>
              {busRunning ? 'Bus on the move' : p.bus.status === 'delayed' ? 'Delayed' : 'Not running'}
            </Badge>
          </CardHeader>
          <CardContent>
            <SchematicMap
              routes={[p.route]}
              stops={stops ?? []}
              buses={[
                {
                  id: p.bus.id,
                  label: p.bus.plateNumber,
                  color: p.route.color,
                  position: busPosition,
                  selected: true,
                },
              ]}
              height={360}
              className="w-full"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Origin: <span className="font-medium text-foreground">{p.route.origin}</span> · Destination:{' '}
              <span className="font-medium text-foreground">{p.route.destination}</span> ·{' '}
              {p.route.distanceKm} km · ~{p.route.estimatedDurationMin} min
            </p>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Arrival ETA
              </CardTitle>
            </CardHeader>
            <CardContent>
              {eta ? (
                <div>
                  <p className="text-3xl font-bold tracking-tight">
                    {atStop ? 'At stop' : minutesToLabel(eta.minutes)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {atStop
                      ? 'Your bus is at the stop right now.'
                      : `Your bus arrives at ${p.stop?.name ?? 'your stop'} in ${minutesToLabel(eta.minutes)}.`}
                  </p>
                  <div className="mt-3 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
                    {eta.distanceKm.toFixed(1)} km from your stop · towards {eta.destinationName}
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {busRunning ? 'Calculating arrival…' : 'Bus is currently not running. No ETA available.'}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BusIcon className="h-4 w-4 text-primary" />
                Your Bus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <DetailRow label="Plate" value={p.bus.plateNumber} />
              <DetailRow label="Model" value={p.bus.model} />
              <DetailRow label="Status" value={<BusStatusBadge status={p.bus.status} />} />
              <DetailRow label="Capacity" value={`${p.bus.capacity} seats`} />
              <DetailRow label="Fuel" value={`${p.bus.fuelLevel}%`} />
              <div className="my-3 border-t border-border" />
              <DetailRow label="Your stop" value={p.stop?.name ?? '—'} />
              <DetailRow label="Pickup ETA" value={eta && !atStop ? minutesToLabel(eta.minutes) : atStop ? 'Arrived' : '—'} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserRound className="h-4 w-4 text-primary" />
                Driver
              </CardTitle>
            </CardHeader>
            <CardContent>
              {p.driver ? (
                <>
                  <DetailRow label="Name" value={p.driver.name} />
                  {p.driver.phone && (
                    <DetailRow
                      label="Contact"
                      value={
                        <a href={`tel:${p.driver.phone}`} className="flex items-center gap-1 text-primary hover:underline">
                          <Phone className="h-3.5 w-3.5" /> {p.driver.phone}
                        </a>
                      }
                    />
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">No driver assigned.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatPill label="Trip status" value={p.activeTrip ? 'Active' : 'No active trip'} tone={p.activeTrip ? 'success' : undefined} />
        <StatPill label="Passengers" value={p.activeTrip?.passengerCount ?? '—'} />
        <StatPill label="Delay" value={p.activeTrip?.delayMinutes ? `${p.activeTrip.delayMinutes} min` : 'On time'} tone={p.activeTrip?.delayMinutes ? 'warn' : 'success'} />
        <StatPill label="Next stop" value={p.stop?.name ?? '—'} />
      </div>

      {p.emergencyContactPhone && (
        <Card>
          <CardContent className="flex items-center gap-3 pt-5">
            <div className="rounded-lg bg-red-500/10 p-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div className="flex-1 text-sm">
              <p className="font-medium">Emergency contact on file</p>
              <p className="text-muted-foreground">
                {p.emergencyContactName ?? 'Contact'} ·{' '}
                <a href={`tel:${p.emergencyContactPhone}`} className="text-primary hover:underline">
                  {p.emergencyContactPhone}
                </a>
              </p>
            </div>
            <ShieldCheck className="h-5 w-5 text-muted-foreground" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
