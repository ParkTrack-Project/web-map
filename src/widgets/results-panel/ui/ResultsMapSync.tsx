import { useEffect } from 'react';
import { useFromCoords } from '@/features/request-geolocation';
import { useFilteredCandidates } from '@/features/filter-zones';
import { useResultSelection } from '@/features/select-zone';
import { useRoutingResults } from '../model/useRoutingResults';

/** Keeps map emphasis in sync with the exact candidate list shown to the user. */
export function ResultsMapSync() {
  const { from } = useFromCoords();
  const { data } = useRoutingResults();
  const candidates = useFilteredCandidates(data?.candidates);
  const setResultCandidates = useResultSelection((state) => state.setResultCandidates);

  useEffect(() => {
    setResultCandidates(from ? candidates : []);
  }, [candidates, from, setResultCandidates]);

  return null;
}
