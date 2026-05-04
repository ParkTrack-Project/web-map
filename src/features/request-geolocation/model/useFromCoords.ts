// Phase 4 / URL-06 / D-13:
// ?from=lat,lon URL state hook (parallel useDestination).
// history='replace' — geolocation success — singular event, не раздуваем history.
import { useQueryState } from 'nuqs';
// B-1 fix: импорт через barrel `@/shared/lib/url`, не deep-import.
import { parseAsCoords } from '@/shared/lib/url';

export function useFromCoords() {
  const [from, setFrom] = useQueryState('from', parseAsCoords.withOptions({ history: 'replace' }));
  const setFromCoords = (coords: [number, number] | null) => setFrom(coords);
  const clearFromCoords = () => setFrom(null);
  return { from, setFromCoords, clearFromCoords };
}
