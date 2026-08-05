import { useState } from 'react';
import { Bus as BusIcon, MapPin, Pencil, Plus, Route as RouteIcon, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useRouteMutations, useRoutes, useStops, useStopMutations } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Select as SelectBox } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Sheet } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { SchematicMap } from '@/components/maps/SchematicMap';
import { useToast } from '@/components/ui/toast';
import { km } from '@/lib/format';
import { cn } from '@/lib/cn';
import type { LatLng, Route } from '@/types';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444', '#06B6D4', '#EC4899', '#84CC16'];

export function AdminRoutesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: routes, isLoading } = useRoutes();
  const { data: allStops } = useStops();
  const { create, update, remove } = useRouteMutations();
  const { toast } = useToast();
  const [selected, setSelected] = useState<Route | null>(null);
  const [editing, setEditing] = useState<Route | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Route | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Routes & Stops"
        description={`${routes?.length ?? 0} routes serving the campus.`}
        actions={
          isAdmin && (
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Add route
            </Button>
          )
        }
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : !routes || routes.length === 0 ? (
        <EmptyState title="No routes yet" message="Create a route to get started." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {routes.map((r) => (
            <Card
              key={r.id}
              className={cn('cursor-pointer transition-colors hover:border-primary/40', selected?.id === r.id && 'border-primary')}
              onClick={() => setSelected(r)}
            >
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3.5 w-3.5 rounded-full" style={{ background: r.color }} />
                    <p className="font-semibold">{r.name}</p>
                  </div>
                  <Badge tone={r.active ? 'success' : 'muted'}>{r.active ? 'Active' : 'Inactive'}</Badge>
                </div>
                <p className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5" /> {r.origin} → {r.destination}
                </p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                  <span>{km(r.distanceKm)}</span>
                  <span>~{r.estimatedDurationMin} min</span>
                  <span>{r.stopsCount ?? allStops?.filter((s) => s.routeId === r.id).length ?? 0} stops</span>
                  <span>{r.busesCount ?? 0} buses</span>
                </div>
                {isAdmin && (
                  <div className="mt-3 flex justify-end gap-1 border-t border-border pt-3">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditing(r);
                      }}
                      aria-label="Edit route"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-red-600 hover:bg-red-500/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleting(r);
                      }}
                      aria-label="Delete route"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selected && <RouteDetailSheet route={selected} onClose={() => setSelected(null)} />}

      {(creating || editing) && (
        <RouteForm
          open
          route={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={async (body) => {
            try {
              if (editing) {
                await update.mutateAsync({ id: editing.id, body });
                toast('Route updated', { tone: 'success' });
              } else {
                await create.mutateAsync(body);
                toast('Route created', { tone: 'success' });
              }
              setCreating(false);
              setEditing(null);
            } catch (err: any) {
              toast('Could not save route', { message: err?.message, tone: 'destructive' });
            }
          }}
        />
      )}

      {deleting && (
        <Dialog
          open
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Delete route"
          description={`Delete ${deleting.name}? This also removes its stops.`}
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button
                variant="destructive"
                loading={remove.isPending}
                onClick={async () => {
                  try {
                    await remove.mutateAsync(deleting.id);
                    toast('Route deleted', { tone: 'info' });
                  } catch (err: any) {
                    toast('Could not delete route', { message: err?.message, tone: 'destructive' });
                  }
                  setDeleting(null);
                }}
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">Buses on this route will become unassigned.</p>
        </Dialog>
      )}
    </div>
  );
}

