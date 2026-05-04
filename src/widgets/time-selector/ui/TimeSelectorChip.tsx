// TIME-03 mobile / D-02 / D-04 / I-1:
// Mobile chip-кнопка ПОД FiltersFAB. FiltersFAB сидит в top-4 right-4 z-30;
// мы — top-16 right-4 z-30 (вертикальный стек справа).
//
// Glass-style chip с lucide иконкой — современнее + читаемее на любом фоне карты.
//
// Quick task 260426-hhb (SUPERSEDES D-03):
// Derived mode display: показываем «Сейчас» либо короткое форматированное
// время («12 апр 09:00») без mode-prefix («История на » / «Прогноз на »).
// Иконка остаётся mode-aware (History / TrendingUp / Clock) как тонкий
// visual hint для quick state recognition.
import { Clock, History, TrendingUp } from 'lucide-react';
import { useTimeMode } from '@/features/select-time-mode';
import { formatTimeLabelRu } from '@/shared/lib/i18n';

interface Props {
  onClick: () => void;
}

export function TimeSelectorChip({ onClick }: Props) {
  const { mode } = useTimeMode();
  const label = formatTimeLabelRu(mode);
  const display = mode.kind === 'now' ? 'Сейчас' : label.replace(/^(История на |Прогноз на )/, '');
  const ariaLabel = mode.kind === 'now' ? 'Время: Сейчас' : `Время: ${label}`;

  const Icon = mode.kind === 'past' ? History : mode.kind === 'future' ? TrendingUp : Clock;
  const isActive = mode.kind !== 'now';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className={
        'absolute top-16 right-4 z-30 inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium shadow-md ring-1 backdrop-blur-md transition-all active:scale-95 lg:hidden ' +
        (isActive
          ? 'bg-emerald-50/95 text-emerald-800 ring-emerald-200'
          : 'bg-white/95 text-zinc-700 ring-zinc-200/70')
      }
    >
      <Icon size={13} aria-hidden className={isActive ? 'text-emerald-600' : 'text-zinc-500'} />
      <span>{display}</span>
    </button>
  );
}
