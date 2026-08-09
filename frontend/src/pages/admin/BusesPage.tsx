import { useState } from 'react';
import { Bus as BusIcon, Fuel, Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useBuses, useBusMutations, useRoutes, useDrivers } from '@/hooks/queries';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Select as SelectBox } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '@/components/ui/table';
import { Pagination, Separator } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { BusStatusBadge } from '@/components/shared/StatusBadge';
import { useToast } from '@/components/ui/toast';
import type { Bus, BusStatus } from '@/types';

const STATUS_OPTIONS: { value: BusStatus; label: string }[] = [
  { value: 'idle', label: 'Idle' },
  { value: 'running', label: 'Running' },
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'delayed', label: 'Delayed' },
];

export function AdminBusesPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useBuses({ q: debouncedQ, status: status || undefined, page });
  const { create, update, remove } = useBusMutations();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Bus | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Bus | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Bus Fleet"
        description={`${data?.total ?? 0} buses across all campus routes.`}
        actions={
          isAdmin && (
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Add bus
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search plate or model…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="max-w-xs" />
        <SelectBox value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-44">
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
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
            <EmptyState title="No buses found" message="Try a different search, or add a new bus." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Bus</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Fuel</TableHead>
                  <TableHead>Stops</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((row) => (
                  <TableRow key={row.bus.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ background: row.route?.color ?? '#94a3b8' }} />
                        <div>
                          <p className="font-semibold">{row.bus.plateNumber}</p>
                          <p className="text-xs text-muted-foreground">{row.bus.model}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{row.route?.name ?? '—'}</TableCell>
                    <TableCell>{row.driver?.name ?? '—'}</TableCell>
                    <TableCell><BusStatusBadge status={row.bus.status} /></TableCell>
                    <TableCell>{row.bus.capacity}</TableCell>
                    <TableCell>
                      <span className="flex items-center gap-1 text-sm">
                        <Fuel className="h-3.5 w-3.5 text-muted-foreground" />
                        {row.bus.fuelLevel}%
                      </span>
                    </TableCell>
                    <TableCell><Badge tone="muted">{row.stopsCount}</Badge></TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditing(row.bus)} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => setDeleting(row.bus)} aria-label="Delete" className="text-red-600 hover:bg-red-500/10">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
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

      {(creating || editing) && (
        <BusForm
          open
          bus={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={async (body) => {
            try {
              if (editing) {
                await update.mutateAsync({ id: editing.id, body });
                toast('Bus updated', { tone: 'success' });
              } else {
                await create.mutateAsync(body);
                toast('Bus created', { tone: 'success' });
              }
              setCreating(false);
              setEditing(null);
            } catch (err: any) {
              toast('Could not save bus', { message: err?.message, tone: 'destructive' });
            }
          }}
        />
      )}

      {deleting && (
        <Dialog
          open
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Delete bus"
          description={`Remove ${deleting.plateNumber}? This cannot be undone.`}
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button
                variant="destructive"
                loading={remove.isPending}
                onClick={async () => {
                  try {
                    await remove.mutateAsync(deleting.id);
                    toast('Bus deleted', { tone: 'info' });
                  } catch (err: any) {
                    toast('Could not delete bus', { message: err?.message, tone: 'destructive' });
                  }
                  setDeleting(null);
                }}
              >
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">
            Any active trips on this bus will remain in history.
          </p>
        </Dialog>
      )}
    </div>
  );
}

function BusForm({ open, bus, onClose, onSave }: {
  open: boolean;
  bus: Bus | null;
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const { data: routes } = useRoutes();
  const { data: drivers } = useDrivers({});
  const [plate, setPlate] = useState(bus?.plateNumber ?? '');
  const [model, setModel] = useState(bus?.model ?? '');
  const [capacity, setCapacity] = useState(String(bus?.capacity ?? 45));
  const [status, setStatus] = useState<BusStatus>(bus?.status ?? 'idle');
  const [fuel, setFuel] = useState(String(bus?.fuelLevel ?? 90));
  const [routeId, setRouteId] = useState(bus?.routeId ?? '');

  const save = () => {
    onSave({
      plateNumber: plate.trim(),
      model: model.trim(),
      capacity: Number(capacity) || 45,
      status,
      fuelLevel: Number(fuel) || 0,
      routeId: routeId || undefined,
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={bus ? 'Edit bus' : 'Add bus'}
      description="Bus details and route assignment."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Save</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Plate number">
          <Input value={plate} onChange={(e) => setPlate(e.target.value)} placeholder="KA-01-AB-1234" required />
        </Field>
        <Field label="Model">
          <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="Tata Starbus" required />
        </Field>
        <Field label="Capacity">
          <Input type="number" value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </Field>
        <Field label="Fuel level (%)">
          <Input type="number" min={0} max={100} value={fuel} onChange={(e) => setFuel(e.target.value)} />
        </Field>
        <Field label="Status">
          <SelectBox value={status} onChange={(e) => setStatus(e.target.value as BusStatus)}>
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </SelectBox>
        </Field>
        <Field label="Route" hint={routes?.length === 0 ? 'Create a route first.' : undefined}>
          <SelectBox value={routeId} onChange={(e) => setRouteId(e.target.value)}>
            <option value="">Unassigned</option>
            {(routes ?? []).map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </SelectBox>
        </Field>
      </div>
      <Separator className="my-4" />
      <p className="text-xs text-muted-foreground">
        Driver assignment happens on the Drivers page. Available drivers: {(drivers?.data ?? []).filter((d: any) => !d.busId).length}
      </p>
    </Dialog>
  );
}
