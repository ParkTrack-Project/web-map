import { clsx } from 'clsx';
import type { ReactNode } from 'react';

interface Props {
  pressed: boolean;
  onToggle: () => void;
  children: ReactNode;
}

export function FilterChip({ pressed, onToggle, children }: Props) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onToggle}
      className={clsx(
        'rounded-full px-3 py-1.5 text-sm transition focus-visible:outline-none',
        pressed
          ? 'bg-emerald-600 text-white hover:bg-emerald-700'
          : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200',
      )}
    >
      {children}
    </button>
  );
}
