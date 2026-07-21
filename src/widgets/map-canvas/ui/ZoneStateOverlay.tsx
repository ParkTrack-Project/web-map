import { useMemo } from 'react';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import { useTimeMode } from '@/features/select-time-mode';
import { TimeModeUnavailableError, type ZoneMapItem } from '@/entities/zone';
import { useI18n } from '@/shared/lib/i18n';

const MAX_TIME_DRIFT_MS = 30 * 60 * 1000;

type TemporalModeKind = 'past' | 'future';

type ZoneWithTemporalFields = ZoneMapItem & Record<string, unknown>;

function parseTimeMs(value: unknown): number | null {
  if (typeof value !== 'string') return null;

  const ms = Date.parse(value);

  return Number.isFinite(ms) ? ms : null;
}

function getDisplayedAtMs(zone: ZoneWithTemporalFields, modeKind: TemporalModeKind): number | null {
  if (modeKind === 'future') {
    // Для прогноза displayed_at / predicted_for / forecasted_at —
    // это время, НА КОТОРОЕ построен прогноз.
    //
    // Важно: occupancy_updated_at для future не используем как основной источник,
    // потому что теперь там должно лежать время создания прогноза.
    return (
      parseTimeMs(zone['displayed_at']) ??
      parseTimeMs(zone['predicted_for']) ??
      parseTimeMs(zone['forecasted_at']) ??
      parseTimeMs(zone['forecast_at']) ??
      parseTimeMs(zone['at'])
    );
  }

  // Для истории displayed_at / observed_at / occupancy_updated_at —
  // это время наблюдения, которое реально отображается на карте.
  return (
    parseTimeMs(zone['displayed_at']) ??
    parseTimeMs(zone['observed_at']) ??
    parseTimeMs(zone['occupancy_updated_at']) ??
    parseTimeMs(zone['at'])
  );
}

function findNearestDisplayedTimeMs(
  zones: readonly ZoneMapItem[],
  selectedTimeMs: number,
  modeKind: TemporalModeKind,
): number | null {
  let nearestTimeMs: number | null = null;
  let nearestDiffMs = Number.POSITIVE_INFINITY;

  for (const zone of zones as readonly ZoneWithTemporalFields[]) {
    const displayedTimeMs = getDisplayedAtMs(zone, modeKind);

    if (displayedTimeMs === null) continue;

    const diffMs = Math.abs(displayedTimeMs - selectedTimeMs);

    if (diffMs < nearestDiffMs) {
      nearestDiffMs = diffMs;
      nearestTimeMs = displayedTimeMs;
    }
  }

  return nearestTimeMs;
}

function formatTimeDiff(diffMs: number, language: 'ru' | 'en'): string {
  const totalMinutes = Math.round(Math.abs(diffMs) / 60_000);

  if (totalMinutes < 60) {
    return `${totalMinutes} ${language === 'ru' ? 'мин' : 'min'}`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} ${language === 'ru' ? 'ч' : 'h'}`;
  }

  return `${hours} ${language === 'ru' ? 'ч' : 'h'} ${minutes} ${language === 'ru' ? 'мин' : 'min'}`;
}

export function ZoneStateOverlay() {
  const { t, language } = useI18n();
  const { data, error, isError, isPending, isFetching, refetch } = useFilteredZones();
  const { mode, setMode } = useTimeMode();

  const timeDrift = useMemo(() => {
    if (mode.kind === 'now') return null;
    if (!data || data.length === 0) return null;

    const selectedTimeMs = parseTimeMs(mode.at);

    if (selectedTimeMs === null) return null;

    const nearestDisplayedTimeMs = findNearestDisplayedTimeMs(data, selectedTimeMs, mode.kind);

    if (nearestDisplayedTimeMs === null) return null;

    const diffMs = Math.abs(nearestDisplayedTimeMs - selectedTimeMs);

    if (diffMs <= MAX_TIME_DRIFT_MS) return null;

    return {
      selectedTimeMs,
      nearestDisplayedTimeMs,
      diffMs,
    };
  }, [data, mode]);

  // Первый load — ничего не показываем.
  if (isPending && !data) return null;

  // Во время refetch не показываем промежуточные старые плашки.
  if (isFetching) return null;

  const isTemporalMode = mode.kind !== 'now';

  if (isError) {
    const message =
      error instanceof TimeModeUnavailableError && language === 'ru'
        ? error.message
        : error instanceof TimeModeUnavailableError
          ? t('map.forecastUnavailable')
          : t('map.loadFailed');

    return (
      <StateMessage
        message={message}
        retry={() => void refetch()}
        {...(isTemporalMode
          ? {
              returnNow: () => {
                void setMode({ kind: 'now' });
              },
            }
          : {})}
      />
    );
  }

  if (isTemporalMode && data?.length === 0) {
    return (
      <StateMessage
        message={mode.kind === 'past' ? t('map.noHistoricalData') : t('map.forecastUnavailable')}
        returnNow={() => {
          void setMode({ kind: 'now' });
        }}
      />
    );
  }

  // Больше не показываем:
  // - «не те фильтры»;
  // - «данных нет»;
  // - «прогноз недоступен»;
  // - generic error-state.
  //
  // Единственная плашка — когда выбранное время отличается от времени
  // реально отображаемых данных больше чем на 30 минут.
  if (!timeDrift || mode.kind === 'now') return null;

  const locale = language === 'ru' ? 'ru-RU' : 'en-US';
  const selectedLabel = new Intl.DateTimeFormat(locale, {
    timeZone: 'Europe/Moscow',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(timeDrift.selectedTimeMs));
  const nearestLabel = new Intl.DateTimeFormat(locale, {
    timeZone: 'Europe/Moscow',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(timeDrift.nearestDisplayedTimeMs));
  const diffLabel = formatTimeDiff(timeDrift.diffMs, language);

  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-white/70 backdrop-blur-[2px] dark:bg-zinc-950/70"
    >
      <div className="pointer-events-auto max-w-sm rounded-xl bg-white p-4 text-center shadow-xl dark:bg-zinc-900">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {t('map.timeDriftTitle')}
        </p>

        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">
          {t('map.timeDriftDescription', { selected: selectedLabel, nearest: nearestLabel })}
        </p>

        <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {t('map.timeDriftDifference', { difference: diffLabel })}
        </p>

        <button
          type="button"
          onClick={() => {
            setMode({
              kind: mode.kind,
              at: new Date(timeDrift.nearestDisplayedTimeMs).toISOString(),
            });
          }}
          className="mt-3 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
        >
          {t('map.timeDriftAction')}
        </button>
      </div>
    </div>
  );
}

function StateMessage({
  message,
  retry,
  returnNow,
}: {
  message: string;
  retry?: () => void;
  returnNow?: () => void;
}) {
  const { t } = useI18n();
  return (
    <div className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-white/70 p-4 backdrop-blur-[2px] dark:bg-zinc-950/70">
      <div className="pointer-events-auto max-w-sm rounded-xl bg-white p-4 text-center shadow-xl dark:bg-zinc-900">
        <p role="alert" className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          {message}
        </p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {retry && (
            <button
              type="button"
              onClick={retry}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium dark:border-zinc-700"
            >
              {t('common.retry')}
            </button>
          )}
          {returnNow && (
            <button
              type="button"
              onClick={returnNow}
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700"
            >
              {t('time.returnNow')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
