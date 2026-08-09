import { useState } from 'react';
import { Bus as BusIcon, CheckCircle2, Clock, Fuel, MapPin, Play, Square, Timer } from 'lucide-react';
import { useDriverMe, useDriverMutations, useStops } from '@/hooks/queries';
import { useLiveLocations } from '@/hooks/useLiveLocations';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { BusStatusBadge, DriverStatusBadge, TripStatusBadge } from '@/components/shared/StatusBadge';
import { DetailRow, StatPill } from '@/components/shared/Detail';
import { SchematicMap } from '@/components/maps/SchematicMap';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { formatDateTime, km, minutesToLabel } from '@/lib/format';
import { useToast } from '@/components/ui/toast';
import { useAuth } from '@/lib/auth';

export function DriverHomePage() {
  const { user } = useAuth();
  const { data: p, isLoading, isError } = useDriverMe();
  const { startTrip, stopTrip, delay, gps } = useDriverMutations();
  const { toast } = useToast();
  const live = useLiveLocations();
  const { data: stops } = useStops(p?.route?.id);
  const [delayMin, setDelayMin] = useState('10');

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-96 lg:col-span-2" />
        <div className="space-y-4">
          <Skeleton className="h-48" />
          <Skeleton className="h-40" />
        </div>
      </div>
    );
  }

  if (isError || !p) {
    return <EmptyState title="Could not load driver profile" message="Refresh the page and try again." />;
  }

  if (!p.bus) {
    return (
      <div>
        <PageHeader title={`Hi, ${p.name ?? user?.firstName ?? 'driver'}`} description="Your driving dashboard" />
        <EmptyState title="No bus assigned" message="Contact the transport office to assign a bus to your account." />
      </div>
    );
  }

  const busPosition = p.bus.id ? (live[p.bus.id] ?? null) : null;
  const hasActive = !!p.activeTrip;
  const gpsEnabled = p.gpsEnabled;

  const handleStart = async () => {
    try {
      await startTrip.mutateAsync();
      toast('Trip started', { message: 'Live GPS is now broadcasting.', tone: 'success' });
    } catch (err: any) {
      toast('Could not start trip', { message: err?.message, tone: 'destructive' });
    }
  };

  const handleStop = async () => {
    try {
      await stopTrip.mutateAsync();
      toast('Trip stopped', { message: 'Bus marked idle.', tone: 'info' });
    } catch (err: any) {
      toast('Could not stop trip', { message: err?.message, tone: 'destructive' });
    }
  };

  const handleDelay = async () => {
    const min = Math.max(0, Math.min(180, Number(delayMin) || 0));
    try {
      await delay.mutateAsync(min);
      toast('Delay reported', { message: `Bus marked ${min} min late.`, tone: 'warning' });
    } catch (err: any) {
      toast('Could not report delay', { message: err?.message, tone: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi, ${p.name ?? user?.firstName ?? 'driver'}`}
        description={
          <span className="flex items-center gap-2">
            <DriverStatusBadge status={p.status} />
            <span>License {p.licenseNo}</span>
          </span>
        }
        actions={
          p.bus && (
            <div className="flex items-center gap-2">
              {hasActive ? (
                <Button variant="destructive" onClick={handleStop} loading={stopTrip.isPending}>
                  <Square className="h-4 w-4" /> Stop trip
                </Button>
              ) : (
                <Button variant="primary" onClick={handleStart} loading={startTrip.isPending}>
                  <Play className="h-4 w-4" /> Start trip
                </Button>
              )}
            </div>
          )
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle>{p.route?.name ?? 'Assigned route'}</CardTitle>
            <Badge tone={gpsEnabled ? 'success' : 'default'}>{gpsEnabled ? 'GPS broadcasting' : 'GPS paused'}</Badge>
          </CardHeader>
          <CardContent>
            {p.route ? (
              <>
                <SchematicMap
                  routes={[p.route]}
                  stops={stops ?? []}
                  buses={[{ id: p.bus.id, label: p.bus.plateNumber, color: p.route.color, position: busPosition }]}
                  height={340}
                  showStops
                />
                <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.route.origin}</span>
                  <span>→</span>
                  <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {p.route.destination}</span>
                  <span>{p.route.distanceKm} km</span>
                  <span>~{p.route.estimatedDurationMin} min</span>
                </div>
              </>
            ) : (
              <p className="py-10 text-center text-sm text-muted-foreground">No route assigned to this bus.</p>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="h-4 w-4 text-primary" />
                Trip Control
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {hasActive ? (
                <div className="rounded-lg bg-emerald-500/10 px-3 py-2 text-sm">
                  <p className="flex items-center gap-2 font-medium text-emerald-700 dark:text-emerald-400">
                    <CheckCircle2 className="h-4 w-4" /> Active trip in progress
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Started {formatDateTime(p.activeTrip?.startedAt)} · {p.activeTrip?.passengerCount} passengers
                    {p.activeTrip && p.activeTrip.delayMinutes > 0 ? ` · ${p.activeTrip.delayMinutes} min late` : ''}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No active trip. Press Start trip to go live.</p>
              )}

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">GPS sharing</p>
                  <p className="text-xs text-muted-foreground">Broadcast live position to students &amp; parents</p>
                </div>
                <Switch
                  checked={gpsEnabled}
                  onCheckedChange={(v) => gps.mutateAsync(v).catch(() => undefined)}
                  disabled={gps.isPending}
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={0}
                    max={180}
                    value={delayMin}
                    onChange={(e) => setDelayMin(e.target.value)}
                    className="w-24"
                    aria-label="Delay minutes"
                  />
                  <Button variant="outline" onClick={handleDelay} loading={delay.isPending} className="flex-1">
                    Report delay (min)
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">Notify everyone on this route about a delay.</p>
              </div>
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
              <DetailRow label="Fuel" value={<span className="flex items-center justify-end gap-1"><Fuel className="h-3.5 w-3.5 text-muted-foreground" /> {p.bus.fuelLevel}%</span>} />
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatPill label="Trips (30d)" value={p.recentTrips.length} />
        <StatPill label="Active trip" value={hasActive ? 'Running' : 'Idle'} tone={hasActive ? 'success' : undefined} />
        <StatPill label="Stops on route" value={stops?.length ?? p.stops.length} />
      </div>

      {p.recentTrips.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent trips</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Passengers</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead className="text-right">Delay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.recentTrips.slice(0, 6).map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDateTime(t.startedAt)}</TableCell>
                    <TableCell>{t.route?.name ?? '—'}</TableCell>
                    <TableCell><TripStatusBadge status={t.status} /></TableCell>
                    <TableCell>{t.passengerCount}</TableCell>
                    <TableCell>{km(t.distanceKm)}</TableCell>
                    <TableCell className="text-right">{t.delayMinutes > 0 ? `${t.delayMinutes} min` : 'On time'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
