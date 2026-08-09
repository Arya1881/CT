import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { useBuses, useParents, useStops, useStudentCrud, useStudents } from '@/hooks/queries';
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
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import type { Student } from '@/types';

export function AdminStudentsPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const [q, setQ] = useState('');
  const debouncedQ = useDebounce(q, 300);
  const [dept, setDept] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading } = useStudents({ q: debouncedQ, department: dept || undefined, page });
  const { create, update, remove } = useStudentCrud();
  const { toast } = useToast();
  const [editing, setEditing] = useState<Student | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Student | null>(null);

  const departments = useMemo(() => {
    const set = new Set<string>();
    for (const s of data?.data ?? []) if (s.department) set.add(s.department);
    return [...set].sort();
  }, [data]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Students"
        description={`${data?.total ?? 0} students enrolled in transport.`}
        actions={
          isAdmin && (
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> Add student
            </Button>
          )
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <Input placeholder="Search name, roll or email…" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} className="max-w-xs" />
        <SelectBox value={dept} onChange={(e) => { setDept(e.target.value); setPage(1); }} className="w-48">
          <option value="">All departments</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
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
            <EmptyState title="No students found" message="Try a different search or add a student." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll</TableHead>
                  <TableHead>Department</TableHead>
                  <TableHead>Year</TableHead>
                  <TableHead>Bus</TableHead>
                  {isAdmin && <TableHead className="text-right">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.data.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{s.rollNumber}</TableCell>
                    <TableCell>{s.department}</TableCell>
                    <TableCell><Badge tone="muted">Yr {s.year}</Badge></TableCell>
                    <TableCell>{s.busId ? 'Assigned' : '—'}</TableCell>
                    {isAdmin && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => setEditing(s)} aria-label="Edit">
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="text-red-600 hover:bg-red-500/10" onClick={() => setDeleting(s)} aria-label="Delete">
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
        <StudentForm
          open
          student={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={async (body) => {
            try {
              if (editing) {
                await update.mutateAsync({ id: editing.id, body });
                toast('Student updated', { tone: 'success' });
              } else {
                await create.mutateAsync(body);
                toast('Student created', { tone: 'success' });
              }
              setCreating(false);
              setEditing(null);
            } catch (err: any) {
              toast('Could not save student', { message: err?.message, tone: 'destructive' });
            }
          }}
        />
      )}

      {deleting && (
        <Dialog
          open
          onOpenChange={(o) => !o && setDeleting(null)}
          title="Delete student"
          description={`Remove ${deleting.name} from transport?`}
          footer={
            <>
              <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
              <Button variant="destructive" loading={remove.isPending} onClick={async () => {
                try {
                  await remove.mutateAsync(deleting.id);
                  toast('Student deleted', { tone: 'info' });
                } catch (err: any) {
                  toast('Could not delete student', { message: err?.message, tone: 'destructive' });
                }
                setDeleting(null);
              }}>
                Delete
              </Button>
            </>
          }
        >
          <p className="text-sm text-muted-foreground">Their transport assignment will be removed.</p>
        </Dialog>
      )}
    </div>
  );
}

function StudentForm({ open, student, onClose, onSave }: {
  open: boolean;
  student: Student | null;
  onClose: () => void;
  onSave: (body: Record<string, unknown>) => void;
}) {
  const { data: buses } = useBuses({});
  const { data: stops } = useStops();
  const { data: parents } = useParents({});
  const [firstName, setFirstName] = useState((student as any)?.name?.split(' ')[0] ?? '');
  const [lastName, setLastName] = useState((student as any)?.name?.split(' ').slice(1).join(' ') ?? '');
  const [email, setEmail] = useState((student as any)?.email ?? '');
  const [password, setPassword] = useState('');
  const [rollNumber, setRollNumber] = useState(student?.rollNumber ?? '');
  const [department, setDepartment] = useState(student?.department ?? '');
  const [year, setYear] = useState(String(student?.year ?? 1));
  const [busId, setBusId] = useState(student?.busId ?? '');
  const [stopId, setStopId] = useState(student?.stopId ?? '');
  const [parentId, setParentId] = useState(student?.parentId ?? '');
  const [emergencyName, setEmergencyName] = useState(student?.emergencyContactName ?? '');
  const [emergencyPhone, setEmergencyPhone] = useState(student?.emergencyContactPhone ?? '');

  const routeStops = useMemo(
    () => {
      const routeId = buses?.data.find((b) => b.bus.id === busId)?.route?.id;
      return routeId ? (stops ?? []).filter((s) => s.routeId === routeId) : [];
    },
    [buses, stops, busId],
  );

  const save = () => {
    const body: Record<string, unknown> = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      rollNumber: rollNumber.trim(),
      department: department.trim(),
      year: Number(year) || 1,
      busId: busId || null,
      stopId: stopId || null,
      parentId: parentId || null,
      emergencyContactName: emergencyName,
      emergencyContactPhone: emergencyPhone,
    };
    if (!student) {
      body.email = email.trim();
      body.password = password;
    }
    onSave(body);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => !o && onClose()}
      title={student ? 'Edit student' : 'Add student'}
      description="Student details and route assignment."
      size="lg"
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
        {!student && (
          <>
            <Field label="Email">
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </Field>
            <Field label="Password">
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </Field>
          </>
        )}
        <Field label="Roll number">
          <Input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="21CS1012" required />
        </Field>
        <Field label="Department">
          <Input value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Computer Science" required />
        </Field>
        <Field label="Year">
          <SelectBox value={year} onChange={(e) => setYear(e.target.value)}>
            {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>{y}</option>)}
          </SelectBox>
        </Field>
        <Field label="Assigned bus">
          <SelectBox value={busId} onChange={(e) => { setBusId(e.target.value); setStopId(''); }}>
            <option value="">No bus</option>
            {(buses?.data ?? []).map((row) => (
              <option key={row.bus.id} value={row.bus.id}>{row.bus.plateNumber}</option>
            ))}
          </SelectBox>
        </Field>
        <Field label="Pickup stop">
          <SelectBox value={stopId} onChange={(e) => setStopId(e.target.value)}>
            <option value="">None</option>
            {routeStops.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </SelectBox>
        </Field>
        <Field label="Parent / guardian">
          <SelectBox value={parentId} onChange={(e) => setParentId(e.target.value)}>
            <option value="">None</option>
            {(parents?.data ?? []).map((p) => (
              <option key={p.id} value={p.id}>{(p as any).name ?? 'Parent'}</option>
            ))}
          </SelectBox>
        </Field>
        <Field label="Emergency contact name">
          <Input value={emergencyName} onChange={(e) => setEmergencyName(e.target.value)} />
        </Field>
        <Field label="Emergency contact phone">
          <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder="+91 …" />
        </Field>
      </div>
    </Dialog>
  );
}