function RouteDetailSheet({ route, onClose }: { route: Route; onClose: () => void }) {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { data: stops } = useStops(route.id);
  const { create: createStop, remove: removeStop } = useStopMutations();
  const [stopName, setStopName] = useState('');
  const [offset, setOffset] = useState('0');
  const [adding, setAdding] = useState(false);
  const { toast } = useToast();

  const addStop = async () => {
    const name = stopName.trim();
    if (!name) return;
    const orderIndex = stops?.length ?? 0;
    const waypoint = route.waypoints[Math.min(orderIndex, route.waypoints.length - 1)];
    try {
      await createStop.mutateAsync({
        routeId: route.id,
        name,
        lat: waypoint.lat,
        lng: waypoint.lng,
        orderIndex,
        arrivalOffsetMin: Number(offset) || 0,
      });
      toast('Stop added', { tone: 'success' });
      setStopName('');
      setAdding(false);
    } catch (err: any) {
      toast('Could not add stop', { message: err?.message, tone: 'destructive' });
    }
  };

  const deleteStop = async (id: string) => {
    try {
      await removeStop.mutateAsync(id);
      toast('Stop deleted', { tone: 'info' });
    } catch (err: any) {
      toast('Could not delete stop', { message: err?.message, tone: 'destructive' });
    }
  };

  return (
    <Sheet open onOpenChange={(o) => !o && onClose()} title={route.name} description={`${route.origin} → ${route.destination}`} className="w-full max-w-xl">
      <div className="space-y-5">
        <SchematicMap routes={[route]} stops={stops ?? []} height={220} showStops showStopLabels />
        <div className="grid grid-cols-3 gap-3 text-center">
          <MiniStat label="Distance" value={km(route.distanceKm)} />
          <MiniStat label="Duration" value={`${route.estimatedDurationMin}m`} />
          <MiniStat label="Stops" value={String(stops?.length ?? 0)} />
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-semibold">Stops</p>
            {isAdmin && (
              <Button size="sm" variant="outline" onClick={() => setAdding((a) => !a)}>
                <Plus className="h-3.5 w-3.5" /> Add stop
              </Button>
            )}
          </div>
          {adding && (
            <div className="mb-3 flex items-end gap-2 rounded-lg border border-border p-3">
              <Field label="Stop name" className="flex-1">
                <Input value={stopName} onChange={(e) => setStopName(e.target.value)} placeholder="Block A gate" />
              </Field>
              <Field label="Arrival offset (min)" className="w-32">
                <Input type="number" min={0} value={offset} onChange={(e) => setOffset(e.target.value)} />
              </Field>
              <Button variant="primary" size="sm" onClick={addStop}>Add</Button>
            </div>
          )}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Arrival offset</TableHead>
                {isAdmin && <TableHead className="text-right" />}
              </TableRow>
            </TableHeader>
            <TableBody>
              {stops?.length === 0 && <TableEmpty colSpan={4} message="No stops on this route yet." />}
              {stops?.map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{s.orderIndex + 1}</TableCell>
                  <TableCell className="font-medium">{s.name}</TableCell>
                  <TableCell>{s.arrivalOffsetMin > 0 ? `${s.arrivalOffsetMin} min` : 'Start'}</TableCell>
                  {isAdmin && (
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-500/10" onClick={() => deleteStop(s.id)} aria-label="Delete stop">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </Sheet>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-2.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold">{value}</p>
    </div>
  );
}

function RouteForm({ open, route, onClose, onSave }: {
  open: boolean;
  route: Route | null;
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const [name, setName] = useState(route?.name ?? '');
  const [origin, setOrigin] = useState(route?.origin ?? '');
  const [destination, setDestination] = useState(route?.destination ?? '');
  const [distance, setDistance] = useState(String(route?.distanceKm ?? ''));
  const [duration, setDuration] = useState(String(route?.estimatedDurationMin ?? ''));
  const [color, setColor] = useState(route?.color ?? COLORS[0]);
  const [active, setActive] = useState(route?.active ?? true);

  const save = () => {
    const waypoints: LatLng[] = route?.waypoints ?? generateWaypoints(name || origin || destination);
    onSave({
      name: name.trim(),
      origin: origin.trim(),
      destination: destination.trim(),
      distanceKm: Number(distance) || 1,
      estimatedDurationMin: Number(duration) || 30,
      color,
      active,
      waypoints,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={route ? 'Edit route' : 'Add route'}
      description="Route details. Waypoints are generated automatically."
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Save</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Route name" className="sm:col-span-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="North Campus Loop" required />
        </Field>
        <Field label="Origin">
          <Input value={origin} onChange={(e) => setOrigin(e.target.value)} placeholder="Hostel Block" required />
        </Field>
        <Field label="Destination">
          <Input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Main Gate" required />
        </Field>
        <Field label="Distance (km)">
          <Input type="number" min={0} step="0.1" value={distance} onChange={(e) => setDistance(e.target.value)} />
        </Field>
        <Field label="Estimated duration (min)">
          <Input type="number" min={1} value={duration} onChange={(e) => setDuration(e.target.value)} />
        </Field>
        <Field label="Color" className="sm:col-span-2">
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={cn('h-7 w-7 rounded-full border-2 transition-transform', color === c ? 'scale-110 border-foreground' : 'border-transparent')}
                style={{ background: c }}
                aria-label={`Color ${c}`}
              />
            ))}
          </div>
        </Field>
        <Field label="Active">
          <SelectBox value={active ? 'true' : 'false'} onChange={(e) => setActive(e.target.value === 'true')}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </SelectBox>
        </Field>
      </div>
    </Dialog>
  );
}

/** Deterministic waypoints around a campus area for the demo (no map drawing needed). */
function generateWaypoints(seed: string): LatLng[] {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const baseLat = 12.97 + (h % 100) / 5000;
  const baseLng = 77.59 + ((h >> 4) % 100) / 5000;
  return [
    { lat: baseLat, lng: baseLng },
    { lat: baseLat + 0.035, lng: baseLng + 0.045 },
    { lat: baseLat + 0.07, lng: baseLng - 0.01 },
    { lat: baseLat + 0.09, lng: baseLng - 0.055 },
  ];
}
