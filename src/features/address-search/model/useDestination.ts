// Phase 4 / URL-05 / D-17:
// ?dest=lat,lon URL state hook.
// setDestination([lat, lon]) → toFixed(5) серилазация автоматически от parseAsCoords.
// Используем history='replace' — search/select frequent, не раздуваем browser back stack
// (D-17 «через replaceState (не раздуваем history)»).
import { useQueryState } from 'nuqs';
// B-1 fix: импорт через barrel `@/shared/lib/url`, не deep-import `@/shared/lib/url/parsers` (FSD-compliance).
import { parseAsCoords } from '@/shared/lib/url';

export function useDestination() {
  const [dest, setDest] = useQueryState('dest', parseAsCoords.withOptions({ history: 'replace' }));
  const setDestination = (coords: [number, number] | null) => setDest(coords);
  const clearDestination = () => setDest(null);
  // setDest returns Promise<URLSearchParams>; both helpers return that promise so
  // callers могут await flushed URL update (нужно для tests + reload-safe consume).
  return { dest, setDestination, clearDestination };
}
