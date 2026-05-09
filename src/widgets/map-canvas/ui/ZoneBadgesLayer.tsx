// ZONE-06 / D-02: redundant encoding — pill с free_count поверх каждой зоны.
//
// Скрывается при zoom < ZONE_BADGE_MIN_ZOOM (=14), чтобы карта не превратилась
// в шум. Цвет бейджа: непрозрачный белый bg + чёрный текст → контраст ≥ 7:1
// на ЛЮБОМ полигональном fill (включая жёлтый и светло-зелёный — D-20).
//
// pointer-events-none: бейдж не перехватывает клики — клик проходит сквозь
// бейдж в polygon под ним → срабатывает onClick из ZoneLayer (Plan 02 wiring).
import { YMapMarker } from '@/shared/lib/ymaps';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import { zoneCentroid } from '@/shared/lib/geo';
import { ZONE_BADGE_MIN_ZOOM } from '@/shared/config';

interface Props {
  zoom: number;
}

export function ZoneBadgesLayer({ zoom }: Props) {
  // Phase 2 Plan 03: переключено на useFilteredZones — бейджи показываются
  // только для зон, прошедших фильтры.
  const { data, isPending, isError } = useFilteredZones();
  if (zoom < ZONE_BADGE_MIN_ZOOM) return null;
  if (isPending || isError || !data) return null;

  return (
    <>
      {data.map((z) => {
        const c = zoneCentroid(z.geometry);
        return (
          <YMapMarker key={`badge-${z.zone_id}`} coordinates={c} zIndex={2000}>
            <span
              data-testid="zone-badge"
              className="pointer-events-none rounded-full bg-white/95 px-1.5 py-0.5 text-xs font-semibold text-zinc-900 shadow"
            >
              {z.free_count}
            </span>
          </YMapMarker>
        );
      })}
    </>
  );
}
