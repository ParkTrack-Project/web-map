// Phase 4 / RANK-04 / D-20:
// List-item layout. data-testid="result-item-${zone_id}" для E2E + scroll-sync.
// Лучший вариант badge — brand-green с иконкой Star (D-21).
import { Star, MapPin, Target } from 'lucide-react';
import type { RouteCandidate } from '@/entities/zone';
import { useSelectedZone } from '@/features/select-zone';
import { useZoomToZone } from '@/widgets/map-canvas';
import { formatDurationFromSeconds, useI18n } from '@/shared/lib/i18n';

interface ResultItemProps {
  candidate: RouteCandidate;
  onClick?: (c: RouteCandidate) => void;
}

export function ResultItem({ candidate: c, onClick }: ResultItemProps) {
  const { t, language } = useI18n();
  const { selectedZoneId, setSelectedZone } = useSelectedZone();
  const zoomToZone = useZoomToZone();
  const isSelected = selectedZoneId === c.zone_id;
  const isBest = c.rank === 1;
  // 2026-05-26: единый форматтер длительности — «4 мин», «1 ч 30 мин»,
  // «2 д 18 ч». Раньше всегда печаталось в минутах → дальние маршруты
  // показывали «4000 мин» вместо «2 д 18 ч».
  const durationLabel = formatDurationFromSeconds(c.duration_from_origin_seconds, language);
  const arrivalLabel = c.predicted_for_arrival
    ? new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Moscow',
      }).format(new Date(c.predicted_for_arrival))
    : null;
  const predictedCount = c.predicted_free_count ?? 0;
  const predictedCategory = new Intl.PluralRules('ru').select(predictedCount);
  const forecastCount =
    language === 'ru'
      ? `${predictedCount} ${predictedCategory === 'one' ? 'свободное место' : predictedCategory === 'few' ? 'свободных места' : 'свободных мест'}`
      : `${predictedCount} ${predictedCount === 1 ? 'available space' : 'available spaces'}`;

  const handleClick = () => {
    onClick?.(c);
    setSelectedZone(c.zone_id);
    // zoneId → useZoomToZone дотягивает зум до уровня, где парковка выходит из
    // кружка-группы и сразу видна (тот же расчёт, что и при клике по зоне на карте).
    zoomToZone(c.geometry, { zoneId: c.zone_id });
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
        (isSelected
          ? 'surface-selected border-emerald-500 bg-emerald-50'
          : 'surface-opaque border-zinc-100 bg-white dark:bg-zinc-900')
      }
      style={{ height: 140 }}
    >
      {isBest && (
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-xs font-medium text-white">
          <Star size={12} aria-hidden /> {t('results.best')}
        </span>
      )}
      <div className="font-medium">
        {t('results.zone', { id: c.zone_id })}
        <span className="ml-2 text-zinc-500">•</span>
        <span className="ml-2">
          {t('results.free', { free: c.current_free_count, capacity: c.capacity })}
        </span>
        <span className="ml-2 text-zinc-500">•</span>
        <span className="ml-2">
          {c.pay === 0 ? (
            <span className="font-semibold text-emerald-700 dark:text-emerald-300">
              {t('results.freePrice')}
            </span>
          ) : (
            <>{t('results.hourPrice', { price: c.pay })}</>
          )}
        </span>
      </div>
      {c.predicted_free_count !== null && arrivalLabel && (
        <div className="text-xs text-zinc-600">
          {t('results.forecast', {
            count: forecastCount,
            time: arrivalLabel,
          })}
        </div>
      )}
      <div className="flex items-center gap-1 text-xs text-zinc-600">
        <MapPin size={12} aria-hidden />
        {t('results.driving', { distance: c.distance_from_origin_meters, duration: durationLabel })}
      </div>
      {c.distance_to_destination_meters !== null && (
        <div className="flex items-center gap-1 text-xs text-zinc-600">
          <Target size={12} aria-hidden />
          {t('results.toDestination', { distance: c.distance_to_destination_meters })}
        </div>
      )}
      <div className="text-xs text-zinc-500">
        {t('results.confidence', { percent: Math.round(c.current_confidence * 100) })}
      </div>
    </button>
  );
}
