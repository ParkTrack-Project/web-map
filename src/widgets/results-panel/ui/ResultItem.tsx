// Phase 4 / RANK-04 / D-20:
// List-item layout. data-testid="result-item-${zone_id}" для E2E + scroll-sync.
// Лучший вариант badge — brand-green с иконкой Star (D-21).
import { useContext } from 'react';
import { Star, MapPin, Target } from 'lucide-react';
import type { RouteCandidate } from '@/entities/zone';
import { useSelectedZone } from '@/features/select-zone';
import { MapRefContext } from '@/widgets/map-canvas';
import { zoneCentroid } from '@/shared/lib/geo';
import { pluralizeRu } from '@/shared/lib/i18n';

interface ResultItemProps {
  candidate: RouteCandidate;
  onClick?: (c: RouteCandidate) => void;
}

export function ResultItem({ candidate: c, onClick }: ResultItemProps) {
  const { selectedZoneId, setSelectedZone } = useSelectedZone();
  const mapRef = useContext(MapRefContext);
  const isSelected = selectedZoneId === c.zone_id;
  const isBest = c.rank === 1;
  const distanceMin = Math.max(1, Math.round(c.duration_from_origin_seconds / 60));
  const minutePlural = pluralizeRu(distanceMin, { one: 'мин', few: 'мин', many: 'мин' });
  const freePlural = pluralizeRu(c.predicted_free_count ?? 0, {
    one: 'свободное место',
    few: 'свободных места',
    many: 'свободных мест',
  });
  const arrivalLabel = c.predicted_for_arrival
    ? new Intl.DateTimeFormat('ru-RU', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Moscow',
      }).format(new Date(c.predicted_for_arrival))
    : null;

  const handleClick = () => {
    onClick?.(c);
    setSelectedZone(c.zone_id);
    if (mapRef?.current) {
      // W-4 fix: minimal-shape принимается напрямую (centroid.ts: { type:'Polygon'; coordinates }).
      const center = zoneCentroid(c.geometry);
      try {
        mapRef.current.setLocation({ center, duration: 300 });
      } catch (e) {
        console.warn('[results] pan failed', e);
      }
    }
  };

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      data-testid={`result-item-${c.zone_id}`}
      onClick={handleClick}
      className={
        'flex w-full flex-col gap-1 rounded-md border-2 px-3 py-2 text-left text-sm hover:bg-emerald-50 ' +
        (isSelected ? 'border-emerald-500 bg-emerald-50' : 'border-zinc-100 bg-white')
      }
      style={{ height: 140 }}
    >
      {isBest && (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
          <Star size={12} aria-hidden /> Лучший вариант
        </span>
      )}
      <div className="font-medium">
        Зона #{c.zone_id}
        <span className="ml-2 text-zinc-500">•</span>
        <span className="ml-2">
          Свободно: {c.current_free_count}/{c.capacity}
        </span>
        <span className="ml-2 text-zinc-500">•</span>
        <span className="ml-2">
          {c.pay === 0 ? (
            <span className="font-semibold text-emerald-700">Бесплатно</span>
          ) : (
            <>{c.pay} ₽/час</>
          )}
        </span>
      </div>
      {c.predicted_free_count !== null && arrivalLabel && (
        <div className="text-xs text-zinc-600">
          Прогноз: {c.predicted_free_count} {freePlural} к {arrivalLabel}
        </div>
      )}
      <div className="flex items-center gap-1 text-xs text-zinc-600">
        <MapPin size={12} aria-hidden />
        {c.distance_from_origin_meters} м ({distanceMin} {minutePlural} пешком)
      </div>
      {c.distance_to_destination_meters !== null && (
        <div className="flex items-center gap-1 text-xs text-zinc-600">
          <Target size={12} aria-hidden />
          {c.distance_to_destination_meters} м до точки назначения
        </div>
      )}
      <div className="text-xs text-zinc-500">
        Уверенность: {Math.round(c.current_confidence * 100)}%
      </div>
    </button>
  );
}
