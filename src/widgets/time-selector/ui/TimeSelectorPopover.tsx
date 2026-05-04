// TIME-03 desktop / D-01 / D-03:
// Floating compact pill в top-4 left-4 (зеркало FiltersFAB справа на mobile).
// При клике открывается Radix Popover с TimeSelectorContent — экономит
// vertical space карты (раньше strip занимал ~120px сверху).
//
// UI iter 2: убран backdrop-blur (создавал лишний halo на карте), shadow
// снижен до shadow-md, animation = fade-only (без zoom-in/out — на карте
// zoom выглядел как «замыливание»).
import * as Popover from '@radix-ui/react-popover';
import { Clock, History, TrendingUp } from 'lucide-react';
import { useTimeMode } from '@/features/select-time-mode';
import { formatTimeLabelRu } from '@/shared/lib/i18n';
import { TimeSelectorContent } from './TimeSelectorContent';

export function TimeSelectorPopover() {
  const { mode } = useTimeMode();
  const Icon = mode.kind === 'past' ? History : mode.kind === 'future' ? TrendingUp : Clock;
  // Quick task 260426-hhb: short-form display (без «История на »/«Прогноз на »
  // prefix-text) — consistency с TimeSelectorChip mobile.
  const fullLabel = formatTimeLabelRu(mode);
  const display =
    mode.kind === 'now' ? 'Сейчас' : fullLabel.replace(/^(История на |Прогноз на )/, '');
  const isActive = mode.kind !== 'now';

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={`Время: ${display}`}
          className={
            'hidden items-center gap-1.5 rounded-full px-3 py-1.5 text-[13px] font-medium shadow-sm ring-1 transition-colors active:scale-[0.98] lg:inline-flex ' +
            (isActive
              ? 'bg-emerald-50 text-emerald-800 ring-emerald-200 hover:bg-emerald-100'
              : 'bg-white text-zinc-700 ring-zinc-200 hover:bg-zinc-50')
          }
        >
          <Icon size={13} aria-hidden className={isActive ? 'text-emerald-600' : 'text-zinc-500'} />
          <span>{display}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="start"
          sideOffset={6}
          className="data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 z-50 w-[380px] rounded-xl border border-zinc-200 bg-white shadow-md outline-none"
        >
          <TimeSelectorContent />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
