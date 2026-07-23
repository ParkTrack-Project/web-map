import { TimeSelectorContent } from './TimeSelectorContent';
import { useI18n } from '@/shared/lib/i18n';

export function TimeSelectorStrip() {
  const { t } = useI18n();
  return (
    <div
      role="toolbar"
      aria-label={t('time.selector')}
      className="hidden border-b border-zinc-200/70 bg-white/85 backdrop-blur-md lg:block"
    >
      <div className="mx-auto max-w-5xl">
        <TimeSelectorContent />
      </div>
    </div>
  );
}
