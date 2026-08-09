import { useMemo } from 'react';
import { cn } from '@/lib/cn';
import type { LatLng, LiveLocationEvent, Route, Stop } from '@/types';

interface SchematicMapProps {
  routes?: Route[];
  stops?: Stop[];
  buses?: Array<{
    id: string;
    label?: string;
    color?: string;
    position?: LatLng | LiveLocationEvent | null;
    selected?: boolean;
  }>;
  trail?: LatLng[];
  height?: number | string;
  className?: string;
  showStops?: boolean;
  showStopLabels?: boolean;
}

interface Projector {
  x: (lng: number) => number;
  y: (lat: number) => number;
}

const W = 800;
const PAD = 36;

export function useProjector(points: LatLng[], width: number, height: number): Projector {
  return useMemo(() => {
    if (points.length === 0) return { x: () => 0, y: () => 0 };
    const lngs = points.map((p) => p.lng);
    const lats = points.map((p) => p.lat);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const spanLng = maxLng - minLng || 1;
    const spanLat = maxLat - minLat || 1;
    const scale = Math.min((width - PAD * 2) / spanLng, (height - PAD * 2) / spanLat);
    const offsetX = (width - spanLng * scale) / 2;
    const offsetY = (height - spanLat * scale) / 2;
    return {
      x: (lng: number) => offsetX + (lng - minLng) * scale,
      y: (lat: number) => offsetY + (maxLat - lat) * scale,
    };
  }, [points, width, height]);
}

function pathFrom(points: LatLng[], proj: Projector): string {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${proj.x(p.lng).toFixed(1)},${proj.y(p.lat).toFixed(1)}`).join(' ');
}

function toLatLng(pos: LatLng | LiveLocationEvent): LatLng {
  return { lat: (pos as any).lat, lng: (pos as any).lng };
}

export function SchematicMap({
  routes = [],
  stops = [],
  buses = [],
  trail,
  height = 320,
  className,
  showStops = true,
  showStopLabels = false,
}: SchematicMapProps) {
  const h = typeof height === 'number' ? height : 320;

  const allPoints = useMemo(() => {
    const pts: LatLng[] = [];
    for (const r of routes) pts.push(...(r.waypoints ?? []));
    if (trail) pts.push(...trail);
    for (const b of buses) if (b.position) pts.push(toLatLng(b.position));
    if (pts.length === 0) return [{ lat: 13, lng: 77.5 }];
    return pts;
  }, [routes, trail, buses]);

  const proj = useProjector(allPoints, W, h);

  return (
    <div
      className={cn('relative overflow-hidden rounded-xl border border-border bg-[#F1F7F3] dark:bg-[#0c1a10]', className)}
      style={{ height: h }}
    >
      <svg className="h-full w-full" viewBox={`0 0 ${W} ${h}`} preserveAspectRatio="none">
        <defs>
          <pattern id="ct-grid" width="42" height="42" patternUnits="userSpaceOnUse">
            <path d="M42 0H0V42" fill="none" stroke="rgba(15,120,60,0.10)" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width={W} height={h} fill="url(#ct-grid)" />

        {routes.map((r) => {
          const pts = r.waypoints ?? [];
          if (pts.length === 0) return null;
          const d = pathFrom(pts, proj);
          return (
            <g key={r.id}>
              <path d={d} fill="none" stroke={r.color ?? '#2563EB'} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" opacity={0.22} />
              <path d={d} fill="none" stroke={r.color ?? '#2563EB'} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
            </g>
          );
        })}

        {trail && trail.length > 1 && (
          <path
            d={pathFrom(trail, proj)}
            fill="none"
            stroke="#0b1220"
            strokeWidth={1.5}
            strokeDasharray="5 4"
            strokeLinecap="round"
            opacity={0.5}
          />
        )}

        {showStops &&
          stops.map((s) => (
            <g key={s.id}>
              <circle cx={proj.x(s.lng)} cy={proj.y(s.lat)} r={5} fill="#fff" stroke="#64748B" strokeWidth={2} />
              {showStopLabels && (
                <text x={proj.x(s.lng)} y={proj.y(s.lat) - 9} textAnchor="middle" fontSize={10} fill="#475569">
                  {s.name}
                </text>
              )}
            </g>
          ))}

        {buses.map((b) => {
          if (!b.position) return null;
          const p = toLatLng(b.position);
          const cx = proj.x(p.lng);
          const cy = proj.y(p.lat);
          const color = b.color ?? '#2563EB';
          return (
            <g key={b.id}>
              <circle cx={cx} cy={cy} r={16} fill={color} opacity={0.15}>
                <animate attributeName="r" values="10;22;10" dur="2s" repeatCount="indefinite" />
                <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
              </circle>
              <circle cx={cx} cy={cy} r={7} fill={color} stroke="#fff" strokeWidth={2.5} />
              {b.label && (
                <text x={cx} y={cy - 12} textAnchor="middle" fontSize={10} fontWeight={600} fill={color}>
                  {b.label}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
