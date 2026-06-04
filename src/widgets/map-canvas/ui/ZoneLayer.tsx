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
// ZONE-07 / D-08 (Plan 02-02 wiring): клик по зоне записывает её id в URL ?sel=
// через useSelectedZone (nuqs pushState). Выбранная зона получает strokeWidth=3
// через computeZoneStyle({selected: z.zone_id === selectedZoneId}).
//
// Каждая зона — отдельный <YMapFeature> в общем YMapFeatureDataSource. Reactify
// diff'ит features по key, поэтому изменение одного стиля НЕ перерисовывает
// все 200 зон (Pattern 1 в RESEARCH.md).
//
// Геометрия zone.geometry.coordinates: number[][][] — наш внутренний формат
// (PolygonGeometry в entities/zone). ymaps3 ожидает LngLat[][] = [number,
// number][][]. Cast безопасен: MSW-генератор всегда даёт пары [lon, lat].
import { memo, type ComponentType } from 'react';
import type { LngLat } from '@yandex/ymaps3-types/common/types/lng-lat';
import {
  YMapFeature as YMapFeatureRaw,
  YMapFeatureDataSource as YMapFeatureDataSourceRaw,
  YMapLayer as YMapLayerRaw,
} from '@/shared/lib/ymaps';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import { useSelectedZone } from '@/features/select-zone';
import { computeZoneStyle, toDrawingStyle } from '../model/zone-style';
import { useZoomToZone } from '../model/useZoomToZone';

type PolygonGeometry = {
  type: 'Polygon';
  coordinates: LngLat[][];
};

type YMapFeatureProps = {
  id: string;
  geometry: PolygonGeometry;
  style: ReturnType<typeof toDrawingStyle>;
  source: string;
  onClick?: () => void;
};

type YMapFeatureDataSourceProps = {
  id: string;
};

type YMapLayerProps = {
  source: string;
  type: string;
  zIndex?: number;
};

// reactify-обёртки из shared/lib/ymaps после динамической загрузки могут терять
// JSX-тип. Поэтому локально приводим их к ComponentType.
const YMapFeature = YMapFeatureRaw as unknown as ComponentType<YMapFeatureProps>;

const YMapFeatureDataSource =
  YMapFeatureDataSourceRaw as unknown as ComponentType<YMapFeatureDataSourceProps>;

const YMapLayer = YMapLayerRaw as unknown as ComponentType<YMapLayerProps>;

// Phase 5 D-31 (NFR-03): React.memo для тяжёлых widgets — рендерит 200+ features.
// Props нет; memo() предотвращает rerender при изменении parent state, не
// относящегося к зонам.
function ZoneLayerInner() {
  // Phase 2 Plan 03: переключено с useViewportZones на useFilteredZones —
  // тот же data shape, но с server-side + client-side фильтрами применёнными.
  // useSelectedZone wiring (Plan 02) сохранён ниже без изменений.
  const { data } = useFilteredZones();
  const { selectedZoneId, setSelectedZone } = useSelectedZone();
  const zoomToZone = useZoomToZone();

  // Quick-fix 2026-05-16 (п.1): рендерим, пока есть данные (keepPreviousData),
  // не гасим зоны на транзиентной ошибке/pending — иначе они «пропадают до F5».
  if (!data) return null;

  // 2026-05-30: полигоны рисуем для ВСЕХ standard-зон, даже когда они схлопнуты
  // в кластер — кружок ZoneClusterLayer ложится поверх, но сами парковки видны.
  // (Раньше фильтровали по singletonIds → под кружком полигон исчезал.)
  const standard = data.filter(
    (z) => z.zone_type === 'standard' && z.geometry?.coordinates?.length,
  );

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
          selected: z.zone_id === selectedZoneId, // D-08 highlight
        });

        const geometry: PolygonGeometry = {
          type: 'Polygon',
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
              setSelectedZone(z.zone_id);
              zoomToZone(z.geometry); // клик по карте → приближаем к зоне
            }}
          />
        );
      })}
    </>
  );
}

export const ZoneLayer = memo(ZoneLayerInner);