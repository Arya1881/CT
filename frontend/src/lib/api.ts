import type { ApiEnvelope } from '@/types';

const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

export class ApiError extends Error {
  readonly status: number;
  readonly details?: unknown;
  constructor(status: number, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

interface RequestOptions {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  headers?: Record<string, string>;
  /** Parse as raw text (e.g. CSV). */
  raw?: boolean;
}

/** Thin typed fetch wrapper for the REST API. */
export async function api<T>(
  path: string,
  { method = 'GET', body, query, headers, raw }: RequestOptions = {},
): Promise<T> {
  const url = new URL(BASE_URL + path, window.location.origin);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== '') url.searchParams.set(k, String(v));
    }
  }

  const res = await fetch(url.toString(), {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && authToken) {
    // session expired
    setAuthToken(null);
    window.dispatchEvent(new Event('ct:unauthorized'));
  }

  if (raw) {
    if (!res.ok) throw new ApiError(res.status, `Request failed (${res.status})`);
    return (await res.text()) as unknown as T;
  }

  const text = await res.text();
  const json = text ? (JSON.parse(text) as ApiEnvelope<T>) : null;
  if (!res.ok || !json?.success) {
    const error = (json as any)?.error ?? `Request failed (${res.status})`;
    throw new ApiError(res.status, error, (json as any)?.details);
  }
  return json.data;
}
