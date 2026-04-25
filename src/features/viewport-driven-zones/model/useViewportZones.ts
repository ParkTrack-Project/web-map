// Feature-слой читает bbox из URL (источник истины) и запрашивает /zones через
// useZonesQuery. ВАЖНО (FSD): features НЕ импортируют из widgets — поэтому здесь
// дублируется чтение из useQueryState вместо переиспользования useBboxTracking.
// useBboxTracking остаётся write-side хуком виджета.
//
// Mode жёстко 'now' в Phase 1; Phase 3 заменит на адаптер, читающий ?time=... из URL.
//
// Phase 2 Plan 03: хук остаётся для backward-compat (передаёт пустой serverQuery).
// Реальный data-pipeline теперь через useFilteredZones (этот же файл рядом).
import { useQueryState } from 'nuqs';
import { parseAsBbox } from '@/shared/lib/url';
import { useZonesQuery } from '@/entities/zone';
import type { Bbox } from '@/shared/lib/geo';

export function useViewportZones() {
  const [bbox] = useQueryState<Bbox>('bbox', parseAsBbox);
  return { bbox, ...useZonesQuery(bbox, {}, { kind: 'now' }) };
}
