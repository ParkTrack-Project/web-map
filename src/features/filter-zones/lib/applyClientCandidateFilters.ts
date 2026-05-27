// Phase 4 / D-25 / RANK-07 / Pitfall 8:
// Параллельная implementation с applyClientFilters но для RouteCandidate.
// Reads candidate.current_* поля (НЕ free_count — это поле существует только в ZoneMapItem).
// ВАЖНО: server уже применил max_pay, min_free_count, min_confidence, include_accessible
// через body params (D-25). Эта функция — safety-net + дополнительные client-only фильтры
// (hideNoFree выходит за server min_free_count логику; locationType — client side).
import type { RouteCandidate } from '@/entities/zone';
import type { ZoneFilters } from '@/entities/filters';

export function applyClientCandidateFilters(
  candidates: RouteCandidate[],
  f: ZoneFilters,
): RouteCandidate[] {
  const minFreeCount = Math.max(f.hideNoFree ? 1 : 0, f.minFreeCount);

  return candidates.filter((c) => {
    // hideNoFree (FILTER-01)
    if (minFreeCount > 0 && c.current_free_count < minFreeCount) return false;
    // minConf (FILTER-02) — safety-net
    if (f.minConf > 0 && c.current_confidence < f.minConf) return false;
    // maxPay (FILTER-03) — safety-net
    if (f.maxPay !== null && c.pay > f.maxPay) return false;
    // hideAccessible (FILTER-05) — server включает include_accessible=false но safety-net
    if (f.hideAccessible && c.is_accessible === true) return false;
    // locationType (FILTER-06)
    if (f.locationType.length > 0) {
      if (c.location_type === null || !f.locationType.includes(c.location_type)) return false;
    }
    // ПРИМЕЧАНИЕ: hidePrivate отсутствует в RouteCandidate (нет поля is_private в API).
    // Если ?hide_private=true передано на сервер, server отфильтрует. Client-side noop.
    // hideInactive — RouteCandidate не имеет is_active (server возвращает только active candidates).
    return true;
  });
}
