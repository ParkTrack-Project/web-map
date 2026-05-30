// 2026-05-30: единый «зум к парковке при выборе». Раньше приближение жило
// только в ResultItem (клик в списке результатов); клик по полигону/линии на
// карте лишь выделял зону (?sel=), но карту не двигал — на desktop вообще, на
// mobile только сдвигал центр через карточку.
//
// Один порог SELECTED_ZONE_ZOOM: клик приближает карту ДО него. Приближаем
// только «внутрь» — max(SELECTED_ZONE_ZOOM, текущий зум): если карта уже ближе
// порога, зум не трогаем (только центрируем на парковке), отдаления нет.
//
// mapRef берётся из MapRefContext (Provider в Desktop/MobileLayout, оборачивает
// и MapCanvas, и панель результатов) — тот же паттерн, что у ZoneClusterLayer.
import { useCallback, useContext } from 'react';
import { zoneCentroid } from '@/shared/lib/geo';
import { SELECTED_ZONE_ZOOM } from '@/shared/config';
import { MapRefContext } from './map-ref-context';

type ZoneGeometry = Parameters<typeof zoneCentroid>[0];

export function useZoomToZone() {
  const mapRef = useContext(MapRefContext);
  // mapRef — стабильный ref-объект, поэтому callback не пересоздаётся (важно
  // для memo'нутых слоёв ZoneLayer/ParallelZoneLayer).
  return useCallback(
    (geometry: ZoneGeometry | null | undefined) => {
      const map = mapRef?.current;
      // Карта ещё не смонтирована или геометрия пустая — тихо пропускаем.
      if (!map || !geometry?.coordinates?.[0]?.length) return;

      // Текущий зум карты (ymaps3 YMap.zoom — рантайм-геттер). Узкий каст, чтобы
      // не зависеть от наличия поля в .d.ts; при сбое падаем на 0 → возьмётся порог.
      const currentZoom = (map as { zoom?: number }).zoom ?? 0;
      // Только «внутрь»: до порога, но если карта уже ближе — оставляем как есть.
      const targetZoom = Math.max(SELECTED_ZONE_ZOOM, currentZoom);

      try {
        map.setLocation({
          center: zoneCentroid(geometry),
          zoom: targetZoom,
          duration: 300, // ms — единый easing с остальными pan'ами
        });
      } catch (e) {
        console.warn('[ptk] zoom-to-zone failed:', e);
      }
    },
    [mapRef],
  );
}
