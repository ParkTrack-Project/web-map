// Feature-слой читает bbox из URL (источник истины) и запрашивает /zones через
// useZonesQuery. ВАЖНО (FSD): features НЕ импортируют из widgets — поэтому здесь
// дублируется чтение из useQueryState вместо переиспользования useBboxTracking.
// useBboxTracking остаётся write-side хуком виджета.
//
// Phase 2 Plan 03: хук остаётся для backward-compat (передаёт пустой serverQuery).
// Реальный data-pipeline теперь через useFilteredZones (этот же файл рядом).
//
// Phase 3 Plan 04: mode читается из useTimeMode() (как в useFilteredZones).
import { useQueryState } from 'nuqs';
import { parseAsBbox } from '@/shared/lib/url';
import { useZonesQuery } from '@/entities/zone';
import { useTimeMode } from '@/features/select-time-mode';
import type { Bbox } from '@/shared/lib/geo';

export function useViewportZones() {
  const [bbox] = useQueryState<Bbox>('bbox', parseAsBbox);
  const { mode } = useTimeMode();
  return { bbox, ...useZonesQuery(bbox, {}, mode) };
}
