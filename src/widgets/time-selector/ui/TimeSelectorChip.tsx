// TIME-03 mobile / D-02 / D-04 / I-1:
// Mobile chip-кнопка ПОД FiltersFAB. FiltersFAB сидит в top-4 right-4 z-30;
// мы — top-16 right-4 z-30 (вертикальный стек справа). Исполняет CONTEXT D-02
// «рядом с FAB-фильтры, верхний-правый угол» + лучше для thumb-reach.
//
// Sheet-state lifted: chip получает open/onOpenChange.
import { useTimeMode } from '@/features/select-time-mode';
import { formatTimeLabelRu } from '@/shared/lib/i18n';

interface Props {
  onClick: () => void;
}

function emojiFor(kind: 'past' | 'now' | 'future'): string {
  if (kind === 'now') return '🕐';
  if (kind === 'past') return '📜';
  return '🔮';
}

export function TimeSelectorChip({ onClick }: Props) {
  const { mode } = useTimeMode();
  const label = formatTimeLabelRu(mode);
  const display =
    mode.kind === 'now' ? 'Сейчас' : label.replace(/^(История на |Прогноз на )/, '');
  const ariaLabel = mode.kind === 'now' ? 'Время: Сейчас' : `Время: ${label}`;

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      className="absolute top-16 right-4 z-30 flex items-center gap-2 rounded-full bg-white px-3 py-2 text-sm shadow-lg lg:hidden"
    >
      <span aria-hidden>{emojiFor(mode.kind)}</span>
      <span>{display}</span>
    </button>
  );
}
