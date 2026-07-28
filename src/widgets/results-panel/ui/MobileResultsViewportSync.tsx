import { useContext, useEffect, useRef } from 'react';
import { useFilteredCandidates } from '@/features/filter-zones';
import { useIsMobile } from '@/shared/lib/responsive';
import { MapRefContext } from '@/widgets/map-canvas';
import { useRoutingResults } from '../model/useRoutingResults';
import { resultOverviewLocation } from '../model/result-overview';
import { RESULTS_SNAP_LOW } from '../model/results-snap';
import {
  RESULTS_SHEET_RESIZE_EVENT,
  type ResultsSheetResizeDetail,
} from '../model/results-sheet-resize';

const MAP_RESIZE_THROTTLE_MS = 48;
const MAP_RESIZE_DURATION_MS = 80;

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
  const lastResultsKey = useRef<string | null>(null);
  const fitCurrentViewport = useRef<(duringResize?: boolean) => void>(() => undefined);
  const numericSnap = typeof snapPoint === 'number' ? snapPoint : RESULTS_SNAP_LOW;

  fitCurrentViewport.current = (duringResize = false) => {
    const map = mapRef?.current;
    if (!map || !isMobile) return;
    if (!open) {
      lastFitKey.current = null;
      lastResultsKey.current = null;
      return;
    }
    if (candidates.length === 0) {
      lastFitKey.current = null;
      return;
    }

    const resultsKey = `${JSON.stringify(body)}|${candidates.map(({ zone_id }) => zone_id).join(',')}`;
    const sheetHeight =
      document
        .querySelector<HTMLElement>('[data-testid="mobile-results-sheet"]')
        ?.getBoundingClientRect().height ?? window.innerHeight * numericSnap;
    const viewport = {
      width: document.documentElement.clientWidth || window.innerWidth,
      height: document.documentElement.clientHeight || window.innerHeight,
    };
    const fitKey = `${resultsKey}|${Math.round(sheetHeight)}|${viewport.width}x${viewport.height}`;
    if (lastFitKey.current === fitKey) return;
    const margin: [number, number, number, number] = [72, 24, Math.ceil(sheetHeight) + 24, 24];
    const points = candidates.flatMap(({ geometry }) =>
      geometry.coordinates.flatMap((ring) =>
        ring
          .filter(
            (point) => point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]),
          )
          .map((point) => [point[0]!, point[1]!] as [number, number]),
      ),
    );
    const zoomRange = (map as { zoomRange?: { min?: number; max?: number } }).zoomRange;
    const location = resultOverviewLocation(
      points,
      map.projection,
      viewport,
      margin,
      zoomRange?.min ?? 0,
      zoomRange?.max ?? 21,
    );
    if (!location) return;

    map.setLocation({
      ...location,
      duration: duringResize
        ? MAP_RESIZE_DURATION_MS
        : lastResultsKey.current === resultsKey
          ? 0
          : 400,
    });
    lastFitKey.current = fitKey;
    lastResultsKey.current = resultsKey;
  };

  useEffect(() => {
    fitCurrentViewport.current();
  }, [body, candidates, isMobile, mapRef, numericSnap, open]);

  useEffect(() => {
    if (!open || !isMobile) return;
    let timeoutId: number | null = null;

    const fit = () => {
      timeoutId = null;
      fitCurrentViewport.current(true);
    };
    const handleResize = (event: Event) => {
      const { final } = (event as CustomEvent<ResultsSheetResizeDetail>).detail;
      if (final) {
        if (timeoutId !== null) window.clearTimeout(timeoutId);
        fit();
        return;
      }
      if (timeoutId === null) {
        timeoutId = window.setTimeout(fit, MAP_RESIZE_THROTTLE_MS);
      }
    };

    window.addEventListener(RESULTS_SHEET_RESIZE_EVENT, handleResize);
    return () => {
      window.removeEventListener(RESULTS_SHEET_RESIZE_EVENT, handleResize);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, [isMobile, open]);

  return null;
}
