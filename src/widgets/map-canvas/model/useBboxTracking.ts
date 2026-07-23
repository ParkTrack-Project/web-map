import { useQueryState } from 'nuqs';
import { useDebouncedCallback } from 'use-debounce';
import { DEFAULT_ZOOM, VIEWPORT_DEBOUNCE_MS } from '@/shared/config';
import { parseAsBbox, parseAsZoom } from '@/shared/lib/url';
import { bboxFromBounds, roundBbox5, type Bbox, type MapBounds } from '@/shared/lib/geo';

const MIN_VIEWPORT_SPAN_DEG = 1e-4;

export function useBboxTracking() {
  const [bbox, setBbox] = useQueryState<Bbox>('bbox', parseAsBbox);
  const [zoom, setZoom] = useQueryState<number>('z', parseAsZoom.withDefault(DEFAULT_ZOOM));

  // Debounced writer — вызывается из YMapListener.onUpdate с актуальными bounds + zoom.
  const writeViewport = useDebouncedCallback((bounds: MapBounds, currentZoom: number) => {
    const next = roundBbox5(bboxFromBounds(bounds));
    // Игнорируем вырожденный bbox от скрытого (0-размер) MapCanvas — иначе
    // два инстанса пинг-понгуют ?bbox и зоны мигают (см. шапку файла).
    if (next[2] - next[0] < MIN_VIEWPORT_SPAN_DEG || next[3] - next[1] < MIN_VIEWPORT_SPAN_DEG) {
      return;
    }
    // Skip write если round5 не изменился — иначе nuqs обновит URL впустую,
    // пересоздаст queryKey и спровоцирует лишний /zones-запрос.
    const bboxChanged = !bbox || !next.every((v, i) => v === bbox[i]);
    if (bboxChanged) setBbox(next);

    const roundedZoom = Math.round(currentZoom);
    if (roundedZoom !== zoom) setZoom(roundedZoom);
  }, VIEWPORT_DEBOUNCE_MS);

  return { bbox, zoom, writeViewport, setBbox };
}
