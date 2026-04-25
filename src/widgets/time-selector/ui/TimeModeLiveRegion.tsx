// A11Y-03 / D-17: ARIA live region объявляет смену TimeMode для скрин-ридеров.
// Debounce 500мс (Pitfall #8) — при rapid mode toggle SR не спамит.
// Lazy initial: первое объявление приходит только после первой СМЕНЫ mode
// (не при mount), иначе SR зачитает «Режим: Сейчас» при каждом mount страницы.
import { useEffect, useRef, useState } from 'react';
import { useTimeMode } from '@/features/select-time-mode';
import { formatTimeLabelRu } from '@/shared/lib/i18n';

export function TimeModeLiveRegion() {
  const { mode } = useTimeMode();
  const [announcement, setAnnouncement] = useState('');
  const isFirstRef = useRef(true);

  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      return; // skip initial announcement
    }
    const t = setTimeout(() => {
      setAnnouncement(`Режим: ${formatTimeLabelRu(mode, { full: true })}`);
    }, 500);
    return () => clearTimeout(t);
  }, [mode]);

  return (
    <output
      role="status"
      aria-live="polite"
      className="sr-only"
      data-testid="time-mode-live-region"
    >
      {announcement}
    </output>
  );
}
