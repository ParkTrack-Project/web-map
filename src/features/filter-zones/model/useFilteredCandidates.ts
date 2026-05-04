// Phase 4 / D-26 / RANK-07:
// Memo'd selector. Перерендерится только при изменении candidates или filters.
// Используется внутри ResultsList после useRoutingSearch.
import { useMemo } from 'react';
import type { RouteCandidate } from '@/entities/zone';
import { useFilters } from './useFilters';
import { applyClientCandidateFilters } from '../lib/applyClientCandidateFilters';

export function useFilteredCandidates(candidates: RouteCandidate[] | undefined): RouteCandidate[] {
  const { filters } = useFilters();
  return useMemo(() => {
    if (!candidates) return [];
    return applyClientCandidateFilters(candidates, filters);
  }, [candidates, filters]);
}
