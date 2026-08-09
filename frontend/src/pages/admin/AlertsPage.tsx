import { useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, Plus, ShieldAlert } from 'lucide-react';
import { useAlertStats, useAlerts, useEmergencyMutations } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, StatCard } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input, Textarea, Field } from '@/components/ui/input';
import { Select as SelectBox } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '@/components/ui/table';
import { Pagination } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { EmergencyStatusBadge } from '@/components/shared/StatusBadge';
import { formatDateTime } from '@/lib/format';
import { useToast } from '@/components/ui/toast';
import type { EmergencyStatus } from '@/types';

const TYPE_LABELS: Record<string, string> = {
  panic: 'Panic',
  accident: 'Accident',
  medical: 'Medical',
  safety: 'Safety',
  breakdown: 'Breakdown',
  other: 'Other',
};

export function AdminAlertsPage() {
  const { data: stats } = useAlertStats();
  const { data: alertsPage, isLoading } = useAlerts({ page: 1 });
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data: filtered } = useAlerts({ status: statusFilter || undefined, page });
  const { setStatus } = useEmergencyMutations();
  const { toast } = useToast();
  const [raising, setRaising] = useState(false);

  const rows = statusFilter ? (filtered?.data ?? []) : (alertsPage?.data ?? []);
  const total = (statusFilter ? filtered : alertsPage)?.total ?? 0;
  const totalPages = (statusFilter ? filtered : alertsPage)?.totalPages ?? 1;

  const changeStatus = async (id: string, s: EmergencyStatus) => {
    try {
      await setStatus.mutateAsync({ id, status: s });
      toast(s === 'resolved' ? 'Alert resolved' : 'Alert updated', { tone: s === 'resolved' ? 'success' : 'info' });
    } catch (err: any) {
      toast('Could not update alert', { message: err?.message, tone: 'destructive' });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Emergency Alerts"
        description="Monitor and respond to incidents across the fleet."
        actions={
          <Button variant="primary" onClick={() => setRaising(true)}>
            <Plus className="h-4 w-4" /> Raise alert
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total alerts" value={stats?.total ?? '—'} icon={<AlertTriangle className="h-5 w-5" />} />
        <StatCard label="Open" value={stats?.open ?? '—'} hint="Require action" icon={<ShieldAlert className="h-5 w-5" />} />
        <StatCard label="Investigating" value={stats?.investigating ?? '—'} icon={<Clock className="h-5 w-5" />} />
        <StatCard label="Resolved" value={stats?.resolved ?? '—'} icon={<CheckCircle2 className="h-5 w-5" />} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <SelectBox value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }} className="w-44">
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="investigating">Investigating</option>
          <option value="resolved">Resolved</option>
        </SelectBox>
      </div>

      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="No alerts" message="All quiet. New alerts will appear here in real time." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Raised</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <span className="flex items-center gap-2 font-medium capitalize">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        {TYPE_LABELS[a.type] ?? a.type}
                      </span>
                    </TableCell>
                    <TableCell>
                      <p className="font-medium">{a.reporter?.name ?? 'Unknown'}</p>
                      {a.reporter?.email && <p className="text-xs text-muted-foreground">{a.reporter.email}</p>}
                    </TableCell>
                    <TableCell>{formatDateTime(a.createdAt)}</TableCell>
                    <TableCell><EmergencyStatusBadge status={a.status} /></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {a.status !== 'resolved' && (
                          <Button size="sm" variant="outline" onClick={() => changeStatus(a.id, a.status === 'open' ? 'investigating' : 'resolved')}>
                            {a.status === 'open' ? 'Investigate' : 'Resolve'}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {totalPages > 1 && (
        <Pagination page={page} pageSize={20} total={total} onPageChange={setPage} />
      )}

      {raising && <RaiseAlertDialog onClose={() => setRaising(false)} />}
    </div>
  );
}

function RaiseAlertDialog({ onClose }: { onClose: () => void }) {
  const { raise } = useEmergencyMutations();
  const { toast } = useToast();
  const [type, setType] = useState('panic');
  const [description, setDescription] = useState('');

  const submit = async () => {
    try {
      await raise.mutateAsync({ type, description: description.trim() || undefined });
      toast('Alert raised', { message: 'Dispatch has been notified.', tone: 'success' });
      onClose();
    } catch (err: any) {
      toast('Could not raise alert', { message: err?.message, tone: 'destructive' });
    }
  };

  return (
    <Dialog
      open
      onOpenChange={(o) => !o && onClose()}
      title="Raise emergency alert"
      description="Notify dispatch immediately about an incident."
      footer={
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button variant="destructive" loading={raise.isPending} onClick={submit}>
            <AlertTriangle className="h-4 w-4" /> Raise alert
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Alert type">
          <SelectBox value={type} onChange={(e) => setType(e.target.value)}>
            {Object.entries(TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </SelectBox>
        </Field>
        <Field label="Description (optional)">
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Briefly describe the situation…" rows={3} />
        </Field>
      </div>
    </Dialog>
  );
}
