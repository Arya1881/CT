import { useEffect, useRef, useState } from 'react';
import { getLiveMap, subscribeLive } from '@/lib/socket';
import type { LiveLocationEvent } from '@/types';

/** Reactive live GPS positions keyed by bus id (fed by the socket stream). */
export function useLiveLocations(): Record<string, LiveLocationEvent> {
  const [map, setMap] = useState<Record<string, LiveLocationEvent>>(() =>
    Object.fromEntries(getLiveMap()),
  );
  const mapRef = useRef(map);
  mapRef.current = map;

  useEffect(() => {
    const update = () => setMap(Object.fromEntries(getLiveMap()));
    const unsub = subscribeLive(update);
    const interval = window.setInterval(update, 1000);
    return () => {
      unsub();
      window.clearInterval(interval);
    };
  }, []);

  return map;
}
