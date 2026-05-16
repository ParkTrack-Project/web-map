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

// Fix 2026-05-16: MapPage монтирует ДВА MapCanvas (Desktop + Mobile, CSS-gated
// `hidden lg:flex` / `flex lg:hidden`). Скрытый (display:none) имеет 0-размер,
// и его YMapListener.onUpdate отдаёт ВЫРОЖДЕННЫЙ bbox (~точка в центре, span
// ~2e-5°). Оба инстанса писали в один ?bbox → URL осциллировал tiny↔real,
// зоны мигали. Любой реальный viewport (даже на max zoom 19) шире ~3e-3°,
// поэтому порог 1e-4° надёжно отсекает только вырожденный bbox.
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

  // setBbox экспонируется для seed-на-mount (Quick-fix п.0): когда ?bbox нет,
  // MapCanvas синхронно засевает bbox из initial center+zoom, чтобы
  // useZonesQuery стартовал сразу, без ожидания первого onUpdate/пана.
  return { bbox, zoom, writeViewport, setBbox };
}
