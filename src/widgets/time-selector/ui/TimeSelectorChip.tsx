import { Clock, History, TrendingUp } from 'lucide-react';
import { useTimeMode } from '@/features/select-time-mode';
import { formatTimeLabel, useI18n } from '@/shared/lib/i18n';

interface Props {
  onClick: () => void;
}

export function TimeSelectorChip({ onClick }: Props) {
  const { t, language } = useI18n();
  const { mode } = useTimeMode();
  const label = formatTimeLabel(mode, language);
  const display =
    mode.kind === 'now'
      ? t('time.now')
      : label.replace(
          language === 'ru' ? /^(История на |Прогноз на )/ : /^(History at |Forecast for )/,
          '',
        );
  const ariaLabel = t('time.aria', { label });

  const Icon = mode.kind === 'past' ? History : mode.kind === 'future' ? TrendingUp : Clock;
  const isActive = mode.kind !== 'now';

  return (
    <button
      type="button"
      data-testid="time-selector-trigger"
      onClick={onClick}
      aria-label={ariaLabel}
      className={
        'absolute top-[calc(env(safe-area-inset-top)+4rem)] left-2 z-30 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium shadow-md ring-1 backdrop-blur-md transition-all active:scale-95 lg:hidden ' +
        (isActive
          ? 'bg-emerald-50/95 text-emerald-800 ring-emerald-200 dark:bg-emerald-950/95 dark:text-emerald-200 dark:ring-emerald-700'
          : 'bg-white/95 text-zinc-700 ring-zinc-200/70 dark:bg-zinc-900/95 dark:text-zinc-100 dark:ring-zinc-700')
      }
    >
      <Icon
        size={13}
        aria-hidden
        className={
          isActive ? 'text-emerald-600 dark:text-emerald-300' : 'text-zinc-500 dark:text-zinc-300'
        }
      />
      <span>{display}</span>
    </button>
  );
}
