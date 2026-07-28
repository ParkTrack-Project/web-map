import { useQueryState } from 'nuqs';
import { parseAsCoords } from '@/shared/lib/url';

export function useFromCoords() {
  const [from, setFrom] = useQueryState('from', parseAsCoords.withOptions({ history: 'replace' }));
  const setFromCoords = (coords: [number, number] | null) => setFrom(coords);
  const clearFromCoords = () => setFrom(null);
  return { from, setFromCoords, clearFromCoords };
}
