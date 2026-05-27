import { useMemo } from 'react';
import { useFilteredZones } from '@/features/viewport-driven-zones';
import { useTimeMode } from '@/features/select-time-mode';
import type { ZoneMapItem } from '@/entities/zone';

const MAX_TIME_DRIFT_MS = 30 * 60 * 1000;

const MSK_FORMATTER = new Intl.DateTimeFormat('ru-RU', {
  timeZone: 'Europe/Moscow',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

type TemporalModeKind = 'past' | 'future';

type ZoneWithTemporalFields = ZoneMapItem & Record<string, unknown>;

function parseTimeMs(value: unknown): number | null {
  if (typeof value !== 'string') return null;

  const ms = Date.parse(value);

  return Number.isFinite(ms) ? ms : null;
}

function getDisplayedAtMs(
  zone: ZoneWithTemporalFields,
  modeKind: TemporalModeKind,
): number | null {
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

function formatMskTime(timeMs: number): string {
  return MSK_FORMATTER.format(new Date(timeMs));
}

function formatTimeDiff(diffMs: number): string {
  const totalMinutes = Math.round(Math.abs(diffMs) / 60_000);

  if (totalMinutes < 60) {
    return `${totalMinutes} мин`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (minutes === 0) {
    return `${hours} ч`;
  }

  return `${hours} ч ${minutes} мин`;
}

export function ZoneStateOverlay() {
  const { data, isPending, isFetching } = useFilteredZones();
  const { mode, setMode } = useTimeMode();

  const timeDrift = useMemo(() => {
    if (mode.kind === 'now') return null;
    if (!data || data.length === 0) return null;

    const selectedTimeMs = parseTimeMs(mode.at);

    if (selectedTimeMs === null) return null;

    const nearestDisplayedTimeMs = findNearestDisplayedTimeMs(
      data,
      selectedTimeMs,
      mode.kind,
    );

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

  // Больше не показываем:
  // - «не те фильтры»;
  // - «данных нет»;
  // - «прогноз недоступен»;
  // - generic error-state.
  //
  // Единственная плашка — когда выбранное время отличается от времени
  // реально отображаемых данных больше чем на 30 минут.
  if (!timeDrift || mode.kind === 'now') return null;

  const selectedLabel = formatMskTime(timeDrift.selectedTimeMs);
  const nearestLabel = formatMskTime(timeDrift.nearestDisplayedTimeMs);
  const diffLabel = formatTimeDiff(timeDrift.diffMs);

  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-0 z-40 grid place-items-center bg-white/70 backdrop-blur-[2px]"
    >
      <div className="pointer-events-auto max-w-sm rounded-xl bg-white p-4 text-center shadow-xl">
        <p className="text-sm font-semibold text-zinc-900">
          Для выбранного времени нет точных данных
        </p>

        <p className="mt-1 text-xs text-zinc-600">
          Вы выбрали {selectedLabel} МСК, а ближайшие доступные данные есть на{' '}
          {nearestLabel} МСК.
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          Разница составляет {diffLabel}.
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
          Выбрать ближайшее доступное время
        </button>
      </div>
    </div>
  );
}