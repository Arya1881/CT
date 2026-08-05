import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  AlertTriangle,
  Bus as BusIcon,
  CalendarDays,
  CheckCircle2,
  Clock,
  Fuel,
  GraduationCap,
  UserRound,
} from 'lucide-react';
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import {
  useAlerts,
  useAnalyticsOverview,
  useBusUtilization,
  useDriverPerformance,
  useTripSeries,
} from '@/hooks/queries';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle, StatCard } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { EmergencyStatusBadge } from '@/components/shared/StatusBadge';
import { formatDateTime, km } from '@/lib/format';

export function AdminDashboardPage() {
  const { data: overview, isLoading: overviewLoading } = useAnalyticsOverview();
  const { data: series, isLoading: seriesLoading } = useTripSeries('daily');
  const { data: drivers } = useDriverPerformance();
  const { data: utilization } = useBusUtilization();
  const { data: alerts } = useAlerts({ page: 1 });
  const [range, setRange] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const { data: seriesRange, isLoading: rangeLoading } = useTripSeries(range);

  const chartData = useMemo(() => (range === 'daily' ? series?.series ?? [] : seriesRange?.series ?? []), [series, seriesRange, range]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Operations Dashboard"
        description="Live fleet status, today's performance and recent activity."
        actions={
          <Tabs
            value={range}
            onValueChange={(v) => setRange(v as any)}
            tabs={[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' },
            ]}
          />
        }
      />

      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Fleet"
          value={overview?.fleet.total ?? '—'}
          hint={
            overview
              ? `${overview.fleet.running} running · ${overview.fleet.idle} idle`
              : undefined
          }
          icon={<BusIcon className="h-5 w-5" />}
        />
        <StatCard
          label="Students"
          value={overview?.students ?? '—'}
          hint={overview ? `${overview.drivers} drivers · ${overview.driversOnDuty} on duty` : undefined}
          icon={<GraduationCap className="h-5 w-5" />}
        />
        <StatCard
          label="Active trips"
          value={overview?.activeTrips ?? '—'}
          hint={overview ? `${overview.tripsToday} trips today` : undefined}
          icon={<CalendarDays className="h-5 w-5" />}
        />
        <StatCard
          label="On-time rate (30d)"
          value={overview ? `${overview.onTimeRate}%` : '—'}
          hint={overview ? `${overview.delayedToday} delayed today` : undefined}
          icon={<CheckCircle2 className="h-5 w-5" />}
        />
      </div>

      {/* Open alerts banner */}
      {(overview?.openAlerts ?? 0) > 0 && (
        <div className="flex items-center gap-3 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <p className="flex-1">
            <span className="font-semibold">{overview!.openAlerts} open emergency {overview!.openAlerts === 1 ? 'alert' : 'alerts'}</span>
            <span className="text-muted-foreground"> — review the Emergency Alerts page.</span>
          </p>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Trips chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Trip volume &amp; punctuality</CardTitle>
          </CardHeader>
          <CardContent>
            {seriesLoading || rangeLoading ? (
              <Skeleton className="h-64 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="trips" name="Total" fill="#2563EB" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="completed" name="Completed" fill="#10B981" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="delayed" name="Delayed" fill="#F59E0B" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Bus utilization (30d)</CardTitle>
          </CardHeader>
          <CardContent>
            {!utilization || utilization.length === 0 ? (
              <Skeleton className="h-56 w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={utilization} layout="vertical" margin={{ top: 0, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" />
                  <YAxis type="category" dataKey="plateNumber" width={64} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid var(--border)' }} formatter={(v: any) => [`${v}%`, 'Avg fill']} />
                  <Bar dataKey="avgFillPct" name="Fill" fill="#8B5CF6" radius={[0, 4, 4, 0]} barSize={14} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Driver performance */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-primary" /> Driver performance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Driver</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Trips</TableHead>
                  <TableHead className="text-right">Completed</TableHead>
                  <TableHead className="text-right">On-time</TableHead>
                  <TableHead className="text-right">Distance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(drivers ?? []).slice(0, 8).map((d: any) => (
                  <TableRow key={d.driverId}>
                    <TableCell className="font-medium">{d.name}</TableCell>
                    <TableCell><Badge tone={d.status === 'on_duty' ? 'success' : d.status === 'available' ? 'info' : 'muted'}>{d.status.replace('_', ' ')}</Badge></TableCell>
                    <TableCell className="text-right">{d.trips}</TableCell>
                    <TableCell className="text-right">{d.completed}</TableCell>
                    <TableCell className="text-right">{d.onTimeRate}%</TableCell>
                    <TableCell className="text-right">{km(d.totalKm)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Recent alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-primary" /> Recent emergency alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            {(alerts?.data ?? []).length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No alerts.</p>
            ) : (
              <div className="space-y-2">
                {(alerts?.data ?? []).slice(0, 6).map((a) => (
                  <div key={a.id} className="rounded-lg border border-border p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{a.type}</span>
                      <EmergencyStatusBadge status={a.status} />
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {a.reporter?.name ?? 'Unknown'} · {formatDateTime(a.createdAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Fleet summary strip */}
      <Card>
        <CardContent className="grid gap-4 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryRow icon={<Fuel className="h-4 w-4" />} label="Fleet fuel" value={overview ? `${avgFuel(utilization ?? [])}% avg` : '—'} />
          <SummaryRow icon={<Clock className="h-4 w-4" />} label="Trips (30d)" value={overview?.totalTrips30d ?? '—'} />
          <SummaryRow icon={<CalendarDays className="h-4 w-4" />} label="Distance (30d)" value={overview ? km(overview.totalDistance30d) : '—'} />
          <SummaryRow icon={<GraduationCap className="h-4 w-4" />} label="Avg passengers / trip" value={overview?.avgPassengers ?? '—'} />
        </CardContent>
      </Card>
    </div>
  );
}

function avgFuel(rows: Array<Record<string, unknown>>): number {
  if (rows.length === 0) return 0;
  return Math.round(rows.reduce((s, r) => s + (Number(r.fuelLevel) || 0), 0) / rows.length);
}

function SummaryRow({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-lg bg-primary/10 p-2 text-primary">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}
