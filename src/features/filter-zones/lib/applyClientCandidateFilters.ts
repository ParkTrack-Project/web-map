import type { RouteCandidate } from '@/entities/zone';
import type { ZoneFilters } from '@/entities/filters';

export function applyClientCandidateFilters(
  candidates: RouteCandidate[],
  f: ZoneFilters,
): RouteCandidate[] {
  const minFreeCount = Math.max(f.hideNoFree ? 1 : 0, f.minFreeCount);

  return candidates.filter((c) => {
    if (minFreeCount > 0 && c.current_free_count < minFreeCount) return false;
    if (f.minConf > 0 && c.current_confidence < f.minConf) return false;
    if (f.maxPay !== null && c.pay > f.maxPay) return false;
    if (f.hideAccessible && c.is_accessible === true) return false;
    if (f.locationType.length > 0) {
      if (c.location_type === null || !f.locationType.includes(c.location_type)) return false;
    }
    // ПРИМЕЧАНИЕ: hidePrivate отсутствует в RouteCandidate (нет поля is_private в API).
    // Если ?hide_private=true передано на сервер, server отфильтрует. Client-side noop.
    // hideInactive — RouteCandidate не имеет is_active (server возвращает только active candidates).
    return true;
  });
}
