import { useContext, useEffect, useRef } from 'react';
import { useFilteredCandidates } from '@/features/filter-zones';
import { zoneCentroid } from '@/shared/lib/geo';
import { useIsMobile } from '@/shared/lib/responsive';
import { MapRefContext } from '@/widgets/map-canvas';
import { useRoutingResults } from '../model/useRoutingResults';
import { resultOverviewLocation } from '../model/result-overview';
import { RESULTS_SNAP_LOW } from '../model/results-snap';

interface Props {
  open: boolean;
  snapPoint: number | string | null;
}

export function MobileResultsViewportSync({ open, snapPoint }: Props) {
  const mapRef = useContext(MapRefContext);
  const isMobile = useIsMobile();
  const { data, body } = useRoutingResults();
  const candidates = useFilteredCandidates(data?.candidates);
  const lastFitKey = useRef<string | null>(null);
  const numericSnap = typeof snapPoint === 'number' ? snapPoint : RESULTS_SNAP_LOW;

  useEffect(() => {
    const map = mapRef?.current;
    if (!map || !isMobile) return;
    if (!open) {
      lastFitKey.current = null;
      return;
    }
    // The expanded list intentionally owns almost the entire viewport. Fit
    // results when the compact map-preview position becomes visible.
    if (numericSnap !== RESULTS_SNAP_LOW || candidates.length === 0) {
      lastFitKey.current = null;
      return;
    }

    const fitKey = `${JSON.stringify(body)}|${candidates.map(({ zone_id }) => zone_id).join(',')}`;
    if (lastFitKey.current === fitKey) return;
    const margin: [number, number, number, number] = [
      64,
      20,
      Math.ceil(window.innerHeight * RESULTS_SNAP_LOW) + 20,
      20,
    ];
    const location = resultOverviewLocation(
      candidates.map(({ geometry }) => zoneCentroid(geometry)),
      map.projection,
      { width: window.innerWidth, height: window.innerHeight },
      margin,
    );
    if (!location) return;

    map.setLocation({ ...location, duration: 400 });
    lastFitKey.current = fitKey;
  }, [body, candidates, isMobile, mapRef, numericSnap, open]);

  return null;
}
