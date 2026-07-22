import { useEffect, useMemo } from 'react';
import { useFromCoords } from '@/features/request-geolocation';
import { useFilteredCandidates } from '@/features/filter-zones';
import { useResultSelection } from '@/features/select-zone';
import { useRoutingResults } from '../model/useRoutingResults';

/** Keeps map emphasis in sync with the exact candidate list shown to the user. */
export function ResultsMapSync() {
  const { from } = useFromCoords();
  const { data } = useRoutingResults();
  const candidates = useFilteredCandidates(data?.candidates);
  const setResultZoneIds = useResultSelection((state) => state.setResultZoneIds);
  const zoneIds = useMemo(() => candidates.map((candidate) => candidate.zone_id), [candidates]);

  useEffect(() => {
    setResultZoneIds(from ? zoneIds : []);
  }, [from, setResultZoneIds, zoneIds]);

  return null;
}
