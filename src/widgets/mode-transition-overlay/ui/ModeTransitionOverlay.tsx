// TIME-06 / D-08: full-screen skeleton overlay при смене TimeMode.
//
// Pitfall #7: useIsFetching({queryKey: ['zones']}) видит ЛЮБОЙ zone-fetch,
// включая viewport pan. Без prevModeRef guard'а overlay показывался бы при каждом
// pan'е — плохой UX. Guard: сравниваем текущий mode с предыдущим;
// показываем overlay ТОЛЬКО если mode СМЕНИЛСЯ.
//
// D-08 timing:
// - Минимум 200мс показа (избегаем flash при cache hit)
// - Максимум 5с (хард-таймаут, чтобы не висеть вечно)
//
// N-5: hard-timeout 5с реализован через useRef + setTimeout, выставляемый
// ИМЕННО на момент mode change (НЕ на каждый fetching change). Раньше код
// reschedule'ил setTimeout на каждый useEffect run → таймаут никогда не
// срабатывал детерминированно. Теперь: при detect mode change → start timer;
// при normal exit (fetching=0+200мс) → clearTimeout.
//
// z-30 — выше ZoneStateOverlay (z-20), ниже vaul Drawer (z-40+).
// НЕ перекрывает TimeSelectorStrip (рендерится в layout вне MapCanvas-контейнера).
//
// Wiring в MapCanvas — Plan 04 Task 2.
import { useIsFetching } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';
import { useTimeMode } from '@/features/select-time-mode';
import type { TimeMode } from '@/entities/zone';
import { useI18n } from '@/shared/lib/i18n';

function modeChanged(prev: TimeMode, next: TimeMode): boolean {
  if (prev.kind !== next.kind) return true;
  if (prev.kind === 'now') return false;
  // past/past или future/future — сравниваем at
  return (prev as { at: string }).at !== (next as { at: string }).at;
}

export function ModeTransitionOverlay() {
  const { t } = useI18n();
  const { mode } = useTimeMode();
  const prevModeRef = useRef<TimeMode>(mode);
  const [shouldShow, setShouldShow] = useState(false);
  const showSinceRef = useRef<number | null>(null);
  const hardTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // D-42: aggregate fetchingCount across zones + routing-search subscriptions.
  // routing-search → overlay показывается также при первом search-fetch
  // при time-mode change (atomic-mode-switch coverage для ResultsPanel).
  const fetchingZones = useIsFetching({ queryKey: ['zones'] });
  const fetchingRouting = useIsFetching({ queryKey: ['routing-search'] });
  const fetchingCount = fetchingZones + fetchingRouting;

  // N-5: Detect mode change → enter showing state + start ONE hard timeout
  useEffect(() => {
    const prev = prevModeRef.current;
    if (modeChanged(prev, mode)) {
      setShouldShow(true);
      showSinceRef.current = Date.now();
      prevModeRef.current = mode;
      // Clear any previous hard timeout (overlap edge case: rapid mode changes)
      if (hardTimeoutRef.current) clearTimeout(hardTimeoutRef.current);
      hardTimeoutRef.current = setTimeout(() => {
        setShouldShow(false);
        hardTimeoutRef.current = null;
      }, 5_000);
    }
  }, [mode]);

  // Soft exit: fetchingCount → 0 + минимум 200мс показа → hide + clear hard timeout
  useEffect(() => {
    if (!shouldShow) return undefined;
    if (fetchingCount === 0 && showSinceRef.current) {
      const elapsed = Date.now() - showSinceRef.current;
      const remaining = Math.max(0, 200 - elapsed);
      const t = setTimeout(() => {
        setShouldShow(false);
        // Soft path успел — не нужно ждать hard timeout
        if (hardTimeoutRef.current) {
          clearTimeout(hardTimeoutRef.current);
          hardTimeoutRef.current = null;
        }
      }, remaining);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [fetchingCount, shouldShow]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hardTimeoutRef.current) clearTimeout(hardTimeoutRef.current);
    };
  }, []);

  if (!shouldShow) return null;

  // D-42 + UX-05: context-aware text — собственное Phase 4 решение.
  // routing-search активный → «Поиск парковок…»; иначе zones — «Загрузка данных…».
  const message =
    fetchingRouting > 0
      ? t('results.loading')
      : fetchingZones > 0
        ? t('time.loadingData')
        : t('common.loading');

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={message}
      data-testid="mode-transition-overlay"
      className="pointer-events-auto absolute inset-0 z-30 grid place-items-center bg-white/70 backdrop-blur-sm"
    >
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-600" />
        <p className="text-sm text-zinc-700">{message}</p>
      </div>
    </div>
  );
}
