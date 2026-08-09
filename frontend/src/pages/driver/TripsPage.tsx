import { useDriverTripsMe } from '@/hooks/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableEmpty } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { TripStatusBadge } from '@/components/shared/StatusBadge';
import { formatDateTime, km } from '@/lib/format';

export function DriverTripsPage() {
  const { data: trips, isLoading } = useDriverTripsMe();

  return (
    <div>
      <PageHeader title="My Trips" description="All trips you have driven." />
      <Card>
        <CardContent className="pt-4">
          {isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !trips || trips.length === 0 ? (
            <EmptyState title="No trips yet" message="Start a trip from the dashboard to see it here." />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Started</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Bus</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Passengers</TableHead>
                  <TableHead>Distance</TableHead>
                  <TableHead className="text-right">Delay</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {trips.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{formatDateTime(t.startedAt)}</TableCell>
                    <TableCell className="font-medium">{t.route?.name ?? '—'}</TableCell>
                    <TableCell>{t.bus?.plateNumber ?? '—'}</TableCell>
                    <TableCell><TripStatusBadge status={t.status} /></TableCell>
                    <TableCell>{t.passengerCount}</TableCell>
                    <TableCell>{km(t.distanceKm)}</TableCell>
                    <TableCell className="text-right">{t.delayMinutes > 0 ? `${t.delayMinutes} min` : 'On time'}</TableCell>
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
