import { useState } from 'react';
import { Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useBuses, useDriverCrud, useDrivers } from '@/hooks/queries';
import { useDebounce } from '@/hooks/useDebounce';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Field } from '@/components/ui/input';
import { Select as SelectBox } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '@/components/ui/table';
import { Pagination } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { DriverStatusBadge } from '@/components/shared/StatusBadge';
import { formatDate } from '@/lib/format';
import { useToast } from '@/components/ui/toast';
import type { Driver } from '@/types';

export function AdminDriversPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useDrivers({ q: debouncedQ, status: status || undefined, page });
  const { create, update, remove } = useDriverCrud();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Driver | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Driver | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drivers"
        description={`${data?.total ?? 0} drivers in the fleet.`}
        actions={
          isAdmin && (
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Add driver
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search name or license…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="max-w-xs" />
        <SelectBox value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-44">
          <option value="">All statuses</option>
          <option value="available">Available</option>
          <option value="on_duty">On duty</option>
          <option value="off_duty">Off duty</option>
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
            <EmptyState title="No drivers found" message="Try a different search or add a driver." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>License</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Hired</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((d) => (
                  <TableRow key={d.id}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell>{d.licenseNo}</TableCell>
                    <TableCell>{(d as any).bus?.plateNumber ?? '—'}</TableCell>
                    <TableCell><DriverStatusBadge status={d.status} /></TableCell>
                    <TableCell>
                      {d.phone ? (
                        <span className="flex items-center gap-1 text-sm"><Phone className="h-3.5 w-3.5 text-muted-foreground" /> {d.phone}</span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>{formatDate(d.hireDate)}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditing(d)} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-500/10" onClick={() => setDeleting(d)} aria-label="Delete">
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
        <DriverForm
          open
          driver={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={async (body) => {
            try {
              if (editing) {
                await update.mutateAsync({ id: editing.id, body });
                toast('Driver updated', { tone: 'success' });
              } else {
                await create.mutateAsync(body);
                toast('Driver created', { tone: 'success' });
              }
              setCreating(false);
              setEditing(null);
            } catch (err: any) {
              toast('Could not save driver', { message: err?.message, tone: 'destructive' });
            }
          }}
        />
      )}

      {deleting && (
        <Dialog
          open
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Delete driver"
          description={`Remove ${deleting.name}? This cannot be undone.`}
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="destructive" loading={remove.isPending} onClick={async () => {
                try {
                  await remove.mutateAsync(deleting.id);
                  toast('Driver deleted', { tone: 'info' });
                } catch (err: any) {
                  toast('Could not delete driver', { message: err?.message, tone: 'destructive' });
                }
                setDeleting(null);
              }}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">Their bus (if any) will be freed up.</p>
        </Dialog>
      )}
    </div>
  );
}

function DriverForm({ open, driver, onClose, onSave }: {
  open: boolean;
  driver: Driver | null;
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const { data: buses } = useBuses({});
  const [firstName, setFirstName] = useState((driver as any)?.name?.split(' ')[0] ?? '');
  const [lastName, setLastName] = useState((driver as any)?.name?.split(' ')[1] ?? '');
  const [email, setEmail] = useState((driver as any)?.email ?? '');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(driver?.phone ?? '');
  const [licenseNo, setLicenseNo] = useState(driver?.licenseNo ?? '');
  const [busId, setBusId] = useState(driver?.busId ?? '');

  const save = () => {
    const body: Record<string, unknown> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone,
      licenseNo: licenseNo.trim(),
      busId: busId || null,
    };
    if (!driver) {
      body.email = email.trim();
      body.password = password;
    }
    onSave(body);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={driver ? 'Edit driver' : 'Add driver'}
      description={driver ? 'Update driver details and bus assignment.' : 'Create a driver account and assign a bus.'}
      size="md"
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={save}>Save</Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="First name">
          <Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </Field>
        <Field label="Last name">
          <Input value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </Field>
        {!driver && (
          <>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="driver@campustransit.app" required />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="min 6 characters" required />
            </Field>
          </>
        )}
        <Field label="Phone">
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" />
        </Field>
        <Field label="License number">
          <Input value={licenseNo} onChange={(e) => setLicenseNo(e.target.value)} placeholder="KA-2026-00XXXX" required />
        </Field>
        <Field label="Assigned bus" className="sm:col-span-2">
          <SelectBox value={busId} onChange={(e) => setBusId(e.target.value)}>
            <option value="">No bus</option>
            {(buses?.data ?? []).map((row) => (
              <option key={row.bus.id} value={row.bus.id}>
                {row.bus.plateNumber} — {row.bus.model}
              </option>
            ))}
          </SelectBox>
        </Field>
      </div>
    </Dialog>
  );
}
