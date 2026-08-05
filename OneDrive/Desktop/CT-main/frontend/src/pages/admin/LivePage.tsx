import { useMemo, useState } from 'react';
import { Bus as BusIcon, Gauge, MapPin, Navigation } from 'lucide-react';
import { useLiveBuses, useRoutes, useStops } from '@/hooks/queries';
import { useLiveLocations } from '@/hooks/useLiveLocations';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { BusStatusBadge } from '@/components/shared/StatusBadge';
import { DetailRow } from '@/components/shared/Detail';
import { SchematicMap } from '@/components/maps/SchematicMap';
import { formatTime, km } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { LiveBusView } from '@/types';

export function AdminLivePage() {
  const { data: snapshot, isLoading } = useLiveBuses();
  const { data: routes } = useRoutes();
  const { data: allStops } = useStops();
  const live = useLiveLocations();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'running' | 'idle'>('all');

  const buses = useMemo(() => {
    const list = snapshot ?? [];
    return list.map((b) => {
      const livePos = b.bus.id ? live[b.bus.id] : null;
      return { ...b, location: (livePos ?? b.location) as any };
    });
  }, [snapshot, live]);

  const filtered = useMemo(
    () => buses.filter((b) => (filter === 'all' ? true : filter === 'running' ? b.bus.status === 'running' : b.bus.status === 'idle')),
    [buses, filter],
  );

  const selected = buses.find((b) => b.bus.id === selectedId) ?? null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Live Fleet Map"
        description={`${buses.length} buses · ${buses.filter((b) => b.bus.status === 'running').length} running`}
        actions={
          <Tabs
            value={filter}
            onValueChange={(v) => setFilter(v as any)}
            tabs={[
              { value: 'all', label: 'All' },
              { value: 'running', label: 'Running' },
              { value: 'idle', label: 'Idle' },
            ]}
          />
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="pt-4">
            {isLoading ? (
              <Skeleton className="h-[420px] w-full" />
            ) : (
              <SchematicMap
                routes={routes ?? []}
                stops={allStops ?? []}
                buses={filtered.map((b) => ({
                  id: b.bus.id,
                  label: b.bus.plateNumber,
                  color: b.color ?? b.route?.color,
                  position: b.location,
                  selected: b.bus.id === selectedId,
                }))}
                height={430}
                showStops={false}
                showStopLabels={false}
              />
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Fleet ({filtered.length})</CardTitle>
            </CardHeader>
            <CardContent className="max-h-[430px] space-y-1.5 overflow-y-auto pr-1">
              {filtered.length === 0 && (
                <p className="py-8 text-center text-sm text-muted-foreground">No buses match the filter.</p>
              )}
              {filtered.map((b) => (
                <button
                  key={b.bus.id}
                  onClick={() => setSelectedId(b.bus.id)}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition-colors',
                    selectedId === b.bus.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-surface-hover',
                  )}
                >
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: b.color ?? '#2563EB' }} />
                      {b.bus.plateNumber}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">{b.route?.name ?? 'Unassigned'}</p>
                  </div>
                  <BusStatusBadge status={b.bus.status} />
                </button>
              ))}
            </CardContent>
          </Card>

          {selected && <SelectedBusCard bus={selected} />}
        </div>
      </div>
    </div>
  );
}

function SelectedBusCard({ bus }: { bus: LiveBusView }) {
  const loc = bus.location;
  const speed = loc?.speedKmh ?? 0;
  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <BusIcon className="h-4 w-4 text-primary" /> {bus.bus.plateNumber}
        </CardTitle>
        <BusStatusBadge status={bus.bus.status} />
      </CardHeader>
      <CardContent>
        <DetailRow label="Model" value={bus.bus.model} />
        <DetailRow label="Route" value={bus.route?.name ?? '—'} />
        <DetailRow label="Driver" value={bus.driver?.name ?? '—'} />
        <DetailRow
          label="Speed"
          value={
            <span className="flex items-center gap-1">
              <Gauge className="h-3.5 w-3.5 text-muted-foreground" />
              {loc ? `${Math.round(speed)} km/h` : '—'}
            </span>
          }
        />
        <DetailRow
          label="Heading"
          value={loc ? <span className="flex items-center justify-end gap-1"><Navigation className="h-3.5 w-3.5 text-muted-foreground" /> {Math.round(loc.heading)}°</span> : '—'}
        />
        <DetailRow
          label="Position"
          value={
            loc ? (
              <span className="flex items-center justify-end gap-1">
                <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                {loc.lat.toFixed(5)}, {loc.lng.toFixed(5)}
              </span>
            ) : (
              'Not broadcasting'
            )
          }
        />
        <DetailRow label="Last update" value={loc ? formatTime(loc.timestamp) : '—'} />
        {bus.activeTrip && (
          <div className="mt-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
            Active trip · {bus.activeTrip.passengerCount} passengers
            {bus.activeTrip.delayMinutes > 0 ? ` · ${bus.activeTrip.delayMinutes} min late` : ''} · {km(bus.activeTrip.distanceKm)}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
