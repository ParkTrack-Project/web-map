import { useQueryState } from 'nuqs';
import { parseAsRouteId } from '@/shared/lib/url';

export function useRouteId() {
  const [routeId, setRoute] = useQueryState(
    'route',
    parseAsRouteId.withOptions({ history: 'replace' }),
  );
  const setRouteId = (id: number | null) => setRoute(id);
  const clearRouteId = () => setRoute(null);
  return { routeId, setRouteId, clearRouteId };
}
