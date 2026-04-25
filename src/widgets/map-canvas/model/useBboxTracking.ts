// Виджет-сторона viewport-pipeline: onUpdate → 400мс debounce → round5 → nuqs URL.
// Pitfall #2: onUpdate стреляет на каждом кадре пана, без debounce и округления это
// каждый раз обновляло бы queryKey и порождало бы шторм /zones-запросов.
import { useQueryState } from 'nuqs';
import { useDebouncedCallback } from 'use-debounce';
import { VIEWPORT_DEBOUNCE_MS } from '@/shared/config';
import { parseAsBbox } from '@/shared/lib/url';
import { bboxFromBounds, roundBbox5, type Bbox, type MapBounds } from '@/shared/lib/geo';

export function useBboxTracking() {
  const [bbox, setBbox] = useQueryState<Bbox>('bbox', parseAsBbox);

  // Debounced writer — вызывается из YMapListener.onUpdate.
  const writeBbox = useDebouncedCallback((bounds: MapBounds) => {
    const next = roundBbox5(bboxFromBounds(bounds));
    // Skip write если round5 не изменился — иначе nuqs обновит URL впустую,
    // пересоздаст queryKey и спровоцирует лишний /zones-запрос.
    if (bbox && next.every((v, i) => v === bbox[i])) return;
    setBbox(next);
  }, VIEWPORT_DEBOUNCE_MS);

  return { bbox, writeBbox };
}
