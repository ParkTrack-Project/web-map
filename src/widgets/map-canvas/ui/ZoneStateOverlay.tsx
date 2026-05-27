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

type ZoneWithDisplayedTime = ZoneMapItem & {
  observed_at?: string | null;
  occupancy_updated_at?: string | null;
};

function parseTimeMs(value?: string | null): number | null {
  if (!value) return null;

  const ms = Date.parse(value);

  return Number.isFinite(ms) ? ms : null;
}

function getDisplayedAtMs(zone: ZoneWithDisplayedTime): number | null {
  return parseTimeMs(zone.occupancy_updated_at ?? zone.observed_at);
}

function findNearestDisplayedTimeMs(
  zones: readonly ZoneMapItem[],
  selectedTimeMs: number,
): number | null {
  let nearestTimeMs: number | null = null;
  let nearestDiffMs = Number.POSITIVE_INFINITY;

  for (const zone of zones as readonly ZoneWithDisplayedTime[]) {
    const displayedTimeMs = getDisplayedAtMs(zone);

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

    const nearestDisplayedTimeMs = findNearestDisplayedTimeMs(data, selectedTimeMs);

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

  // Во время refetch тоже не показываем старую плашку поверх карты.
  if (isFetching) return null;

  // Больше не показываем:
  // - «не те фильтры»;
  // - «данных нет»;
  // - «прогноз недоступен»;
  // - generic error-state.
  //
  // Единственный разрешённый overlay — сильное расхождение выбранного времени
  // и времени реально отображаемых данных.
  if (!timeDrift || mode.kind === 'now') return null;

  const selectedLabel = formatMskTime(timeDrift.selectedTimeMs);
  const nearestLabel = formatMskTime(timeDrift.nearestDisplayedTimeMs);
  const diffLabel = formatTimeDiff(timeDrift.diffMs);

  return (
    <div
      role="status"
      className="pointer-events-none absolute inset-0 z-20 grid place-items-center bg-black/5"
    >
      <div className="pointer-events-auto max-w-sm rounded-xl bg-white p-4 text-center shadow-lg">
        <p className="text-sm font-medium text-zinc-900">
          Ближайшие доступные данные отличаются от выбранного времени на {diffLabel}
        </p>

        <p className="mt-1 text-xs text-zinc-500">
          Вы выбрали {selectedLabel} МСК, а сейчас отображаются данные за {nearestLabel} МСК.
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