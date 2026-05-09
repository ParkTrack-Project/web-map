// Phase 4 / D-21 / WTP-06 / research Open Question Q3:
// Recommendation: при ПЕРВОМ получении non-null selected_zone_id и ?sel === null —
// setSelectedZone(selected_zone_id). Если user уже сделал manual selection (?sel set),
// НЕ переписываем (research argument: «sticky URL after user click»).
//
// useRef-guard: hasSyncedRef защищает от повторных синков при cache-hit refetch'ах.
import { useEffect, useRef } from 'react';
import { useSelectedZone } from '@/features/select-zone';

export function useAutoSelectBestVariant(selectedZoneIdFromServer: number | null) {
  const { selectedZoneId, setSelectedZone } = useSelectedZone();
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (selectedZoneIdFromServer == null) return; // нет server recommendation
    if (hasSyncedRef.current) return; // уже синхронизировали один раз
    if (selectedZoneId !== null) {
      // ?sel уже задан — НЕ переписываем (Q3 recommendation), но фиксируем что мы видели рекомендацию
      hasSyncedRef.current = true;
      return;
    }
    setSelectedZone(selectedZoneIdFromServer);
    hasSyncedRef.current = true;
  }, [selectedZoneIdFromServer, selectedZoneId, setSelectedZone]);
}
