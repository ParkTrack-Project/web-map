import { Car, ChevronLeft, ChevronRight, Star, Target } from 'lucide-react';
import type { RouteCandidate } from '@/entities/zone';
import { formatDurationFromSeconds, useI18n } from '@/shared/lib/i18n';

interface SearchResultDetailsProps {
  candidate: RouteCandidate;
  index: number;
  total: number;
  onPrevious: () => void;
  onNext: () => void;
}

export function SearchResultDetails({
  candidate,
  index,
  total,
  onPrevious,
  onNext,
}: SearchResultDetailsProps) {
  const { t, language, formatCount } = useI18n();
  const duration = formatDurationFromSeconds(candidate.duration_from_origin_seconds, language);
  const forecastTime = candidate.predicted_for_arrival
    ? new Intl.DateTimeFormat(language === 'ru' ? 'ru-RU' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/Moscow',
      }).format(new Date(candidate.predicted_for_arrival))
    : null;

  return (
    <section
      aria-label={t('results.details')}
      className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 text-sm dark:border-zinc-700 dark:bg-zinc-800"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="font-semibold">
          {t('results.position', { current: index + 1, total })}
        </span>
        {candidate.rank === 1 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-700 px-2 py-0.5 text-xs font-medium text-white">
            <Star size={12} aria-hidden />
            {t('results.best')}
          </span>
        )}
      </div>

      <div className="space-y-1 text-zinc-700 dark:text-zinc-200">
        <p className="flex items-center gap-1.5">
          <Car size={14} aria-hidden />
          {t('results.driving', {
            distance: candidate.distance_from_origin_meters,
            duration,
          })}
        </p>
        {candidate.distance_to_destination_meters !== null && (
          <p className="flex items-center gap-1.5">
            <Target size={14} aria-hidden />
            {t('results.toDestination', {
              distance: candidate.distance_to_destination_meters,
            })}
          </p>
        )}
        {candidate.predicted_free_count !== null && forecastTime && (
          <p>
            {t('results.forecast', {
              count: formatCount('space', candidate.predicted_free_count),
              time: forecastTime,
            })}
          </p>
        )}
        <p>
          {t('results.confidence', {
            percent: Math.round(candidate.current_confidence * 100),
          })}
        </p>
      </div>

      <nav className="mt-3 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <button
          type="button"
          onClick={onPrevious}
          disabled={index === 0}
          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-zinc-300 bg-white px-2 font-medium hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-700"
          aria-label={t('results.previous')}
        >
          <ChevronLeft size={17} aria-hidden />
          <span className="hidden min-[360px]:inline">{t('results.previousShort')}</span>
        </button>
        <span className="text-xs text-zinc-500" aria-hidden>
          {index + 1}/{total}
        </span>
        <button
          type="button"
          onClick={onNext}
          disabled={index === total - 1}
          className="inline-flex min-h-10 items-center justify-center gap-1 rounded-lg border border-zinc-300 bg-white px-2 font-medium hover:bg-zinc-100 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900 dark:hover:bg-zinc-700"
          aria-label={t('results.next')}
        >
          <span className="hidden min-[360px]:inline">{t('results.nextShort')}</span>
          <ChevronRight size={17} aria-hidden />
        </button>
      </nav>
    </section>
  );
}
