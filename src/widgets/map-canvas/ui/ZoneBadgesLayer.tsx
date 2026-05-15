// ZONE-06 / D-02: redundant encoding — pill с free_count поверх каждой зоны.
//
// Скрывается при zoom < ZONE_BADGE_MIN_ZOOM (=14), чтобы карта не превратилась
// в шум.
//
// Quick-fix 2026-05-16 (п.3): белый бейдж сливался с подложкой карты. Теперь
// фон бейджа = семантический цвет зоны (solid stroke-цвет из палитры D-01:
// серый/красный/янтарный/зелёный), текст белый → бейдж читается на карте и
// сразу кодирует занятость, как и сам полигон.
//
// pointer-events-none: бейдж не перехватывает клики — клик проходит сквозь
// бейдж в polygon под ним → срабатывает onClick из ZoneLayer (Plan 02 wiring).
import { YMapMarker } from '@/shared/lib/ymaps';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import { zoneCentroid } from '@/shared/lib/geo';
import { ZONE_BADGE_MIN_ZOOM } from '@/shared/config';
import { computeZoneStyle } from '../model/zone-style';

interface Props {
  zoom: number;
}

export function ZoneBadgesLayer({ zoom }: Props) {
  // Phase 2 Plan 03: бейджи показываются только для зон, прошедших фильтры.
  const { data } = useFilteredZones();
  if (zoom < ZONE_BADGE_MIN_ZOOM) return null;
  // Quick-fix 2026-05-16 (п.1): НЕ гасим бейджи на транзиентной ошибке/refetch.
  // keepPreviousData держит последние валидные данные — рендерим их, пока есть,
  // чтобы зоны не «пропадали до перезагрузки».
  if (!data) return null;

  return (
    <>
      {data.map((z) => {
        const c = zoneCentroid(z.geometry);
        // Семантический цвет = тот же, что у полигона зоны (палитра D-01).
        // Берём solid stroke-цвет (без альфы) — контрастен с белым текстом.
        const { stroke } = computeZoneStyle({
          zoneId: z.zone_id,
          free_count: z.free_count,
          confidence: z.confidence,
          is_active: z.is_active,
          mode: 'now',
          selected: false,
        });
        return (
          <YMapMarker key={`badge-${z.zone_id}`} coordinates={c} zIndex={2000}>
            <span
              data-testid="zone-badge"
              className="pointer-events-none rounded-full px-1.5 py-0.5 text-xs font-semibold text-white shadow"
              style={{ backgroundColor: stroke }}
            >
              {z.free_count}
            </span>
          </YMapMarker>
        );
      })}
    </>
  );
}
