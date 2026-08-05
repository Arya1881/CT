import { useMemo } from 'react';
import { Bus as BusIcon, Clock, GraduationCap, MapPin, UserRound } from 'lucide-react';
import { useParentMe } from '@/hooks/queries';
import { useLiveLocations } from '@/hooks/useLiveLocations';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { BusStatusBadge } from '@/components/shared/StatusBadge';
import { DetailRow } from '@/components/shared/Detail';
import { SchematicMap } from '@/components/maps/SchematicMap';
import { minutesToLabel } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import type { ParentChild } from '@/types';

export function ParentHomePage() {
  const { user } = useAuth();
  const { data: p, isLoading, isError } = useParentMe();
  const live = useLiveLocations();

  const children = useMemo(() => p?.children ?? [], [p]);

  if (isLoading) {
    return (
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-80" />
        <Skeleton className="h-80" />
      </div>
    );
  }

  if (isError || !p) {
    return <EmptyState title="Could not load your profile" message="Refresh the page and try again." />;
  }

  if (children.length === 0) {
    return (
      <div>
        <PageHeader title={`Hi, ${user?.firstName ?? 'there'}`} description="Your children's transport status" />
        <EmptyState title="No children linked" message="Children added to your account will appear here." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Hi, ${user?.firstName ?? 'there'}`}
        description={`You have ${children.length} linked ${children.length === 1 ? 'child' : 'children'}. Follow each child's bus live.`}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        {children.map((child) => (
          <ChildCard key={child.id} child={child} live={live} />
        ))}
      </div>
    </div>
  );
}

function ChildCard({ child, live }: { child: ParentChild; live: Record<string, unknown> }) {
  const liveLoc = child.bus?.id ? (live as any)[child.bus.id] ?? null : null;
  const position = liveLoc ?? child.liveLocation;
  const busRunning = child.bus?.status === 'running';
  const eta = child.eta;

  return (
    <Card>
      <CardHeader className="flex-row items-start justify-between gap-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            {child.name}
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {child.rollNumber} · {child.department} · Year {child.year}
          </p>
        </div>
        {child.bus && <BusStatusBadge status={child.bus.status} />}
      </CardHeader>
      <CardContent>
        {!child.bus || !child.route ? (
          <p className="py-6 text-center text-sm text-muted-foreground">No bus assigned.</p>
        ) : (
          <>
            <SchematicMap
              routes={[child.route]}
              stops={[]}
              buses={[{ id: child.bus.id, label: child.bus.plateNumber, color: child.route.color, position }]}
              height={230}
            />
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                <span className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" /> ETA
                </span>
                <Badge tone={eta?.atStop ? 'success' : busRunning ? 'primary' : 'default'}>
                  {eta?.atStop ? 'At stop' : eta ? minutesToLabel(eta.minutes) : busRunning ? 'On the way' : 'Not running'}
                </Badge>
              </div>
              <DetailRow label="Bus" value={<span className="flex items-center gap-1"><BusIcon className="h-3.5 w-3.5 text-muted-foreground" /> {child.bus.plateNumber}</span>} />
              <DetailRow label="Model" value={child.bus.model} />
              <DetailRow
                label="Driver"
                value={
                  child.driver ? (
                    <span className="flex items-center gap-1">
                      <UserRound className="h-3.5 w-3.5 text-muted-foreground" />
                      {child.driver.name}
                    </span>
                  ) : (
                    '—'
                  )
                }
              />
              <DetailRow
                label="Route"
                value={
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    {child.route.origin} → {child.route.destination}
                  </span>
                }
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
