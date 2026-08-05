import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatDateTime } from '@/lib/format';
import type { AuditLog } from '@/types';

export function AuditPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['audit'],
    queryFn: () => api<Array<AuditLog & { user: string | null }>>('/audit?limit=300'),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Audit Log"
        description="System actions recorded for accountability."
      />
      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !data || data.length === 0 ? (
            <TableEmpty colSpan={5} message="No audit entries yet." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(l.createdAt)}</TableCell>
                    <TableCell>{l.user ?? '—'}</TableCell>
                    <TableCell>
                      <Badge tone="muted">{l.action}</Badge>
                    </TableCell>
                    <TableCell>{l.entity ?? '—'}</TableCell>
                    <TableCell className="max-w-xs truncate text-muted-foreground">
                      {Object.keys(l.meta ?? {}).length > 0 ? JSON.stringify(l.meta) : '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
