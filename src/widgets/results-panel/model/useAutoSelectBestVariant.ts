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
