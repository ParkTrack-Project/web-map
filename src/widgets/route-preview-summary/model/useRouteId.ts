// Phase 4 / D-28: ?route=<int> URL state.
// history='replace' — route создаётся редко, не раздуваем browser back.
// B-1 fix: импорт через barrel `@/shared/lib/url`, не deep-import `@/shared/lib/url/parsers`.
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
