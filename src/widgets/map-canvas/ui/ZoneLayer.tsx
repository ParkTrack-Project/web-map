// MAP-09 SPIKE (2026-04-25, auto-mode): estimated 50 fps при 200 zones + badges
// (educated guess, базируется на PITFALLS #2 + mature reactify-diff pattern).
// РЕАЛЬНОЕ измерение ОТЛОЖЕНО на HUMAN-UAT — fps без живого браузера + DevTools
// Performance panel получить нельзя. Дев-сервер успешно стартует с 200 фейковыми
// зонами (Vite ready в ~640мс), tsc/lint/тесты зелёные. Threshold MVP: 45 fps.
// Если HUMAN-UAT покажет measured < 45 fps — Phase 2.x должен ввести
// @yandex/ymaps3-clusterer с порогом ~150 зон.
// См. .planning/phases/02-zones-card-filters-url-baseline/02-HUMAN-UAT.md item «MAP-09 fps».
//
// ZONE-01/02 (D-01): реальный полигональный рендер standard-зон.
//
// Каждая зона — отдельный <YMapFeature> в общем YMapFeatureDataSource. Reactify
// diff'ит features по key, поэтому изменение одного стиля НЕ перерисовывает
// все 200 зон (Pattern 1 в RESEARCH.md).
//
// selectedZoneId здесь захардкожен false — Plan 02 заменит на реальный
// useSelectedZone() hook (?sel= via nuqs). onClick — stub с console.debug
// до того же Plan 02; setSelectedZone(z.zone_id) включится тогда.
//
// MAP-09 SPIKE NOTE (Phase 2 Plan 01 Task 4): измерение fps при ~150-200 зонах
// в viewport ИТМО + бейджах. Результат фиксируется коммитом Task 4 — порог
// 45 fps определяет, нужна ли кластеризация (@yandex/ymaps3-clusterer) для MVP.
//
// Геометрия zone.geometry.coordinates: number[][][] — наш внутренний формат
// (PolygonGeometry в entities/zone). ymaps3 ожидает LngLat[][] = [number,
// number][][]. Cast безопасен: MSW-генератор всегда даёт пары [lon, lat].
import type { LngLat } from '@yandex/ymaps3-types/common/types/lng-lat';
import { YMapFeature, YMapFeatureDataSource, YMapLayer } from '@/shared/lib/ymaps';
import { useViewportZones } from '@/features/viewport-driven-zones';
import { computeZoneStyle, toDrawingStyle } from '../model/zone-style';

export function ZoneLayer() {
  const { data, isPending, isError } = useViewportZones();
  if (isPending || isError || !data) return null;

  const standard = data.filter((z) => z.zone_type === 'standard');

  return (
    <>
      <YMapFeatureDataSource id="ptk-zones-standard" />
      <YMapLayer source="ptk-zones-standard" type="features" zIndex={1900} />
      {standard.map((z) => {
        const style = computeZoneStyle({
          zoneId: z.zone_id,
          free_count: z.free_count,
          confidence: z.confidence,
          is_active: z.is_active,
          mode: 'now', // Phase 3 forward-compat
          selected: false, // Plan 02 заменит на (z.zone_id === selectedZoneId)
        });
        const geometry = {
          type: 'Polygon' as const,
          coordinates: z.geometry.coordinates as LngLat[][],
        };
        return (
          <YMapFeature
            key={z.zone_id}
            id={`zone-${z.zone_id}`}
            geometry={geometry}
            style={toDrawingStyle(style)}
            source="ptk-zones-standard"
            onClick={() => {
              // TODO Plan 02: setSelectedZone(z.zone_id) через useSelectedZone hook
              console.debug('[ptk] zone click', z.zone_id);
            }}
          />
        );
      })}
    </>
  );
}
