import { useEffect, useRef, useState } from 'react';
import { useTimeMode } from '@/features/select-time-mode';
import { formatTimeLabel, useI18n } from '@/shared/lib/i18n';

export function TimeModeLiveRegion() {
  const { t, language } = useI18n();
  const { mode } = useTimeMode();
  const [announcement, setAnnouncement] = useState('');
  const isFirstRef = useRef(true);

  useEffect(() => {
    if (isFirstRef.current) {
      isFirstRef.current = false;
      return; // skip initial announcement
    }
    const timer = setTimeout(() => {
      setAnnouncement(t('time.mode', { label: formatTimeLabel(mode, language, { full: true }) }));
    }, 500);
    return () => clearTimeout(timer);
  }, [language, mode, t]);

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
