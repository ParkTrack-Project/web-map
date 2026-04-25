// MAP-09 NOTE: Phase 1 рендерит 200 зон без кластеризации. Порог кластеризации
// (~500 зон по educated guess) надо измерить spike'ом в Phase 2: визуально
// должно отрисовываться плавно при пане; если fps проседает — включаем
// ymaps3-clusterer и подбираем порог по результатам профайла.
//
// Phase 1 — debug-overlay: показывает количество зон в видимой области, чтобы
// доказать, что MSW + TanStack Query + viewport pipeline работают end-to-end.
// Phase 2 (ZONE-01..07) заменит overlay на реальный полигональный рендер
// через <YMapFeature> + computeZoneStyle.
import { useViewportZones } from '@/features/viewport-driven-zones';

export function ZoneLayer() {
  const { data, isPending, isError } = useViewportZones();
  if (isPending || isError) return null;
  return (
    <div
      data-testid="zone-count"
      className="absolute top-4 left-4 rounded bg-white/90 px-2 py-1 text-sm shadow"
    >
      Зон в видимой области: {data?.length ?? 0}
    </div>
  );
}
