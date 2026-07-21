// 2026-05-30: единый «зум к парковке при выборе». Раньше приближение жило
// только в ResultItem (клик в списке результатов); клик по полигону/линии на
// карте лишь выделял зону (?sel=), но карту не двигал — на desktop вообще, на
// mobile только сдвигал центр через карточку.
//
// Порог SELECTED_ZONE_ZOOM: клик приближает карту ДО него. Приближаем только
// «внутрь» — max(SELECTED_ZONE_ZOOM, текущий зум): если карта уже ближе порога,
// зум не трогаем (только центрируем на парковке), отдаления нет.
//
// 2026-06-06: + «зум разъединения». При выборе конкретной зоны (передан zoneId)
// дотягиваем зум до уровня, где парковка выходит из кружка-группы и сразу видна
// своим полигоном+бейджем — иначе на обзорных зумах выбранная парковка прячется
// под агрегированным кружком кластера (см. minZoomToDecluster в cluster-zones).
//
// mapRef берётся из MapRefContext (Provider в Desktop/MobileLayout, оборачивает
// и MapCanvas, и панель результатов) — тот же паттерн, что у ZoneClusterLayer.
import { useCallback, useContext, useRef } from 'react';
import { zoneCentroid } from '@/shared/lib/geo';
import { SELECTED_ZONE_ZOOM, CLUSTER_MERGE_PX, CLUSTER_ZOOM_STEP } from '@/shared/config';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import { MapRefContext } from './map-ref-context';
import { minZoomToDecluster } from './cluster-zones';

type ZoneGeometry = Parameters<typeof zoneCentroid>[0];

export function useZoomToZone() {
  const mapRef = useContext(MapRefContext);
  // Список зон нужен для «зума разъединения» (см. ниже). Держим его в ref,
  // обновляемом каждый рендер: сам callback остаётся стабильным (зависит только
  // от mapRef) — важно для memo'нутых слоёв ZoneLayer/ParallelZoneLayer, которые
  // иначе пересоздавали бы onClick на каждом обновлении viewport-зон.
  const { data } = useFilteredZones();
  const zonesRef = useRef(data);
  zonesRef.current = data;

  return useCallback(
    (geometry: ZoneGeometry | null | undefined, opts?: { max?: boolean; zoneId?: number }) => {
      const map = mapRef?.current;
      // Карта ещё не смонтирована или геометрия пустая — тихо пропускаем.
      if (!map || !geometry?.coordinates?.[0]?.length) return;

      const center = zoneCentroid(geometry);

      // Текущий зум карты (ymaps3 YMap.zoom — рантайм-геттер). Узкий каст, чтобы
      // не зависеть от наличия поля в .d.ts; при сбое падаем на 0 → возьмётся порог.
      const currentZoom = (map as { zoom?: number }).zoom ?? 0;
      const maxZoom = (map as { zoomRange?: { max?: number } }).zoomRange?.max ?? 21;

      // «Зум разъединения»: если выбранная парковка на текущем масштабе слита в
      // кружок-группу, приближаем минимум до уровня, где её центроид отходит от
      // соседей дальше CLUSTER_MERGE_PX — тогда зона выходит из кластера и видна
      // своим полигоном+бейджем, а не прячется под кружком. + шаг квантования
      // зума: запас на округление clusterZoom (см. MapCanvas) и на строгое
      // неравенство слияния (dist == mergePx ещё сливает). Только при выборе
      // конкретной зоны (есть zoneId) и не в режиме opts.max (там и так максимум).
      let declusterZoom = 0;
      const zones = zonesRef.current;
      if (!opts?.max && opts?.zoneId != null && zones) {
        const req = minZoomToDecluster(center, zones, CLUSTER_MERGE_PX, opts.zoneId);
        if (req != null) declusterZoom = req + CLUSTER_ZOOM_STEP;
      }

      // opts.max → приближаем на МАКСИМУМ карты (клик по карточке парковки).
      // Иначе — «внутрь» до наибольшего из: порога SELECTED_ZONE_ZOOM, текущего
      // зума (без отдаления) и зума разъединения. Клампим по пределу карты.
      const targetZoom = opts?.max
        ? maxZoom
        : Math.min(maxZoom, Math.max(SELECTED_ZONE_ZOOM, currentZoom, declusterZoom));

      try {
        map.setLocation({
          center,
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
