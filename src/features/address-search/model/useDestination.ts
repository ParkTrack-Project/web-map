import { useQueryState } from 'nuqs';
import { parseAsCoords } from '@/shared/lib/url';

export function useDestination() {
  const [dest, setDest] = useQueryState('dest', parseAsCoords.withOptions({ history: 'replace' }));
  const setDestination = (coords: [number, number] | null) => setDest(coords);
  const clearDestination = () => setDest(null);
  // setDest returns Promise<URLSearchParams>; both helpers return that promise so
  // callers могут await flushed URL update (нужно для tests + reload-safe consume).
  return { dest, setDestination, clearDestination };
}
