// Виджет-сторона viewport-pipeline: onUpdate → 400мс debounce → round5 → nuqs URL.
// Pitfall #2: onUpdate стреляет на каждом кадре пана, без debounce и округления это
// каждый раз обновляло бы queryKey и порождало бы шторм /zones-запросов.
//
// Phase 2 Plan 03 (URL-01): кроме bbox также пишем zoom (?z=N) — debounced
// одновременно через тот же writeViewport callback. history: 'replace' (по
// умолчанию для useQueryState) — пан и zoom не должны раздувать history-stack.
import { useQueryState } from 'nuqs';
import { useDebouncedCallback } from 'use-debounce';
import { DEFAULT_ZOOM, VIEWPORT_DEBOUNCE_MS } from '@/shared/config';
import { parseAsBbox, parseAsZoom } from '@/shared/lib/url';
import { bboxFromBounds, roundBbox5, type Bbox, type MapBounds } from '@/shared/lib/geo';

export function useBboxTracking() {
  const [bbox, setBbox] = useQueryState<Bbox>('bbox', parseAsBbox);
  const [zoom, setZoom] = useQueryState<number>('z', parseAsZoom.withDefault(DEFAULT_ZOOM));

  // Debounced writer — вызывается из YMapListener.onUpdate с актуальными bounds + zoom.
  const writeViewport = useDebouncedCallback((bounds: MapBounds, currentZoom: number) => {
    const next = roundBbox5(bboxFromBounds(bounds));
    // Skip write если round5 не изменился — иначе nuqs обновит URL впустую,
    // пересоздаст queryKey и спровоцирует лишний /zones-запрос.
    const bboxChanged = !bbox || !next.every((v, i) => v === bbox[i]);
    if (bboxChanged) setBbox(next);

    const roundedZoom = Math.round(currentZoom);
    if (roundedZoom !== zoom) setZoom(roundedZoom);
  }, VIEWPORT_DEBOUNCE_MS);

  return { bbox, zoom, writeViewport };
}
