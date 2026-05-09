// ZONE-05 / D-03: collapsible <details>-карточка в bottom-left.
// По умолчанию СВЁРНУТА — новый пользователь видит компактный chip «Легенда» и
// открывает по клику. Раньше open by default занимало много места карты + перекрывало
// контролы. Compact triggered open: max-w-[260px], меньшие swatches, tighter padding.
import { zonePalette } from '@/shared/config';

interface Swatch {
  color: string;
  label: string;
}

const SWATCHES: Swatch[] = [
  { color: zonePalette.freeHigh.fill, label: 'Свободно, свежие' },
  { color: zonePalette.freeLow.fill, label: 'Свободно, старые' },
  { color: zonePalette.one.fill, label: '1 место' },
  { color: zonePalette.full.fill, label: 'Нет мест' },
  { color: zonePalette.inactive.fill, label: 'Неактивна / нет данных' },
];

export function Legend() {
  return (
    <details
      className="group absolute bottom-4 left-4 z-20 max-w-[240px] rounded-lg bg-white/95 text-xs shadow-lg lg:max-w-[260px]"
      style={{ maxHeight: '40vh', overflowY: 'auto' }}
    >
      <summary
        className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-1.5 font-medium select-none"
        aria-label="Свернуть или развернуть легенду"
      >
        <span
          className="inline-block h-3 w-3 rounded-sm"
          style={{ background: zonePalette.freeHigh.fill }}
          aria-hidden
        />
        Легенда
      </summary>
      <ul className="space-y-1.5 px-3 pb-2 text-xs">
        {SWATCHES.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span
              className="inline-block h-3 w-3 rounded-sm border border-zinc-300"
              style={{ background: s.color }}
              aria-hidden
            />
            {s.label}
          </li>
        ))}
        <li className="pt-1 text-[11px] leading-snug text-zinc-600">
          «Уверенность» — насколько свежи данные о занятости (камеры обновляются ~раз в минуту)
        </li>
      </ul>
    </details>
  );
}
