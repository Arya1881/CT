import { randomUUID } from 'node:crypto';

/** RFC4122 v4 UUID string. */
export const uuid = (): string => randomUUID();

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function nowIso(): string {
  return new Date().toISOString();
}
