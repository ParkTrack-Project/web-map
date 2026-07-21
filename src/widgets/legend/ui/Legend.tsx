// ZONE-05 / D-03: collapsible <details>-карточка в bottom-left.
// По умолчанию СВЁРНУТА — новый пользователь видит компактный chip «Легенда» и
// открывает по клику. Раньше open by default занимало много места карты + перекрывало
// контролы. Compact triggered open: max-w-[260px], меньшие swatches, tighter padding.
import { getZonePalette } from '@/shared/config';
import { useI18n, type MessageKey } from '@/shared/lib/i18n';
import { usePreferences } from '@/features/preferences';

interface Swatch {
  color: string;
  label: MessageKey;
}

export function Legend() {
  const { t } = useI18n();
  const theme = usePreferences((state) => state.theme);
  const zonePalette = getZonePalette(theme);
  const swatches: Swatch[] = [
    { color: zonePalette.freeHigh.fill, label: 'legend.freeFresh' },
    { color: zonePalette.freeLow.fill, label: 'legend.freeStale' },
    { color: zonePalette.one.fill, label: 'legend.one' },
    { color: zonePalette.full.fill, label: 'legend.full' },
    { color: zonePalette.inactive.fill, label: 'legend.inactive' },
  ];
  return (
    <details
      className="group absolute bottom-4 left-4 z-20 max-w-[240px] rounded-lg bg-white/95 text-xs shadow-lg lg:max-w-[260px]"
      style={{ maxHeight: '40vh', overflowY: 'auto' }}
    >
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-1.5 font-medium select-none"
        aria-label={t('legend.toggle')}
      >
        <span
          className="inline-block h-3 w-3 rounded-sm"
          style={{ background: zonePalette.freeHigh.fill }}
          aria-hidden
        />
        {t('legend.title')}
      </summary>
      <ul className="space-y-1.5 px-3 pb-2 text-xs">
        {swatches.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm border border-zinc-300"
              style={{ background: s.color }}
              aria-hidden
            />
            {t(s.label)}
          </li>
        ))}
        <li className="pt-1 text-[11px] leading-snug text-zinc-600">{t('legend.confidence')}</li>
      </ul>
    </details>
  );
}
