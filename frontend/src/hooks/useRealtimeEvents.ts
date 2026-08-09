import { useEffect, useRef } from 'react';
import { subscribeEvents } from '@/lib/socket';

/**
 * Subscribe to realtime socket events (trip started/completed/delayed,
 * bus near stop, notifications, emergency alerts).
 * Callback receives (event, payload).
 */
export function useRealtimeEvents(cb: (event: string, payload: unknown) => void): void {
  const cbRef = useRef(cb);
  cbRef.current = cb;

  useEffect(() => {
    return subscribeEvents((event, payload) => cbRef.current(event, payload));
  }, []);
}
