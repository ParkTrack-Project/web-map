// D-09: chip + popover-slider (FILTER-02/03) и chip + popover-checkboxes (FILTER-06).
// Используем Radix Popover (headless, focus trap, Esc, click-outside, a11y «из
// коробки»). Trigger — обычная chip-кнопка (визуально аналогична FilterChip);
// Content — slider или checkbox-group.
import * as Popover from '@radix-ui/react-popover';
import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface Props {
  label: ReactNode; // Текст на chip-trigger'е (например, «Уверенность ≥ 50%»)
  active: boolean; // Подсветка active state — фильтр НЕ в дефолте
  children: ReactNode; // Контент popover'а (slider / checkbox-group)
  ariaLabel?: string; // a11y-метка для trigger'а
}

export function FilterPopoverChip({ label, active, children, ariaLabel }: Props) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={ariaLabel}
          aria-pressed={active}
          className={clsx(
            'rounded-full px-3 py-1.5 text-sm transition focus-visible:outline-none',
            active
              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
              : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
          )}
        >
          {label}
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={6}
          className="z-50 rounded-lg bg-white p-4 shadow-lg outline-none"
        >
          {children}
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
