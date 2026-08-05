import type { LatLng } from '../models/types';

/** Great-circle distance in kilometres. */
export function haversineKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

/** Distance in metres along a polyline from its start to a projected point. */
export function distanceAlongPolyline(points: LatLng[], target: LatLng): number {
  let cumulative = 0;
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const seg = haversineKm(a, b) * 1000;
    if (seg === 0) continue;
    // project target onto segment
    const t = projectOnSegment(a, b, target);
    const proj = lerp(a, b, t);
    const distToB = haversineKm(b, proj) * 1000;
    if (distToB < seg + 1e-6) {
      const distToA = haversineKm(a, proj) * 1000;
      return cumulative + distToA;
    }
    cumulative += seg;
  }
  return cumulative + haversineKm(points[points.length - 1], target) * 1000;
}

/** Total polyline length in metres. */
export function polylineLength(points: LatLng[]): number {
  let total = 0;
  for (let i = 0; i < points.length - 1; i++) total += haversineKm(points[i], points[i + 1]) * 1000;
  return total;
}

function projectOnSegment(a: LatLng, b: LatLng, p: LatLng): number {
  const ax = a.lat, ay = a.lng, bx = b.lat - ax, by = b.lng - ay;
  const t = ((p.lat - ax) * bx + (p.lng - ay) * by) / (bx * bx + by * by || 1);
  return Math.max(0, Math.min(1, t));
}

function lerp(a: LatLng, b: LatLng, t: number): LatLng {
  return { lat: a.lat + (b.lat - a.lat) * t, lng: a.lng + (b.lng - a.lng) * t };
}

/**
 * Return the coordinate (and heading) reached after travelling `distanceMeters`
 * along a polyline from its start. Used by the GPS simulation engine.
 */
export function pointAtDistance(points: LatLng[], distanceMeters: number): { point: LatLng; heading: number } {
  let travelled = 0;
  const last = points[points.length - 1];
  if (points.length === 1) return { point: last, heading: 0 };
  for (let i = 0; i < points.length - 1; i++) {
    const a = points[i];
    const b = points[i + 1];
    const seg = haversineKm(a, b) * 1000;
    if (distanceMeters <= travelled + seg) {
      const t = seg === 0 ? 0 : (distanceMeters - travelled) / seg;
      const heading = bearingDeg(a, b);
      return { point: lerp(a, b, t), heading };
    }
    travelled += seg;
  }
  return { point: last, heading: bearingDeg(points[points.length - 2], last) };
}

export function bearingDeg(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const toDeg = (d: number) => (d * 180) / Math.PI;
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(toRad(b.lat));
  const x = Math.cos(toRad(a.lat)) * Math.sin(toRad(b.lat)) - Math.sin(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}
